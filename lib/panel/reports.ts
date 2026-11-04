import "server-only"

import { redirect } from "next/navigation"

import { getAccount } from "@/lib/auth"
import { loginHref } from "@/lib/auth-paths"
import type { PublicReportStatus, ReportCategory, ReportSeverity } from "@/lib/constants"
import { panelAccess, type PanelAccess, type PanelPage } from "@/lib/panel/access"
import type { TimelineEvent } from "@/lib/reports/timeline"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type Allowed = Exclude<PanelAccess, { kind: "login" } | { kind: "forbidden" }>

// Every panel page checks the account itself (proxy.ts is not protection, Tech.md §3).
export async function requirePanelAccess(nextPath: string, page: PanelPage): Promise<Allowed> {
  const access = panelAccess(await getAccount(), page)
  if (access.kind === "login") redirect(loginHref(nextPath))
  if (access.kind === "forbidden") redirect("/")
  return access
}

export type PanelListReport = {
  id: string
  code: string
  status: PublicReportStatus
  category: ReportCategory
  address: string | null
  severity: ReportSeverity | null
  like_count: number
  submitted_at: string
  closed_at: string | null
  is_demo: boolean
  is_hidden: boolean
}

// Supabase returns a 1:1 embed as an object, older versions as an array
function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

async function institutionNames(): Promise<Map<string, string>> {
  const supabase = await createClient()
  const { data } = await supabase.from("institutions").select("id, name")
  return new Map((data ?? []).map((i) => [i.id, i.name]))
}

// The institution's reports (FR-20). Public reports are readable by everyone (DB.md §9), so the
// query filters by the current recipient explicitly; report_details comes only through the
// recipient policy. A report where the institution is only the cc is not listed (GLOSSARY "Kopija").
export async function getInstitutionReports(institutionId: string): Promise<{
  institutionName: string | null
  reports: PanelListReport[]
  failed: boolean
}> {
  const supabase = await createClient()
  const [names, { data, error }] = await Promise.all([
    institutionNames(),
    supabase
      .from("reports")
      .select(
        "id, code, status, category, address, like_count, submitted_at, closed_at, is_demo, is_hidden, report_details(severity)",
      )
      .eq("institution_id", institutionId)
      .neq("status", "draft")
      .order("submitted_at", { ascending: false })
      .limit(500),
  ])

  if (error) {
    console.error("getInstitutionReports", error.code, error.message)
    return { institutionName: names.get(institutionId) ?? null, reports: [], failed: true }
  }

  const reports = data.flatMap((r): PanelListReport[] => {
    if (!r.code || !r.category || !r.submitted_at) return []
    return [
      {
        id: r.id,
        code: r.code,
        status: r.status as PublicReportStatus,
        category: r.category,
        address: r.address,
        severity: one(r.report_details)?.severity ?? null,
        like_count: r.like_count,
        submitted_at: r.submitted_at,
        closed_at: r.closed_at,
        is_demo: r.is_demo,
        is_hidden: r.is_hidden === true,
      },
    ]
  })

  return { institutionName: names.get(institutionId) ?? null, reports, failed: false }
}

export type PanelPhoto = {
  id: string
  position: number
  url: string | null
  hidden: boolean
  hasPersonalData: boolean
}

export type PanelReport = {
  id: string
  code: string
  status: PublicReportStatus
  category: ReportCategory
  lat: number | null
  lng: number | null
  address: string | null
  description: string | null
  institutionId: string | null
  ccInstitutionId: string | null
  like_count: number
  submitted_at: string
  closed_at: string | null
  is_demo: boolean
  is_hidden: boolean
  severity: ReportSeverity | null
  immediateDanger: boolean
  photos: PanelPhoto[]
  letter: { subject: string; body: string; sentAt: string } | null
  events: TimelineEvent[]
  institutionNames: Map<string, string>
}

const SIGNED_URL_SECONDS = 60 * 60
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// One report for the panel, or null when the visitor may not see it there. Read with the
// visitor's session (RLS), then checked: an official only gets reports whose current recipient
// is their institution, even though RLS also lets them read every public report.
// The first opening by the recipient's official moves `sent` to `acknowledged` (FR-22, transition
// 7); for the admin nothing is called, so opening never changes the status.
export async function getPanelReport(id: string, access: Allowed): Promise<PanelReport | null> {
  if (!UUID.test(id)) return null
  const supabase = await createClient()

  const { data: r, error } = await supabase
    .from("reports")
    .select(
      "id, code, status, category, lat, lng, address, description, institution_id, cc_institution_id, like_count, submitted_at, closed_at, is_demo, is_hidden",
    )
    .eq("id", id)
    .maybeSingle()

  if (error) console.error("getPanelReport", error.code, error.message)
  if (!r || r.status === "draft" || !r.code || !r.category || !r.submitted_at) return null
  if (access.kind === "official" && r.institution_id !== access.institutionId) return null

  let status = r.status as PublicReportStatus
  if (access.kind === "official" && status === "sent") {
    const { data: acknowledged, error: ackError } = await supabase.rpc("acknowledge_report", { p_report_id: id })
    if (ackError) console.error("acknowledge_report", ackError.message)
    else if (acknowledged && acknowledged !== "draft") status = acknowledged
  }

  const [names, details, photos, letters, events] = await Promise.all([
    institutionNames(),
    supabase.from("report_details").select("severity, immediate_danger").eq("report_id", id).maybeSingle(),
    supabase
      .from("report_photos")
      .select("id, storage_path, position, hidden_at, has_personal_data")
      .eq("report_id", id)
      .order("position", { ascending: true }),
    // RLS gives an official only the letter addressed to their institution (DB.md §9)
    r.institution_id
      ? supabase
          .from("letters")
          .select("subject, body_text, sent_at")
          .eq("report_id", id)
          .eq("institution_id", r.institution_id)
          .not("sent_at", "is", null)
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("report_events")
      .select("id, kind, to_status, actor, institution_id, previous_institution_id, message, created_at")
      .eq("report_id", id)
      .order("created_at", { ascending: true }),
  ])

  // Sign only the paths this visitor's query returned (DB.md §10); officials see hidden photos too.
  const photoRows = photos.data ?? []
  const signed = new Map<string, string>()
  if (photoRows.length > 0) {
    const { data: urls, error: signError } = await createAdminClient()
      .storage.from("report-photos")
      .createSignedUrls(
        photoRows.map((p) => p.storage_path),
        SIGNED_URL_SECONDS,
      )
    if (signError) console.error("getPanelReport sign", signError.message)
    for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl)
  }

  const letter = letters.data
  return {
    id: r.id,
    code: r.code,
    status,
    category: r.category,
    lat: r.lat,
    lng: r.lng,
    address: r.address,
    description: r.description,
    institutionId: r.institution_id,
    ccInstitutionId: r.cc_institution_id,
    like_count: r.like_count,
    submitted_at: r.submitted_at,
    closed_at: r.closed_at,
    is_demo: r.is_demo,
    is_hidden: r.is_hidden === true,
    severity: details.data?.severity ?? null,
    immediateDanger: details.data?.immediate_danger ?? false,
    photos: photoRows.map((p) => ({
      id: p.id,
      position: p.position,
      url: signed.get(p.storage_path) ?? null,
      hidden: p.hidden_at !== null,
      hasPersonalData: p.has_personal_data,
    })),
    letter: letter?.sent_at ? { subject: letter.subject, body: letter.body_text, sentAt: letter.sent_at } : null,
    events: events.data ?? [],
    institutionNames: names,
  }
}
