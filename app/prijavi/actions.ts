"use server"

import { z } from "zod"

import { ERROR_MESSAGES, errorMessage, MAX_PHOTOS_PER_REPORT, UNKNOWN_ERROR_MESSAGE } from "@/lib/constants"
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
