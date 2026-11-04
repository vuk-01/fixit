// Demo reports for `pnpm db:seed-demo` (DB.md §12.4): written once, directly in their final
// state, with the service key. Only while citizen-seed has no report at all; trial reports from
// the dev-* and citizen-video accounts do not count. The plan itself is in demo-plan.ts.
// No email is sent and no model is called: dispatches are recorded as test-mode successes.
// Plain Node 24 runs this file: relative `.ts` imports, no `@/` (Tech.md §11).
import { randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"

import type { SupabaseClient } from "@supabase/supabase-js"

import { CATEGORIES, dayCounterText, STATUS_LABELS } from "../lib/constants.ts"
import type { Database } from "../lib/supabase/database.types"

import {
  buildLetterRows,
  buildReportRows,
  planDemoReports,
  RECORDING_DAY_NOON,
  renderDemoLetter,
  type DemoInstitution,
  type DemoJurisdiction,
  type DemoRowIds,
  type PlannedReport,
} from "./demo-plan.ts"

type Client = SupabaseClient<Database>

const BUCKET = "report-photos"
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

// Subject and body from the same template as real letters (demo-plan.ts → letter-template.ts).
// previousReports comes from count_previous_reports, called right after this report's row is
// inserted (the RPC needs the row and its location), like sendReport does for a real letter.
function demoLetter(item: Prepared, code: string, previousReports: number) {
  if (!item.institutionName) {
    throw new Error(`Demo prijava ${item.report.row}: dopis bez primaoca.`)
  }
  return renderDemoLetter(item.report, {
    code,
    previousReports,
    institutionName: item.institutionName,
    ccInstitutionName: item.ccInstitutionName,
  })
}

type Institution = {
  id: string
  slug: string
  name: string
  email: string | null
  is_active: boolean
}

type Prepared = {
  report: PlannedReport
  jurisdiction: DemoJurisdiction
  institutionName: string | null
  ccInstitutionName: string | null
  photo: Buffer | null
}

function check(error: { message: string } | null, what: string) {
  if (error) throw new Error(`${what}: ${error.message}`)
}

async function prepare(supabase: Client, plan: PlannedReport[]) {
  const { data: institutions, error } = await supabase
    .from("institutions")
    .select("id, slug, name, email, is_active")
  check(error, "institutions")
  const bySlug = new Map(
    (institutions ?? []).map((i): [string, Institution] => [i.slug, i])
  )
  const byId = new Map(
    (institutions ?? []).map((i): [string, Institution] => [i.id, i])
  )

  const prepared: Prepared[] = []
  for (const report of plan) {
    const label = `Demo prijava ${report.row}`

    // the point is in Podgorica (the trigger would refuse it anyway)
    const { data: municipalityId, error: municipalityError } =
      await supabase.rpc("resolve_municipality", {
        p_lat: report.lat,
        p_lng: report.lng,
      })
    check(municipalityError, `${label}: resolve_municipality`)
    if (!municipalityId) throw new Error(`${label}: tačka nije u Podgorici.`)

    // The recipient comes only from jurisdiction_rules, through resolve_jurisdiction (golden
    // rule 1). The plan names the institution it expects only so a changed rule stops the seed.
    const { data: rows, error: jurisdictionError } = await supabase.rpc(
      "resolve_jurisdiction",
      {
        p_category: report.category,
        p_municipality_id: municipalityId,
      }
    )
    check(jurisdictionError, `${label}: resolve_jurisdiction`)
    const result = rows?.[0]
    if (!result)
      throw new Error(`${label}: resolve_jurisdiction nije vratio red.`)

    const institution = result.institution_id
      ? byId.get(result.institution_id)
      : undefined
    const cc = result.cc_institution_id
      ? byId.get(result.cc_institution_id)
      : undefined
    const expectedCc = report.ccInstitutionSlug
      ? bySlug.get(report.ccInstitutionSlug)
      : undefined
    if (report.institutionSlug) {
      if (
        result.outcome !== "matched" ||
        institution?.slug !== report.institutionSlug
      ) {
        throw new Error(
          `${label}: pravilo za ${report.category} daje ${result.outcome}/${institution?.slug}, plan očekuje ${report.institutionSlug}.`
        )
      }
      // a copy without a verified email is left out by resolve_jurisdiction (14 Q8)
      const ccExpected =
        expectedCc?.email && expectedCc.is_active ? expectedCc.slug : undefined
      if (cc?.slug !== ccExpected) {
        throw new Error(
          `${label}: kopija je ${cc?.slug ?? "—"}, plan očekuje ${ccExpected ?? "—"}.`
        )
      }
    } else if (result.outcome !== "no_rule") {
      throw new Error(
        `${label}: za ${report.category} plan očekuje no_rule, a pravilo daje ${result.outcome}.`
      )
    }

    const asInstitution = (
      i: Institution | undefined
    ): DemoInstitution | null => (i ? { id: i.id, email: i.email } : null)

    let photo: Buffer | null = null
    if (report.photo) {
      photo = await readFile(
        new URL(`./demo-photos/${report.photo}`, import.meta.url)
      )
      const isJpeg = photo[0] === 0xff && photo[1] === 0xd8 && photo[2] === 0xff
      if (!isJpeg || photo.length > MAX_PHOTO_BYTES)
        throw new Error(`${label}: ${report.photo} nije JPEG do 5 MB.`)
    }

    prepared.push({
      report,
      jurisdiction: {
        ruleId: report.institutionSlug ? result.rule_id : null,
        institution: asInstitution(institution),
        cc: asInstitution(cc),
      },
      institutionName: institution?.name ?? null,
      ccInstitutionName: cc?.name ?? null,
      photo,
    })
  }

  return {
    prepared,
    institutionIdBySlug: new Map([...bySlug].map(([slug, i]) => [slug, i.id])),
  }
}

async function insert<T extends keyof Database["public"]["Tables"]>(
  supabase: Client,
  table: T,
  rows:
    | Database["public"]["Tables"][T]["Insert"]
    | Database["public"]["Tables"][T]["Insert"][],
  what: string
) {
  // the generic overloads of supabase-js do not narrow on a table union
  const { error } = await supabase.from(table).insert(rows as never)
  check(error, `${what}: ${table}`)
}

export async function seedDemoReports(supabase: Client, reporterId: string) {
  const { count, error: countError } = await supabase
    .from("report_private")
    .select("report_id", { count: "exact", head: true })
    .eq("reporter_id", reporterId)
  check(countError, "report_private")
  if (count) {
    console.log(
      `Demo prijave već postoje (citizen-seed ima ${count}); dio za prijave je preskočen.`
    )
    return
  }

  // Throws before any write if a counter on the recording day would differ from DB.md §12.4.
  const plan = planDemoReports(new Date())
  const { prepared, institutionIdBySlug } = await prepare(supabase, plan)

  // the template must render before anything is written
  const firstSent = prepared.find((item) => item.report.institutionSlug)
  if (firstSent) demoLetter(firstSent, "FX-2026-00000", 0)

  const uploaded: string[] = []
  const created: string[] = []
  const codes: string[] = []
  const summary: Record<string, string | number>[] = []

  try {
    const photoPath = new Map<number, string>()
    for (const item of prepared) {
      if (!item.photo) continue
      // a new name for every upload, like a real report (DB.md §10)
      const path = `${randomUUID()}.jpg`
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, item.photo, { contentType: "image/jpeg", upsert: false })
      check(error, `Demo prijava ${item.report.row}: otprema fotografije`)
      uploaded.push(path)
      photoPath.set(item.report.row, path)
    }

    // oldest first, so codes follow the order of submission (FR-24)
    for (const item of prepared) {
      const { report, jurisdiction } = item
      const label = `Demo prijava ${report.row}`

      const { data: code, error: codeError } =
        await supabase.rpc("next_report_code")
      check(codeError, `${label}: next_report_code`)
      if (!code) throw new Error(`${label}: next_report_code nije vratio kod.`)
      codes.push(code)

      const sent = report.institutionSlug !== null
      const ids: DemoRowIds = {
        reportId: randomUUID(),
        photoId: report.photo ? randomUUID() : null,
        photoPath: photoPath.get(report.row) ?? null,
        letterId: sent ? randomUUID() : null,
        dispatchId: sent ? randomUUID() : null,
        eventIds: report.events.map(() => randomUUID()),
      }
      const rows = buildReportRows(
        report,
        ids,
        code,
        reporterId,
        jurisdiction,
        institutionIdBySlug
      )

      await insert(supabase, "reports", rows.report, label)
      created.push(ids.reportId)
      await insert(supabase, "report_private", rows.reportPrivate, label)
      await insert(supabase, "report_details", rows.details, label)
      if (rows.photo) await insert(supabase, "report_photos", rows.photo, label)

      if (sent) {
        // same count as a real letter: earlier reports of this category within 50 m
        const { data: previous, error: previousError } = await supabase.rpc(
          "count_previous_reports",
          {
            p_report_id: ids.reportId,
          }
        )
        check(previousError, `${label}: count_previous_reports`)
        const letter = demoLetter(item, code, previous ?? 0)
        const letterRows = buildLetterRows(report, ids, jurisdiction, letter)
        await insert(supabase, "letters", letterRows.letter, label)
        await insert(supabase, "dispatches", letterRows.dispatch, label)
      }

      await insert(supabase, "report_events", rows.events, label)

      summary.push({
        kod: code,
        red: report.row,
        vrsta: CATEGORIES[report.category].label,
        status: STATUS_LABELS[report.status].public,
        institucija: item.institutionName ?? "—",
        "brojač u petak":
          dayCounterText(
            {
              status: report.status,
              submitted_at: report.submittedAt.toISOString(),
              closed_at: report.closedAt?.toISOString() ?? null,
            },
            RECORDING_DAY_NOON
          ) ?? "",
        podrške: report.likeCount,
        adresa: report.address,
      })
    }
  } catch (error) {
    // Leave no half-made set behind: a second run would see citizen-seed's reports and skip.
    // Only rows and files made by this run are removed; used codes stay used (gaps are fine, FR-24).
    console.error(
      "Pravljenje demo prijava nije uspjelo; brišem ono što je ovo pokretanje napravilo."
    )
    if (created.length) {
      const { error: deleteError } = await supabase
        .from("reports")
        .delete()
        .in("id", created)
      if (deleteError)
        console.error(`Brisanje prijava nije uspjelo: ${deleteError.message}`)
    }
    if (uploaded.length) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET)
        .remove(uploaded)
      if (removeError)
        console.error(
          `Brisanje fotografija nije uspjelo: ${removeError.message}`
        )
    }
    if (codes.length) console.error(`Potrošeni kodovi: ${codes.join(", ")}.`)
    throw error
  }

  console.table(summary)
  console.log(
    `Napravljeno ${summary.length} demo prijava (${codes[0]} … ${codes[codes.length - 1]}).`
  )
}
