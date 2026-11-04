import "server-only"

import { redirect } from "next/navigation"

import { adminAccess } from "@/lib/admin/access"
import { getAccount } from "@/lib/auth"
import { loginHref } from "@/lib/auth-paths"
import type { PublicReportStatus, ReportCategory, RoutingReason } from "@/lib/constants"
import type { LetterParams } from "@/lib/email/letter-template"
import { buildAssignmentLetter } from "@/lib/email/report-letter"
import type { TimelineEvent } from "@/lib/reports/timeline"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

// Reads for /admin (ticket #15). Everything is read with the admin's own session: RLS gives the
// admin every report, its details, private part, photos, events and letters (DB.md §9). The
// service key is used only for signed photo URLs and the letter preview (count_previous_reports
// is a server function, Tech.md §4), always after requireAdmin.

// Every /admin page checks the account itself (proxy.ts is not protection, Tech.md §3).
export async function requireAdmin(nextPath: string): Promise<{ userId: string }> {
  const access = adminAccess(await getAccount())
  if (access.kind === "login") redirect(loginHref(nextPath))
  if (access.kind === "forbidden") redirect("/")
  return { userId: access.userId }
}

export type RoutingListReport = {
  id: string
  code: string
  category: ReportCategory
  address: string | null
  routingReason: RoutingReason | null
  like_count: number
  submitted_at: string
  is_demo: boolean
  is_hidden: boolean
}

// Reports waiting for the administrator (`routing`, FR-8), oldest first: they have waited longest.
export async function getRoutingReports(): Promise<{ reports: RoutingListReport[]; failed: boolean }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("reports")
    .select("id, code, category, address, routing_reason, like_count, submitted_at, is_demo, is_hidden")
    .eq("status", "routing")
    .order("submitted_at", { ascending: true })
    .limit(500)
  if (error) {
    console.error("getRoutingReports", error.code, error.message)
    return { reports: [], failed: true }
  }
  const reports = data.flatMap((r): RoutingListReport[] =>
    r.code && r.category && r.submitted_at
      ? [
          {
            id: r.id,
            code: r.code,
            category: r.category,
            address: r.address,
            routingReason: r.routing_reason,
            like_count: r.like_count,
            submitted_at: r.submitted_at,
            is_demo: r.is_demo,
            is_hidden: r.is_hidden === true,
          },
        ]
      : [],
  )
  return { reports, failed: false }
}

export type AssignableInstitution = { id: string; name: string }

// Institutions the administrator may choose: only with a verified email and active (PRD §4.4;
// start_dispatch refuses anything else with `no_verified_email`).
export async function getAssignableInstitutions(): Promise<AssignableInstitution[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("institutions")
    .select("id, name")
    .not("email", "is", null)
    .eq("is_active", true)
    .order("name", { ascending: true })
  if (error) console.error("getAssignableInstitutions", error.code, error.message)
  return data ?? []
}

export type AdminPhoto = { id: string; position: number; url: string | null; hasPersonalData: boolean }

export type AdminReport = {
  id: string
  code: string
  status: PublicReportStatus
  category: ReportCategory
  address: string | null
  description: string | null
  routingReason: RoutingReason | null
  institutionId: string | null
  like_count: number
  submitted_at: string
  closed_at: string | null
  is_demo: boolean
  is_hidden: boolean
  // the reporter's name only, never the account email (ticket #15 comment)
  reporterName: string | null
  photos: AdminPhoto[]
  events: TimelineEvent[]
  institutionNames: Map<string, string>
  // the letter preview for a report in `routing`; null otherwise or when it could not be built
  preview: LetterParams | null
  // the last letter sent, for a report that already has a recipient
  letter: { subject: string; body: string; sentAt: string } | null
}

const SIGNED_URL_SECONDS = 60 * 60
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getAdminReport(id: string): Promise<AdminReport | null> {
  if (!UUID.test(id)) return null
  const supabase = await createClient()
  const { data: r, error } = await supabase
    .from("reports")
    .select(
      "id, code, status, category, address, description, routing_reason, institution_id, like_count, submitted_at, closed_at, is_demo, is_hidden",
    )
    .eq("id", id)
    .maybeSingle()
  if (error) console.error("getAdminReport", error.code, error.message)
  if (!r || r.status === "draft" || !r.code || !r.category || !r.submitted_at) return null

  const admin = createAdminClient()
  const [names, reporter, photos, events, letter, preview] = await Promise.all([
    supabase.from("institutions").select("id, name"),
    supabase.from("report_private").select("reporter_id").eq("report_id", id).maybeSingle(),
    supabase
      .from("report_photos")
      .select("id, storage_path, position, has_personal_data")
      .eq("report_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("report_events")
      .select("id, kind, to_status, actor, institution_id, previous_institution_id, message, created_at")
      .eq("report_id", id)
      .order("created_at", { ascending: true }),
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
    r.status === "routing"
      ? buildAssignmentLetter(admin, { reportId: id, kind: "assignment", institutionId: null, preview: true })
          .then((l) => l.params)
          .catch((e: unknown) => {
            console.error("getAdminReport preview", e instanceof Error ? e.message : "unknown")
            return null
          })
      : Promise.resolve(null),
  ])

  let reporterName: string | null = null
  if (reporter.data) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", reporter.data.reporter_id)
      .maybeSingle()
    if (profile) reporterName = `${profile.first_name} ${profile.last_name}`
  }

  // sign only the paths the admin's query returned (DB.md §10)
  const photoRows = photos.data ?? []
  const signed = new Map<string, string>()
  if (photoRows.length > 0) {
    const { data: urls, error: signError } = await admin.storage.from("report-photos").createSignedUrls(
      photoRows.map((p) => p.storage_path),
      SIGNED_URL_SECONDS,
    )
    if (signError) console.error("getAdminReport sign", signError.message)
    for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl)
  }

  const sent = letter.data
  return {
    id: r.id,
    code: r.code,
    status: r.status as PublicReportStatus,
    category: r.category,
    address: r.address,
    description: r.description,
    routingReason: r.routing_reason,
    institutionId: r.institution_id,
    like_count: r.like_count,
    submitted_at: r.submitted_at,
    closed_at: r.closed_at,
    is_demo: r.is_demo,
    is_hidden: r.is_hidden === true,
    reporterName,
    photos: photoRows.map((p) => ({
      id: p.id,
      position: p.position,
      url: signed.get(p.storage_path) ?? null,
      hasPersonalData: p.has_personal_data,
    })),
    events: events.data ?? [],
    institutionNames: new Map((names.data ?? []).map((i) => [i.id, i.name])),
    preview,
    letter: sent?.sent_at ? { subject: sent.subject, body: sent.body_text, sentAt: sent.sent_at } : null,
  }
}
