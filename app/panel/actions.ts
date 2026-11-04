"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAccount } from "@/lib/auth"
import {
  ERROR_MESSAGES,
  errorMessage,
  PANEL_TEXT,
  STATUS_MESSAGE_MAX_LENGTH,
  UNKNOWN_ERROR_MESSAGE,
  type ReportStatus,
} from "@/lib/constants"
import { messageRequired, normalizeMessage, OFFICIAL_TARGETS } from "@/lib/panel/status-change"
import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  reportId: z.uuid(),
  to: z.enum(OFFICIAL_TARGETS),
  message: z.string().nullable().optional(),
})

export type ChangeStatusResult = { ok: true; status: ReportStatus } | { ok: false; error: string }

// Status change from the panel (FR-21, FR-18 transitions 8–10). set_report_status runs with the
// official's own session: the database checks that the caller is the recipient's official, that
// the transition is allowed and that a rejection has a message (DB.md §8.3). The message is public
// in the timeline, signed with the institution's name.
export async function changeReportStatus(input: {
  reportId: string
  to: string
  message?: string | null
}): Promise<ChangeStatusResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: UNKNOWN_ERROR_MESSAGE }
  const { reportId, to } = parsed.data
  const message = normalizeMessage(parsed.data.message)

  // getAccount() reads the user with getClaims() and returns null for anonymous sessions
  const account = await getAccount()
  if (!account) return { ok: false, error: ERROR_MESSAGES.not_authenticated }
  if (account.role !== "official") return { ok: false, error: ERROR_MESSAGES.not_allowed }

  if (messageRequired(to) && !message) return { ok: false, error: ERROR_MESSAGES.message_required }
  if (message && message.length > STATUS_MESSAGE_MAX_LENGTH) return { ok: false, error: PANEL_TEXT.messageTooLong }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("set_report_status", {
    p_report_id: reportId,
    p_to: to,
    ...(message ? { p_message: message } : {}),
  })
  if (error) return { ok: false, error: errorMessage(error) }

  revalidatePath("/panel")
  revalidatePath(`/panel/prijave/${reportId}`)
  // the public page and the map show the new status after a reload (FR-18 "Osvježavanje")
  revalidatePath("/p/[code]", "page")
  revalidatePath("/")
  return { ok: true, status: data ?? to }
}
