import { NextResponse } from "next/server"

import { classifyPhotos, type ClassifyOutcome } from "@/lib/agent/classify"
import { forClient, type ClassifyErrorCode, type ClassifyResponse } from "@/lib/agent/schema"
import { MAX_PHOTOS_PER_REPORT, MODEL_IMAGE_MAX_BYTES } from "@/lib/constants"
import { getServerEnv } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60

const PHOTO_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/

const error = (code: ClassifyErrorCode, status: number) =>
  NextResponse.json({ error: code }, { status, headers: { "Cache-Control": "private, no-store" } })

async function readImages(request: Request): Promise<{ images: string[]; paths: string[] } | null> {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return null
  }
  const files = form.getAll("images")
  const paths = form.getAll("photo_paths")
  if (files.length < 1 || files.length > MAX_PHOTOS_PER_REPORT || files.length !== paths.length) return null
  if (!paths.every((p): p is string => typeof p === "string" && PHOTO_PATH.test(p))) return null
  if (new Set(paths).size !== paths.length) return null

  const images: string[] = []
  for (const file of files) {
    if (!(file instanceof Blob) || file.type !== "image/jpeg") return null
    if (file.size === 0 || file.size > MODEL_IMAGE_MAX_BYTES) return null
    const bytes = Buffer.from(await file.arrayBuffer())
    // JPEG magic bytes, not only the declared type
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return null
    images.push(bytes.toString("base64"))
  }
  return { images, paths }
}

function usageFor(outcome: ClassifyOutcome): Json {
  return {
    model: outcome.run.model,
    duration_ms: outcome.run.durationMs,
    stop_reason: outcome.run.stopReason,
    input_tokens: outcome.run.inputTokens,
    output_tokens: outcome.run.outputTokens,
    error_code: outcome.ok ? null : outcome.errorCode,
    outcome: outcome.ok ? "ok" : outcome.reason === "api_error" ? "error" : "fallback",
  }
}

// POST /api/agent/classify (Tech.md §6, point 1): draft and recognition.
// getClaims() → account that is not anonymous → validation → create_draft (role and daily
// limit) → one model call with all photos → record_classification → { reportId, result } or
// { reportId, fallback: true, reason }.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims || claims.is_anonymous !== false) return error("not_authenticated", 401)

  const input = await readImages(request)
  if (!input) return error("invalid_request", 400)

  const env = getServerEnv()
  const admin = createAdminClient()

  const draft = await admin.rpc("create_draft", { p_user_id: claims.sub, p_photo_paths: input.paths })
  const created = draft.data?.[0]
  if (draft.error || !created) {
    const code = draft.error?.message
    if (code === "daily_limit_reached") return error("daily_limit_reached", 429)
    if (code === "not_allowed") return error("not_allowed", 403)
    if (code === "photos_required" || code === "photo_limit") return error("invalid_request", 400)
    console.error("classify: create_draft failed", draft.error?.code ?? "no_row")
    return error("unknown", 500)
  }

  const outcome = await classifyPhotos(input.images, {
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.ANTHROPIC_MODEL,
  })

  const recorded = await admin.rpc("record_classification", {
    p_report_id: created.report_id,
    p_agent_run_id: created.agent_run_id,
    p_analysis_status: outcome.ok ? "done" : outcome.reason === "timeout" ? "timed_out" : "failed",
    p_result: outcome.ok ? (outcome.result as unknown as Json) : {},
    p_usage: usageFor(outcome),
  })
  // the citizen goes on either way; begin_submission stores the final description
  if (recorded.error) console.error("classify: record_classification failed", recorded.error.code)

  // Tech.md §7: Cyrillic or ekavian forms only flag the text; agent_runs is the only table the
  // server writes directly (DB.md §1), and meta holds no personal data
  if (outcome.ok && (outcome.languageFlags.length > 0 || outcome.removedContactData > 0)) {
    const meta = { language_review: outcome.languageFlags, removed_contact_data: outcome.removedContactData }
    const flagged = await admin.from("agent_runs").update({ meta }).eq("id", created.agent_run_id)
    if (flagged.error) console.error("classify: agent_runs meta failed", flagged.error.code)
  }

  const body: ClassifyResponse = outcome.ok
    ? { reportId: created.report_id, result: forClient(outcome.result) }
    : { reportId: created.report_id, fallback: true, reason: outcome.reason }
  return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } })
}
