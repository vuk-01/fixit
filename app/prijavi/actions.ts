"use server"

import { z } from "zod"

import {
  CATEGORY_ORDER,
  DESCRIPTION_MAX_LENGTH,
  ERROR_MESSAGES,
  errorMessage,
  MAX_PHOTOS_PER_REPORT,
  SEND_TEXT,
  UNKNOWN_ERROR_MESSAGE,
  type ReportCategory,
} from "@/lib/constants"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const PHOTO_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/

const cancelSchema = z.object({
  reportId: z.uuid().nullable(),
  photoPaths: z.array(z.string().regex(PHOTO_PATH)).max(MAX_PHOTOS_PER_REPORT),
})

export type CancelResult = { ok: true } | { ok: false; error: string }

// "Odustani" (FR-5, DB.md §8.2 transition 2): delete_draft with the citizen's own session (the
// function checks that the caller is the reporter and the report is a draft), then the same
// action removes the returned files with the admin client. Only paths returned by delete_draft
// are removed, never paths sent by the client.
// Without a reportId (the client stopped waiting for classify), the draft is found by its photo
// paths, again with the citizen's session, so RLS only shows the citizen's own photos.
export async function cancelReport(input: { reportId: string | null; photoPaths: string[] }): Promise<CancelResult> {
  const parsed = cancelSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: UNKNOWN_ERROR_MESSAGE }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims || claims.is_anonymous !== false) return { ok: false, error: ERROR_MESSAGES.not_authenticated }

  let reportId = parsed.data.reportId
  if (!reportId && parsed.data.photoPaths.length > 0) {
    const { data: photo } = await supabase
      .from("report_photos")
      .select("report_id")
      .in("storage_path", parsed.data.photoPaths)
      .limit(1)
      .maybeSingle()
    reportId = photo?.report_id ?? null
  }
  // no draft was made (e.g. the daily limit): nothing to delete
  if (!reportId) return { ok: true }

  const { data: paths, error } = await supabase.rpc("delete_draft", { p_report_id: reportId })
  if (error) {
    // already gone (a second tap, another tab): the citizen wanted it gone anyway
    if (error.message === "not_found") return { ok: true }
    return { ok: false, error: errorMessage(error) }
  }

  if (paths && paths.length > 0) {
    const removed = await createAdminClient().storage.from("report-photos").remove(paths)
    if (removed.error) console.error("cancelReport: storage remove failed", removed.error.name)
  }
  return { ok: true }
}

const supportSchema = z.object({ draftId: z.uuid(), reportId: z.uuid() })

export type SupportResult = { ok: true; code: string } | { ok: false; error: string }

// "Podrži postojeću" (FR-9, DB.md §8.2 transition 2): support_existing_report with the citizen's
// session likes the existing report and deletes the draft in one transaction (the function
// checks the reporter, the draft, that the report is open and not the citizen's own); then the
// same action removes only the returned files with the admin client. The client goes to
// /p/[code] with the code read here, never one it sent.
export async function supportExistingReport(input: { draftId: string; reportId: string }): Promise<SupportResult> {
  const parsed = supportSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: UNKNOWN_ERROR_MESSAGE }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims || claims.is_anonymous !== false) return { ok: false, error: ERROR_MESSAGES.not_authenticated }

  const { data: report } = await supabase
    .from("reports")
    .select("code")
    .eq("id", parsed.data.reportId)
    .neq("status", "draft")
    .maybeSingle()
  if (!report?.code) return { ok: false, error: ERROR_MESSAGES.report_not_open }

  const { data: rows, error } = await supabase.rpc("support_existing_report", {
    p_draft_id: parsed.data.draftId,
    p_report_id: parsed.data.reportId,
  })
  if (error) return { ok: false, error: errorMessage(error) }

  const paths = rows?.[0]?.removed_paths ?? []
  if (paths.length > 0) {
    const removed = await createAdminClient().storage.from("report-photos").remove(paths)
    if (removed.error) console.error("supportExistingReport: storage remove failed", removed.error.name)
  }
  return { ok: true, code: report.code }
}

// Signed-in account that is not anonymous (Tech.md §4: every Server Action checks it itself)
async function citizenSession() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims || claims.is_anonymous !== false) return null
  return { supabase, userId: claims.sub }
}

const photoSchema = z.object({ reportId: z.uuid(), path: z.string().regex(PHOTO_PATH) })

export type PhotoResult = { ok: true } | { ok: false; error: string }

