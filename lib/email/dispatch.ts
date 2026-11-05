import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { ReportStatus } from "@/lib/constants"
import { getServerEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

import type { LetterKind } from "./letter-template"
import { completeDispatchArgs, emailModeOf, sendLetter, type EmailAttachment, type SendLetterResult } from "./send"

// Steps 3–5 of sending a letter (Tech.md §6 point 3, DB.md §8.5 points 3 and 4):
// start_dispatch → photos from Storage → lib/email/send.ts → complete_dispatch.
// sendReport uses it with kind `initial`; /admin "Proslijedi instituciji" (#15) with kind `assignment`.

export type DispatchLetterInput = {
  reportId: string
  kind: LetterKind
  // the recipient and cc: for `initial` exactly what resolve_jurisdiction returns (start_dispatch
  // refuses anything else); for `assignment` the administrator's choice
  institutionId: string
  ccInstitutionId: string | null
  // jurisdiction_rules.id for `initial`; null for `assignment` and `redirect`
  ruleId: string | null
  // the reporter for `initial`, the administrator for `assignment` / `redirect`
  actorId: string
  subject: string
  bodyText: string
  includesContact: boolean
  // every photo of the report, `{code}-{position}.jpg` (DB.md §10 "Prilog dopisa")
  photos: { storagePath: string; filename: string }[]
}

/**
 * - ok: the letter went out and complete_dispatch recorded it; `status` is what it returned
 *   (`sent`, or the current status when it changed meanwhile, DB.md §8.3).
 * - not ok: `errorCode` is a database code from start_dispatch (`dispatch_in_progress`,
 *   `not_allowed`, `invalid_state`, `no_verified_email`, …), `photo_unreadable`, the send error
 *   (`no_test_inbox`, `resend_*`, `network_error`) or `complete_failed` (sent, but the outcome
 *   could not be recorded). The report is unchanged (transition 4) unless noted.
 */
export type DispatchLetterResult =
  | { ok: true; status: ReportStatus; dispatchId: string; send: SendLetterResult }
  | { ok: false; errorCode: string; dispatchId: string | null; send: SendLetterResult | null }

export async function dispatchLetter(
  admin: SupabaseClient<Database>,
  input: DispatchLetterInput,
): Promise<DispatchLetterResult> {
  // 3. the letter row and one pending attempt; a second attempt at the same time is refused
  const started = await admin.rpc("start_dispatch", {
    p_report_id: input.reportId,
    p_kind: input.kind,
    p_institution_id: input.institutionId,
    // the generated types say string; the function takes null
    p_cc_institution_id: input.ccInstitutionId as string,
    p_rule_id: input.ruleId as string,
    p_subject: input.subject,
    p_body_text: input.bodyText,
    p_includes_contact: input.includesContact,
    p_actor_id: input.actorId,
  })
  const attempt = started.data?.[0]
  if (started.error || !attempt) {
    return { ok: false, errorCode: started.error?.message || "unknown", dispatchId: null, send: null }
  }
  const dispatchId = attempt.dispatch_id

  // 4. the photos, read with the service key, then the only sender
  let send: SendLetterResult
  const attachments = await readAttachments(admin, input.photos)
  if (!attachments) {
    send = {
      succeeded: false,
      emailMode: emailModeOf(getServerEnv().EMAIL_MODE),
      deliveredTo: null,
      providerMessageId: null,
      errorCode: "photo_unreadable",
    }
  } else {
    send = await sendLetter({
      dispatchId,
      to: attempt.to_email,
      cc: attempt.cc_email,
      subject: input.subject,
      text: input.bodyText,
      attachments,
    })
  }

  // 5. the outcome; only a success moves the report (draft → sent, routing → sent)
  const args = completeDispatchArgs(dispatchId, send)
  let completed = await admin.rpc("complete_dispatch", args)
  // the email is out: one more try, so the report does not stay a draft for a mail that was sent
  if (completed.error && send.succeeded) completed = await admin.rpc("complete_dispatch", args)

  if (!send.succeeded) return { ok: false, errorCode: send.errorCode ?? "unknown", dispatchId, send }
  if (completed.error || !completed.data) {
    console.error("dispatchLetter: complete_dispatch failed after a sent email", completed.error?.message)
    return { ok: false, errorCode: "complete_failed", dispatchId, send }
  }
  return { ok: true, status: completed.data, dispatchId, send }
}

async function readAttachments(
  admin: SupabaseClient<Database>,
  photos: DispatchLetterInput["photos"],
): Promise<EmailAttachment[] | null> {
  if (photos.length === 0) return null
  const files = await Promise.all(
    photos.map(async (photo) => {
      const { data, error } = await admin.storage.from("report-photos").download(photo.storagePath)
      if (error || !data) return null
      return { filename: photo.filename, content: Buffer.from(await data.arrayBuffer()) }
    }),
  )
  return files.every((f) => f !== null) ? (files as EmailAttachment[]) : null
}
