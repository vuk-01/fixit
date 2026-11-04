import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { PrepareStep, PublicReportStatus, ReportCategory } from "@/lib/constants"
import { reverseGeocode } from "@/lib/geo/reverse"
import type { Database, Json } from "@/lib/supabase/database.types"

import type {
  DuplicateReport,
  InstitutionRef,
  JurisdictionResult,
  PrepareErrorCode,
  PrepareEvent,
  PrepareResult,
  PreviewLetter,
} from "./steps"

// The steps of POST /api/agent/prepare (Tech.md §6, point 2; DB.md §8.5, point 2). No model
// call anywhere here: the recipient comes only from resolve_jurisdiction (AGENTS.md rule 1).
// Each step sends `step` events (started → done / failed) and leaves one agent_runs row (FR-13).

type Db = SupabaseClient<Database>

export type PrepareInput = {
  reportId: string
  userId: string
  lat: number
  lng: number
  category: ReportCategory
}

// what the route read about the draft while checking that it is the citizen's
export type DraftSnapshot = {
  lat: number | null
  lng: number | null
  address: string | null
  addressSource: string | null
}

export type PrepareDeps = {
  // the citizen's session: RLS and the role checks inside the functions apply
  supabase: Db
  // service key, only for update_draft, agent_runs and signing a photo URL (Tech.md §4)
  admin: Db
  // the letter step (lib/email/report-letter.ts → letter-template.ts)
  buildLetter: (input: LetterInput) => Promise<PreviewLetter>
}

export type LetterInput = {
  reportId: string
  category: ReportCategory
  lat: number
  lng: number
  address: string | null
  jurisdiction: JurisdictionResult
}

const SIGNED_URL_SECONDS = 60 * 60

// codes the database raises that the citizen gets a message for; anything else is "unknown"
const PASSED_ON: readonly PrepareErrorCode[] = ["outside_area", "not_allowed", "not_found", "invalid_state"]

function codeOf(error: { message?: string } | null | undefined): PrepareErrorCode {
  const message = error?.message as PrepareErrorCode | undefined
  return message && PASSED_ON.includes(message) ? message : "unknown"
}

class StepError extends Error {
  constructor(readonly code: PrepareErrorCode) {
    super(code)
  }
}

export async function runPrepare(
  deps: PrepareDeps,
  input: PrepareInput,
  draft: DraftSnapshot,
  emit: (event: PrepareEvent) => void,
): Promise<void> {
  const logs: Promise<unknown>[] = []

  // one agent_runs row per step, written when the step ends (no name, email or image; tiket 11)
  async function step<T>(name: PrepareStep, run: () => Promise<{ value: T; meta?: Json }>): Promise<T> {
    const started = Date.now()
    emit({ event: "step", data: { step: name, status: "started" } })
    let outcome: "ok" | "error" = "ok"
    let errorCode: string | null = null
    let meta: Json | null = null
    try {
      const { value, meta: m } = await run()
      meta = m ?? null
      emit({ event: "step", data: { step: name, status: "done" } })
      return value
    } catch (error) {
      outcome = "error"
      errorCode = error instanceof StepError ? error.code : "unknown"
      if (!(error instanceof StepError)) console.error(`prepare: ${name} failed`, error)
      emit({ event: "step", data: { step: name, status: "failed" } })
      throw error
    } finally {
      const finished = Date.now()
      logs.push(
        Promise.resolve(
          deps.admin.from("agent_runs").insert({
            report_id: input.reportId,
            user_id: input.userId,
            step: name,
            started_at: new Date(started).toISOString(),
            finished_at: new Date(finished).toISOString(),
            duration_ms: finished - started,
            outcome,
            error_code: errorCode,
            meta,
          }),
        ).then(
          (r) => r.error && console.error("prepare: agent_runs insert failed", r.error.code),
          () => console.error("prepare: agent_runs insert failed"),
        ),
      )
    }
  }

  try {
    const { address, jurisdiction } = await step("jurisdiction", () => jurisdictionStep(deps, input, draft))

    // a failed duplicate check does not stop the report: it goes on without an offer
    const duplicate = await step("duplicates", () => duplicatesStep(deps, input)).catch(() => null)

    const letterInput: LetterInput = { ...input, address, jurisdiction }
    // the preview is only shown under "Prikaži cijeli tekst"; sendReport renders the real letter,
    // so a failed preview does not stop the report either
    const letter = await step("letter", async () => ({ value: await deps.buildLetter(letterInput) })).catch(() => null)

    const result: PrepareResult = {
      reportId: input.reportId,
      category: input.category,
      lat: input.lat,
      lng: input.lng,
      address,
      jurisdiction,
      duplicate,
      letter,
    }
    emit({ event: "result", data: result })
  } catch (error) {
    emit({ event: "error", data: { code: error instanceof StepError ? error.code : "unknown" } })
  } finally {
    // the result goes out first; the log rows only have to land before the stream closes
    await Promise.all(logs)
  }
}