// "Dodaj fotografiju" on the review (FR-2, DB.md §8.3): the browser has already uploaded the
// 1600 px file to Storage; add_report_photo (citizen's session) checks the reporter, the draft,
// the path and the limit of 3 (`photo_limit`). It does not check the file; begin_submission does.
export async function addReportPhoto(input: { reportId: string; path: string }): Promise<PhotoResult> {
  const parsed = photoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: UNKNOWN_ERROR_MESSAGE }
  const session = await citizenSession()
  if (!session) return { ok: false, error: ERROR_MESSAGES.not_authenticated }

  const { error } = await session.supabase.rpc("add_report_photo", {
    p_report_id: parsed.data.reportId,
    p_storage_path: parsed.data.path,
  })
  return error ? { ok: false, error: errorMessage(error) } : { ok: true }
}

// "Ukloni" on the review (FR-2, DB.md §8.3): the photo row is found by its path with the
// citizen's session (RLS shows the reporter's photos only), remove_report_photo refuses the last
// one (`photos_required`), then only the path the function returned is removed from Storage.
export async function removeReportPhoto(input: { reportId: string; path: string }): Promise<PhotoResult> {
  const parsed = photoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: UNKNOWN_ERROR_MESSAGE }
  const session = await citizenSession()
  if (!session) return { ok: false, error: ERROR_MESSAGES.not_authenticated }

  const { data: photo } = await session.supabase
    .from("report_photos")
    .select("id")
    .eq("report_id", parsed.data.reportId)
    .eq("storage_path", parsed.data.path)
    .maybeSingle()
  if (!photo) return { ok: false, error: ERROR_MESSAGES.not_found }

  const { data: removed, error } = await session.supabase.rpc("remove_report_photo", { p_photo_id: photo.id })
  if (error) return { ok: false, error: errorMessage(error) }

  if (removed) {
    const gone = await createAdminClient().storage.from("report-photos").remove([removed])
    if (gone.error) console.error("removeReportPhoto: storage remove failed", gone.error.name)
  }
  return { ok: true }
}

const sendSchema = z.object({
  reportId: z.uuid(),
  category: z.enum(CATEGORY_ORDER as [ReportCategory, ...ReportCategory[]]),
  description: z.string().max(DESCRIPTION_MAX_LENGTH),
  shareContact: z.boolean(),
})

/**
 * What the review screen hands to "Pošalji prijavu" (FR-11): only what the citizen decided on
 * that screen. Everything else the server reads itself (Tech.md §6, point 3).
 *
 * - `reportId`: the draft. begin_submission checks its owner, status, location and municipality,
 *   and that every photo file exists in Storage (else `photo_missing`).
 * - `category`: the final category shown on the review (p_category; category_source is derived).
 * - `description`: the text in "Opis problema" as edited, untrimmed; empty means no description
 *   (begin_submission btrims it, "" → null; at most 1000 characters).
 * - `shareContact`: "Dostavi moje ime i mejl instituciji" (p_share_contact), off by default.
 *
 * Read on the server, never taken from the client: recipient and cc (resolve_jurisdiction in
 * begin_submission / start_dispatch), immediate danger (report_details.immediate_danger, written
 * by record_classification), photos and positions (report_photos), code, submission time and
 * count_previous_reports, and the citizen's name and email (only when shareContact is on).
 */
export type SendReportInput = {
  reportId: string
  category: ReportCategory
  description: string
  shareContact: boolean
}

/**
 * - ok, `outcome: "sent"`: the letter went out (draft → sent); `outcome: "routing"`: no rule or no
 *   verified email, the report goes to the administrator (FR-8). `code` is FX-YYYY-NNNNN.
 * - not ok: `error` is the Montenegrin message for the citizen; `code` is the report number when
 *   begin_submission already assigned one (the draft keeps it for "Pokušaj ponovo", FR-24).
 */
export type SendReportResult =
  | { ok: true; outcome: "sent" | "routing"; code: string }
  | { ok: false; error: string; code: string | null }

/**
 * "Pošalji prijavu" (FR-11, Tech.md §6 point 3). STUB until ticket #12: it checks the input and
 * the session and answers that sending is not available yet. No database write, no email.
 * #12 implements: begin_submission → (routing: done) → count_previous_reports + letter template
 * (lib/email/letter-template.ts, with code, date and count) → start_dispatch → lib/email/send.ts
 * → complete_dispatch, plus the agent_runs row for `send`.
 */
export async function sendReport(input: SendReportInput): Promise<SendReportResult> {
  const parsed = sendSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: UNKNOWN_ERROR_MESSAGE, code: null }
  const session = await citizenSession()
  if (!session) return { ok: false, error: ERROR_MESSAGES.not_authenticated, code: null }
  return { ok: false, error: SEND_TEXT.notImplemented, code: null }
}
