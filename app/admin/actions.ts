"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { adminAccess } from "@/lib/admin/access"
import { getAccount } from "@/lib/auth"
import { ADMIN_TEXT, ERROR_MESSAGES, UNKNOWN_ERROR_MESSAGE, type ReportStatus } from "@/lib/constants"
import { dispatchLetter } from "@/lib/email/dispatch"
import { buildAssignmentLetter } from "@/lib/email/report-letter"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({ reportId: z.uuid(), institutionId: z.uuid() })

/**
 * - ok: the letter went out; `status` is what complete_dispatch returned (`sent`, or the current
 *   status when it changed meanwhile, DB.md §8.3), `institutionName` the recipient.
 * - not ok: `error` is the Montenegrin message for the administrator.
 */
export type AssignReportResult =
  | { ok: true; status: ReportStatus; institutionName: string }
  | { ok: false; error: string }

// start_dispatch codes with their own message; anything else is "sending failed"
const DISPATCH_ERRORS: Record<string, string> = {
  dispatch_in_progress: ERROR_MESSAGES.dispatch_in_progress,
  no_verified_email: ERROR_MESSAGES.no_verified_email,
  not_allowed: ERROR_MESSAGES.not_allowed,
  not_found: ERROR_MESSAGES.not_found,
  invalid_state: ADMIN_TEXT.notRouting,
  complete_failed: ADMIN_TEXT.completeFailed,
}

/**
 * "Proslijedi instituciji" on /admin: manual assignment of a report in `routing` (FR-23, FR-18 transition 6,
 * Tech.md §6 point 3, DB.md §8.5 point 4). getClaims() (through getAccount) and the `admin` role,
 * then with the service key: the institution must have a verified email and be active, the report
 * must be in `routing` and have photos; the letter from the same template (kind `assignment`, no
 * cc, no rule) → start_dispatch(assignment) → lib/email/send.ts → complete_dispatch
 * (lib/email/dispatch.ts). start_dispatch checks the role, the status and the email again.
 *
 * The administrator's choice is a human decision for this report only: it never writes to
 * jurisdiction_rules and creates no rule (AGENTS.md golden rule 1, PRD "Nema rezervnog primaoca").
 */
export async function assignReport(input: { reportId: string; institutionId: string }): Promise<AssignReportResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: UNKNOWN_ERROR_MESSAGE }
  const { reportId, institutionId } = parsed.data

  const access = adminAccess(await getAccount())
  if (access.kind === "login") return { ok: false, error: ERROR_MESSAGES.not_authenticated }
  if (access.kind !== "admin") return { ok: false, error: ERROR_MESSAGES.not_allowed }

  const admin = createAdminClient()
  try {
    const [institution, report] = await Promise.all([
      admin.from("institutions").select("name, email, is_active").eq("id", institutionId).maybeSingle(),
      admin.from("reports").select("status").eq("id", reportId).maybeSingle(),
    ])
    if (institution.error || report.error) return { ok: false, error: ADMIN_TEXT.sendFailed }
    if (!institution.data || !institution.data.email || !institution.data.is_active) {
      return { ok: false, error: ERROR_MESSAGES.no_verified_email }
    }
    if (!report.data || report.data.status === "draft") return { ok: false, error: ERROR_MESSAGES.not_found }
    if (report.data.status !== "routing") return { ok: false, error: ADMIN_TEXT.notRouting }

    const letter = await buildAssignmentLetter(admin, { reportId, kind: "assignment", institutionId, preview: false })
    // a letter goes out with the report's photos (FR-11); without any there is nothing to attach
    if (letter.photos.length === 0) return { ok: false, error: ADMIN_TEXT.noPhotos }

    const dispatched = await dispatchLetter(admin, {
      reportId,
      kind: "assignment",
      institutionId,
      ccInstitutionId: null,
      ruleId: null,
      actorId: access.userId,
      subject: letter.subject,
      bodyText: letter.bodyText,
      includesContact: letter.includesContact,
      photos: letter.photos,
    })
    if (!dispatched.ok) {
      console.error("assignReport: dispatch failed", dispatched.errorCode)
      return { ok: false, error: DISPATCH_ERRORS[dispatched.errorCode] ?? ADMIN_TEXT.sendFailed }
    }

    revalidatePath("/admin")
    revalidatePath(`/admin/prijave/${reportId}`)
    // the recipient's panel, the public page and the map show the new recipient and status
    revalidatePath("/panel")
    revalidatePath("/p/[code]", "page")
    revalidatePath("/")
    return { ok: true, status: dispatched.status, institutionName: institution.data.name }
  } catch (error) {
    console.error("assignReport: failed", error instanceof Error ? error.message : "unknown")
    return { ok: false, error: ADMIN_TEXT.sendFailed }
  }
}
