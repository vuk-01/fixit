// Browser side of POST /api/agent/classify (Tech.md §6, point 1). Starts as soon as the photos
// are back in the app, in parallel with the upload and the pin. The client is the outer limit:
// after 15 s it aborts and the flow continues by hand (FR-7); an answer after that is ignored.

import type { ClassifyErrorCode, ClassifyResponse } from "@/lib/agent/schema"
import { CLASSIFY_CLIENT_TIMEOUT_MS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"

import type { FlowAction, FlowPhoto } from "./flow-state"

const ERROR_CODES: readonly ClassifyErrorCode[] = [
  "not_authenticated",
  "not_allowed",
  "invalid_request",
  "daily_limit_reached",
  "unknown",
]

// The draft is made by the server before the model call; when the answer never arrives, the
// citizen's own session finds it by its photo paths (RLS shows only the reporter's photos).
export async function findDraftId(paths: string[]): Promise<string | null> {
  if (paths.length === 0) return null
  try {
    const { data } = await createClient()
      .from("report_photos")
      .select("report_id")
      .in("storage_path", paths)
      .limit(1)
      .maybeSingle()
    return data?.report_id ?? null
  } catch {
    return null
  }
}

// Runs one classify request and reports the result through `dispatch`. Resolves with the draft
// id (or null) once the flow knows how to continue, so "Odustani" can wait for it.
export async function runClassification(
  photos: FlowPhoto[],
  dispatch: (action: FlowAction) => void,
  timeoutMs: number = CLASSIFY_CLIENT_TIMEOUT_MS,
): Promise<string | null> {
  dispatch({ type: "analysisStarted" })

  const form = new FormData()
  photos.forEach((photo, i) => {
    form.append("images", photo.model, `${i + 1}.jpg`)
    form.append("photo_paths", photo.path)
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const paths = photos.map((p) => p.path)

  // no answer: manual flow at once, the draft id is looked up afterwards
  const fallback = async (): Promise<string | null> => {
    dispatch({ type: "analysisFallback", reportId: null, reason: "client_timeout" })
    const reportId = await findDraftId(paths)
    if (reportId) dispatch({ type: "draftFound", reportId })
    return reportId
  }

  try {
    const response = await fetch("/api/agent/classify", { method: "POST", body: form, signal: controller.signal })
    const body = (await response.json().catch(() => null)) as
      | ClassifyResponse
      | { error?: ClassifyErrorCode }
      | null

    if (body && "reportId" in body) {
      if ("result" in body) dispatch({ type: "analysisDone", reportId: body.reportId, result: body.result })
      else dispatch({ type: "analysisFallback", reportId: body.reportId, reason: body.reason })
      return body.reportId
    }

    const code = body && "error" in body && body.error && ERROR_CODES.includes(body.error) ? body.error : "unknown"
    // a server error after create_draft may still have left a draft behind
    if (code === "unknown") {
      const reportId = await findDraftId(paths)
      if (reportId) {
        dispatch({ type: "analysisFallback", reportId, reason: "api_error" })
        return reportId
      }
    }
    dispatch({ type: "analysisError", code })
    return null
  } catch {
    // aborted after 15 s: the server made the draft long before, so go on by hand
    if (controller.signal.aborted) return fallback()
    // the network failed: go on by hand only if a draft exists, otherwise offer a retry
    const reportId = await findDraftId(paths)
    if (reportId) {
      dispatch({ type: "analysisFallback", reportId, reason: "api_error" })
      return reportId
    }
    dispatch({ type: "analysisError", code: "unknown" })
    return null
  } finally {
    clearTimeout(timer)
  }
}