// 1. jurisdiction (FR-4, FR-8, Tech.md §8 "Adresa"): municipality, final address, update_draft,
// resolve_jurisdiction. The address is looked up once: when the pin did not move, the stored one
// is used again (e.g. after "Promijeni vrstu").
async function jurisdictionStep(
  { supabase, admin }: PrepareDeps,
  input: PrepareInput,
  draft: DraftSnapshot,
): Promise<{ value: { address: string | null; jurisdiction: JurisdictionResult }; meta: Json }> {
  const samePoint = draft.address !== null && draft.lat === input.lat && draft.lng === input.lng
  const [municipality, geocoded] = await Promise.all([
    supabase.rpc("resolve_municipality", { p_lat: input.lat, p_lng: input.lng }),
    samePoint ? Promise.resolve(null) : reverseGeocode(input.lat, input.lng),
  ])
  if (municipality.error) throw new StepError("unknown")
  if (municipality.data === null) throw new StepError("outside_area")

  const address = samePoint ? draft.address : (geocoded?.address ?? null)
  const addressSource = samePoint ? draft.addressSource : (geocoded?.source ?? null)

  const [updated, resolved] = await Promise.all([
    admin.rpc("update_draft", {
      p_report_id: input.reportId,
      p_user_id: input.userId,
      p_lat: input.lat,
      p_lng: input.lng,
      // the generated types say string, the function takes null (no address from Nominatim)
      p_address: address as string,
      p_address_source: addressSource as string,
      p_category: input.category,
    }),
    supabase.rpc("resolve_jurisdiction", { p_category: input.category, p_municipality_id: municipality.data }),
  ])
  if (updated.error) throw new StepError(codeOf(updated.error))
  const rule = resolved.data?.[0]
  if (resolved.error || !rule) throw new StepError("unknown")

  const ids = [rule.institution_id, rule.cc_institution_id].filter((id): id is string => !!id)
  const names = new Map<string, string>()
  if (ids.length > 0) {
    const { data, error } = await supabase.from("institutions").select("id, name").in("id", ids)
    if (error) throw new StepError("unknown")
    for (const row of data) names.set(row.id, row.name)
  }
  const ref = (id: string | null): InstitutionRef | null => {
    const name = id ? names.get(id) : undefined
    return id && name ? { id, name } : null
  }

  const jurisdiction: JurisdictionResult = {
    outcome: rule.outcome,
    ruleId: rule.rule_id,
    institution: rule.outcome === "matched" ? ref(rule.institution_id) : null,
    cc: rule.outcome === "matched" ? ref(rule.cc_institution_id) : null,
  }
  if (jurisdiction.outcome === "matched" && !jurisdiction.institution) throw new StepError("unknown")

  return {
    value: { address, jurisdiction },
    meta: {
      jurisdiction_outcome: rule.outcome,
      address_found: address !== null,
      address_reused: samePoint,
    },
  }
}

// 2. duplicates (FR-9): open, not hidden reports of the same category within 50 m, nearest
// first; the function runs with the citizen's session (citizen role, is_own).
async function duplicatesStep(
  { supabase, admin }: PrepareDeps,
  input: PrepareInput,
): Promise<{ value: DuplicateReport | null; meta: Json }> {
  const nearby = await supabase.rpc("find_nearby_open_reports", {
    p_category: input.category,
    p_lat: input.lat,
    p_lng: input.lng,
    p_exclude_report_id: input.reportId,
  })
  if (nearby.error) throw new StepError(codeOf(nearby.error))
  const nearest = nearby.data?.[0]
  const meta = { duplicate_count: nearby.data?.length ?? 0 }
  if (!nearest) return { value: null, meta }

  // the public fields of that report, as on a map card; hidden photos never (PRD §6)
  const { data: report, error } = await supabase
    .from("reports")
    .select(
      "id, code, status, category, lat, lng, address, like_count, submitted_at, closed_at, is_demo, report_photos(storage_path, position)",
    )
    .eq("id", nearest.id)
    .neq("status", "draft")
    .is("hidden_at", null)
    .is("report_photos.hidden_at", null)
    .order("position", { referencedTable: "report_photos", ascending: true })
    .limit(1, { referencedTable: "report_photos" })
    .maybeSingle()
  if (error) throw new StepError("unknown")
  if (!report || !report.code || !report.category || report.lat === null || report.lng === null || !report.submitted_at) {
    return { value: null, meta }
  }

  let photoUrl: string | null = null
  const path = report.report_photos[0]?.storage_path
  if (path) {
    const signed = await admin.storage.from("report-photos").createSignedUrl(path, SIGNED_URL_SECONDS)
    photoUrl = signed.data?.signedUrl ?? null
  }

  return {
    value: {
      id: report.id,
      code: report.code,
      status: report.status as PublicReportStatus,
      category: report.category,
      lat: report.lat,
      lng: report.lng,
      address: report.address,
      like_count: report.like_count,
      submitted_at: report.submitted_at,
      closed_at: report.closed_at,
      is_demo: report.is_demo,
      photoUrl,
      distanceM: nearest.distance_m,
      isOwn: nearest.is_own,
    },
    meta,
  }
}
