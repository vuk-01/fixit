import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { LetterInput } from "@/lib/agent/prepare"
import type { PreviewLetter } from "@/lib/agent/steps"
import { ADMIN_TEXT, CATEGORIES, PREPARE_TEXT } from "@/lib/constants"
import { getServerEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

import { renderLetter, type LetterKind, type LetterParams } from "./letter-template"

// Server side of the letter (Tech.md §3, §6): collects the report's data and calls the pure
// template. The model only gave the description (FR-10); the recipient comes from the
// jurisdiction step (resolve_jurisdiction), never from the model.

// The letter for the review, step `letter` of the prepare route (Tech.md §6, point 2). The
// report has no number, submission time or earlier-reports count yet, so those places read
// "dodjeljuje se pri slanju" (FR-11, ticket 22 Q5); contact sharing is off until the citizen
// turns it on, so no name or email. Not stored: sendReport renders the real one
// (buildSubmissionLetter below).
// `db` is the citizen's session (RLS shows the reporter their own draft).
export async function buildPreviewLetter(db: SupabaseClient<Database>, input: LetterInput): Promise<PreviewLetter> {
  const { data, error } = await db
    .from("reports")
    .select("description, report_details(immediate_danger), report_photos(position)")
    .eq("id", input.reportId)
    .maybeSingle()
  if (error || !data) throw new Error(`letter: report data not readable (${error?.code ?? "no_row"})`)

  const params: LetterParams = {
    kind: "initial",
    code: null,
    submittedAt: null,
    previousReports: null,
    pendingText: PREPARE_TEXT.assignedAtSubmit,
    categoryLabel: CATEGORIES[input.category].label,
    description: data.description,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    institutionName: input.jurisdiction.institution?.name ?? null,
    ccInstitutionName: input.jurisdiction.cc?.name ?? null,
    likeCount: 0,
    immediateDanger: data.report_details?.immediate_danger ?? false,
    photoPositions: data.report_photos.map((p) => p.position).sort((a, b) => a - b),
    contact: null,
    siteUrl: getServerEnv().NEXT_PUBLIC_SITE_URL,
  }
  const letter = renderLetter(params)
  return { subject: letter.subject, body: letter.bodyText, params }
}

export type SubmissionLetterInput = {
  reportId: string
  userId: string
  // begin_submission's code (FX-YYYY-NNNNN)
  code: string
  // begin_submission's recipient and cc (resolve_jurisdiction), never from the client
  institutionId: string
  ccInstitutionId: string | null
  // "Dostavi moje ime i mejl instituciji", as begin_submission stored it
  shareContact: boolean
  // the moment of submission; reports.submitted_at is set a moment later by complete_dispatch
  submittedAt: Date
}

export type SubmissionLetter = {
  subject: string
  bodyText: string
  includesContact: boolean
  previousReports: number
  // every photo of the report in position order, with its attachment name `{code}-{position}.jpg`
  photos: { storagePath: string; filename: string }[]
}

// The letter that is sent (sendReport, Tech.md §6 point 3, step 2): the real code, the date and
// time of submission and count_previous_reports, so no "dodjeljuje se pri slanju" anywhere
// (FR-11, ticket 22 Q5). Immediate danger, photos and the citizen's name and email (only with
// contact sharing on; the email from auth.users) are read here, never taken from the client.
// `admin` is the service key client: the caller has checked the user (getClaims) and
// begin_submission has checked that the user is the reporter.
export async function buildSubmissionLetter(
  admin: SupabaseClient<Database>,
  input: SubmissionLetterInput,
): Promise<SubmissionLetter> {
  const institutionIds = [input.institutionId, input.ccInstitutionId].filter((id): id is string => !!id)
  const [report, institutions, previous, contact] = await Promise.all([
    admin
      .from("reports")
      .select(
        "category, description, address, lat, lng, like_count, report_details(immediate_danger), report_photos(position, storage_path)",
      )
      .eq("id", input.reportId)
      .maybeSingle(),
    admin.from("institutions").select("id, name").in("id", institutionIds),
    admin.rpc("count_previous_reports", { p_report_id: input.reportId }),
    input.shareContact ? readContact(admin, input.userId) : Promise.resolve(null),
  ])
  if (report.error || !report.data) throw new Error(`letter: report not readable (${report.error?.code ?? "no_row"})`)
  if (institutions.error) throw new Error(`letter: institutions not readable (${institutions.error.code})`)
  if (previous.error) throw new Error(`letter: count_previous_reports failed (${previous.error.code})`)

  const r = report.data
  if (!r.category || r.lat === null || r.lng === null) throw new Error("letter: report has no category or location")
  const names = new Map(institutions.data.map((i) => [i.id, i.name]))
  const institutionName = names.get(input.institutionId)
  if (!institutionName) throw new Error("letter: recipient not found")

  const photos = [...r.report_photos].sort((a, b) => a.position - b.position)
  const previousReports = previous.data ?? 0
  const letter = renderLetter({
    kind: "initial",
    code: input.code,
    submittedAt: input.submittedAt,
    previousReports,
    pendingText: PREPARE_TEXT.assignedAtSubmit,
    categoryLabel: CATEGORIES[r.category].label,
    description: r.description,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    institutionName,
    ccInstitutionName: input.ccInstitutionId ? (names.get(input.ccInstitutionId) ?? null) : null,
    likeCount: r.like_count,
    immediateDanger: r.report_details?.immediate_danger ?? false,
    photoPositions: photos.map((p) => p.position),
    contact,
    siteUrl: getServerEnv().NEXT_PUBLIC_SITE_URL,
  })
  return {
    subject: letter.subject,
    bodyText: letter.bodyText,
    includesContact: contact !== null,
    previousReports,
    photos: photos.map((p, i) => ({ storagePath: p.storage_path, filename: letter.attachmentNames[i] })),
  }
}

export type AssignmentLetterInput = {
  reportId: string
  // `assignment` from routing (P0, /admin); `redirect` is P1 (FR-23) but uses the same template
  kind: Extract<LetterKind, "assignment" | "redirect">
  // the administrator's choice; null in the preview before anything is chosen
  institutionId: string | null
  // the preview on /admin: the reporter's name may show (PRD §6), the account email never does
  // (ticket #15 comment), so it reads `contactEmailPlaceholder` instead of auth.users
  preview: boolean
}

export type AssignmentLetter = SubmissionLetter & {
  // the template parameters, so /admin re-renders the preview in the browser for each choice
  params: LetterParams
}

// The letter the administrator sends to the institution of their choice (FR-23, Tech.md §6 point
// 3, last paragraph): the same template and report data as sendReport, with the report's real
// code, its submission time (reports.submitted_at), count_previous_reports and the supports so
// far (FR-11: supports exist only for letters from routing or after a redirect). No cc and no
// rule: the manual choice creates no jurisdiction rule (AGENTS.md golden rule 1). Contact sharing
// is the reporter's choice stored by begin_submission (report_private.share_contact).
// `admin` is the service key client; the caller has checked that the user is the admin.
export async function buildAssignmentLetter(
  admin: SupabaseClient<Database>,
  input: AssignmentLetterInput,
): Promise<AssignmentLetter> {
  const [report, reporter, institution, previous] = await Promise.all([
    admin
      .from("reports")
      .select(
        "code, submitted_at, category, description, address, lat, lng, like_count, report_details(immediate_danger), report_photos(position, storage_path)",
      )
      .eq("id", input.reportId)
      .maybeSingle(),
    admin.from("report_private").select("reporter_id, share_contact").eq("report_id", input.reportId).maybeSingle(),
    input.institutionId
      ? admin.from("institutions").select("name").eq("id", input.institutionId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    admin.rpc("count_previous_reports", { p_report_id: input.reportId }),
  ])
  if (report.error || !report.data) throw new Error(`letter: report not readable (${report.error?.code ?? "no_row"})`)
  if (reporter.error || !reporter.data) throw new Error(`letter: reporter not readable (${reporter.error?.code ?? "no_row"})`)
  if (institution.error) throw new Error(`letter: institution not readable (${institution.error.code})`)
  if (previous.error) throw new Error(`letter: count_previous_reports failed (${previous.error.code})`)

  const r = report.data
  if (!r.code || !r.submitted_at || !r.category || r.lat === null || r.lng === null) {
    throw new Error("letter: report has no code, submission time, category or location")
  }
  if (input.institutionId && !institution.data) throw new Error("letter: recipient not found")

  const contact = reporter.data.share_contact
    ? await readContact(admin, reporter.data.reporter_id, input.preview ? ADMIN_TEXT.contactEmailPlaceholder : null)
    : null
  const photos = [...r.report_photos].sort((a, b) => a.position - b.position)
  const previousReports = previous.data ?? 0
  const params: LetterParams = {
    kind: input.kind,
    code: r.code,
    submittedAt: r.submitted_at,
    previousReports,
    pendingText: PREPARE_TEXT.assignedAtSubmit,
    categoryLabel: CATEGORIES[r.category].label,
    description: r.description,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    institutionName: institution.data?.name ?? null,
    ccInstitutionName: null,
    likeCount: r.like_count,
    immediateDanger: r.report_details?.immediate_danger ?? false,
    photoPositions: photos.map((p) => p.position),
    contact,
    siteUrl: getServerEnv().NEXT_PUBLIC_SITE_URL,
  }
  const letter = renderLetter(params)
  return {
    subject: letter.subject,
    bodyText: letter.bodyText,
    includesContact: contact !== null,
    previousReports,
    photos: photos.map((p, i) => ({ storagePath: p.storage_path, filename: letter.attachmentNames[i] })),
    params,
  }
}

// name from profiles, email from auth.users (DB.md §4.2: the email is not copied to profiles);
// with `emailPlaceholder` the email is not read at all (previews never show it, ticket #11, #15)
async function readContact(admin: SupabaseClient<Database>, userId: string, emailPlaceholder: string | null = null) {
  if (emailPlaceholder !== null) {
    const profile = await admin.from("profiles").select("first_name, last_name").eq("id", userId).maybeSingle()
    if (profile.error || !profile.data) throw new Error("letter: contact not readable")
    return { firstName: profile.data.first_name, lastName: profile.data.last_name, email: emailPlaceholder }
  }
  const [profile, user] = await Promise.all([
    admin.from("profiles").select("first_name, last_name").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ])
  const email = user.data.user?.email
  if (profile.error || !profile.data || user.error || !email) throw new Error("letter: contact not readable")
  return { firstName: profile.data.first_name, lastName: profile.data.last_name, email }
}
