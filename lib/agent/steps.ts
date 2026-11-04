import "server-only"

import type { PrepareStep, ReportCategory } from "@/lib/constants"
import type { Database } from "@/lib/supabase/database.types"
import type { MapReport } from "@/lib/reports/public-map"

// POST /api/agent/prepare (Tech.md §6, point 2) answers with Server-Sent Events. The client
// reads them with fetch and response.body (the request is a POST, so no EventSource) and
// imports only the types from here.

export type StepStatus = "started" | "done" | "failed"

export type JurisdictionOutcome = Database["public"]["Enums"]["jurisdiction_outcome"]

export type InstitutionRef = { id: string; name: string }

// From resolve_jurisdiction only (AGENTS.md rule 1): never from the model or the photo.
// matched → a recipient (and maybe a cc); no_rule / no_email → no recipient, the report goes
// to the administrator (FR-8).
export type JurisdictionResult = {
  outcome: JurisdictionOutcome
  ruleId: string | null
  institution: InstitutionRef | null
  cc: InstitutionRef | null
}

// The nearest open, not hidden report of the same category within 50 m (FR-9), with the same
// public fields as a map card; is_own → "Ovaj problem ste već prijavili."
export type DuplicateReport = MapReport & { distanceM: number; isOwn: boolean }

export type PreviewLetter = { subject: string; body: string }

export type PrepareResult = {
  reportId: string
  category: ReportCategory
  lat: number
  lng: number
  // null when Nominatim did not answer: the report goes on with the coordinates (Tech.md §8)
  address: string | null
  jurisdiction: JurisdictionResult
  duplicate: DuplicateReport | null
  // null when the preview could not be made (the step then ends `failed`)
  letter: PreviewLetter | null
}

// codes before the stream (JSON with an HTTP status) and in the `error` event
export type PrepareErrorCode =
  | "not_authenticated"
  | "invalid_request"
  | "not_allowed"
  | "not_found"
  | "invalid_state"
  | "outside_area"
  | "unknown"

export type PrepareEvent =
  | { event: "step"; data: { step: PrepareStep; status: StepStatus } }
  | { event: "result"; data: PrepareResult }
  | { event: "error"; data: { code: PrepareErrorCode } }

const encoder = new TextEncoder()

export function encodeEvent(e: PrepareEvent): Uint8Array {
  return encoder.encode(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`)
}

// Safari/WebKit holds back a streamed response until about 1 KB has arrived
// (node_modules/next/dist/docs/01-app/02-guides/streaming.md, "Clients"); a comment line that
// long makes the first steps show up right away. Comment lines are ignored by SSE readers.
export const SSE_PADDING = encoder.encode(`:${" ".repeat(2048)}\n\n`)

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "private, no-cache, no-store, no-transform",
  "X-Accel-Buffering": "no",
  "X-Content-Type-Options": "nosniff",
} as const
