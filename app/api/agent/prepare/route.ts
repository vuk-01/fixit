import { NextResponse } from "next/server"
import { z } from "zod"

import { runPrepare, type PrepareDeps } from "@/lib/agent/prepare"
import { encodeEvent, SSE_HEADERS, SSE_PADDING, type PrepareErrorCode } from "@/lib/agent/steps"
import { CATEGORY_ORDER, type ReportCategory } from "@/lib/constants"
import { roundCoordinate } from "@/lib/geo/address"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60

const inputSchema = z.object({
  reportId: z.uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  category: z.enum(CATEGORY_ORDER as [ReportCategory, ...ReportCategory[]]),
})

const error = (code: PrepareErrorCode, status: number) =>
  NextResponse.json({ error: code }, { status, headers: { "Cache-Control": "private, no-store" } })

// POST /api/agent/prepare (Tech.md §6, point 2): jurisdiction, duplicates and the letter for the
// review, as Server-Sent Events. Runs once the pin is confirmed inside Podgorica and the
// category is known (from the model or picked by hand), and again when the category changes.
// No model call here (AGENTS.md rule 1).
//
// Before the stream (JSON with a status): getClaims() → account that is not anonymous → zod →
// the draft is the caller's own and still a draft. Then the stream: `step` events per step,
// and `result` or `error` at the end.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims || claims.is_anonymous !== false) return error("not_authenticated", 401)

  const body = await request.json().catch(() => null)
  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) return error("invalid_request", 400)
  const input = {
    reportId: parsed.data.reportId,
    userId: claims.sub,
    lat: roundCoordinate(parsed.data.lat),
    lng: roundCoordinate(parsed.data.lng),
    category: parsed.data.category,
  }

  // ownership, with the citizen's session: RLS shows report_private only to the reporter, so
  // somebody else's (public) report comes back without it
  const { data: draft, error: readError } = await supabase
    .from("reports")
    .select("status, lat, lng, address, address_source, report_private(reporter_id)")
    .eq("id", input.reportId)
    .maybeSingle()
  if (readError) {
    console.error("prepare: draft read failed", readError.code)
    return error("unknown", 500)
  }
  if (!draft) return error("not_found", 404)
  if (draft.report_private?.reporter_id !== claims.sub) return error("not_allowed", 403)
  if (draft.status !== "draft") return error("invalid_state", 409)

  const deps: PrepareDeps = { supabase, admin: createAdminClient(), buildLetter: null }
  const snapshot = { lat: draft.lat, lng: draft.lng, address: draft.address, addressSource: draft.address_source }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(SSE_PADDING)
      await runPrepare(deps, input, snapshot, (event) => {
        try {
          controller.enqueue(encodeEvent(event))
        } catch {
          // the client went away; the steps still finish and are logged
        }
      })
      try {
        controller.close()
      } catch {
        // already closed by a cancelled request
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
