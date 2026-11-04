import "server-only"

import { Resend } from "resend"

import { getServerEnv } from "@/lib/env"

// THE ONLY PLACE THAT SENDS EMAIL (AGENTS.md rule 2, PRD FR-12, Tech.md "Mejl (Resend)").
// No other file imports `resend`. The guard below is the protection against mail reaching a real
// institution; Resend refusing every address except the account owner's is only a second lock.

/** A photo attached to the letter: `{code}-{position}.jpg` (FR-11, DB.md §10 "Prilog dopisa"). */
export type EmailAttachment = { filename: string; content: Buffer }

/**
 * One send attempt of one letter (DB.md §4.4 `dispatches`). Built from what `start_dispatch`
 * returned plus the rendered letter, so sendReport (#12, kind `initial`) and /admin (#15, kind
 * `assignment`) call it the same way.
 *
 * - `dispatchId`: `start_dispatch(...).dispatch_id`; sent as the Resend `Idempotency-Key`, so a
 *   retried request for the same attempt never produces a second email.
 * - `to`, `cc`: `start_dispatch(...).to_email` / `.cc_email`, the institution addresses. In test
 *   mode they are replaced by TEST_INBOX and never used.
 * - `subject`, `text`: the rendered letter (`renderLetter` → `subject`, `bodyText`); plain text.
 * - `attachments`: every photo of the report, already read from Storage by the caller.
 */
export type SendLetterInput = {
  dispatchId: string
  to: string
  cc: string | null
  subject: string
  text: string
  attachments: EmailAttachment[]
}

/**
 * The outcome, shaped like the arguments of `complete_dispatch` (DB.md §8.3); see
 * `completeDispatchArgs`. It never throws: every failure is a result with `succeeded: false`.
 *
 * - `emailMode`: what the guard actually applied, `live` only for exactly `EMAIL_MODE=live`.
 * - `deliveredTo`: the real recipients after the guard (test mode: only TEST_INBOX); `null` when
 *   nothing was handed to Resend.
 * - `providerMessageId`: the Resend email id on success.
 * - `errorCode`: no personal data: `no_test_inbox` (test mode without TEST_INBOX, nothing sent),
 *   `resend_<name>` (Resend answered with an error, e.g. `resend_validation_error`) or
 *   `network_error` (the request did not complete).
 */
export type SendLetterResult = {
  succeeded: boolean
  emailMode: "test" | "live"
  deliveredTo: string[] | null
  providerMessageId: string | null
  errorCode: string | null
}

/** Anything except exactly `live` is test mode (FR-12): `LIVE`, ` live`, empty, unset. */
export function emailModeOf(value: string | undefined): "test" | "live" {
  return value === "live" ? "live" : "test"
}

/**
 * Sends one letter through Resend, from EMAIL_FROM with reply-to EMAIL_REPLY_TO.
 * In test mode both `to` and `cc` go to TEST_INBOX; without TEST_INBOX nothing is sent.
 */
export async function sendLetter(input: SendLetterInput): Promise<SendLetterResult> {
  const env = getServerEnv()
  const emailMode = emailModeOf(env.EMAIL_MODE)

  let to: string
  let cc: string | null
  if (emailMode === "live") {
    to = input.to
    cc = input.cc
  } else {
    const inbox = env.TEST_INBOX?.trim()
    if (!inbox) {
      return { succeeded: false, emailMode, deliveredTo: null, providerMessageId: null, errorCode: "no_test_inbox" }
    }
    to = inbox
    cc = input.cc ? inbox : null
  }
  const deliveredTo = [...new Set(cc ? [to, cc] : [to])]

  try {
    const resend = new Resend(env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send(
      {
        from: env.EMAIL_FROM,
        to: [to],
        ...(cc ? { cc: [cc] } : {}),
        replyTo: env.EMAIL_REPLY_TO,
        subject: input.subject,
        text: input.text,
        attachments: input.attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: "image/jpeg",
        })),
      },
      { idempotencyKey: input.dispatchId },
    )
    if (error || !data) {
      return {
        succeeded: false,
        emailMode,
        deliveredTo: null,
        providerMessageId: null,
        errorCode: `resend_${error?.name ?? "no_data"}`,
      }
    }
    return { succeeded: true, emailMode, deliveredTo, providerMessageId: data.id, errorCode: null }
  } catch {
    return { succeeded: false, emailMode, deliveredTo: null, providerMessageId: null, errorCode: "network_error" }
  }
}

/** The `complete_dispatch` arguments for a send result (DB.md §8.3). */
export function completeDispatchArgs(dispatchId: string, result: SendLetterResult) {
  return {
    p_dispatch_id: dispatchId,
    p_succeeded: result.succeeded,
    p_email_mode: result.emailMode,
    // the generated types say string[] / string; the function takes null
    p_delivered_to: result.deliveredTo as string[],
    p_provider_message_id: result.providerMessageId as string,
    p_error_code: result.errorCode as string,
  }
}
