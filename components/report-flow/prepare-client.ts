// Browser side of POST /api/agent/prepare (Tech.md §6, point 2). The answer is a stream of
// Server-Sent Events read with fetch and response.body (a POST, so no EventSource): `step`
// events while the server works, then `result` or `error`.

import type { PrepareErrorCode, PrepareEvent } from "@/lib/agent/steps"
import { PREPARE_CLIENT_TIMEOUT_MS, PREPARE_STEPS } from "@/lib/constants"

import type { FlowAction, PrepareInput } from "./flow-state"

const ERROR_CODES: readonly PrepareErrorCode[] = [
  "not_authenticated",
  "invalid_request",
  "not_allowed",
  "not_found",
  "invalid_state",
  "outside_area",
  "unknown",
]

export type SseMessage = { event: string; data: string }

// Splits complete messages (ended by a blank line) off the buffer; comment lines (": …") are
// skipped. Returns the unfinished rest for the next chunk.
export function parseSse(buffer: string): { messages: SseMessage[]; rest: string } {
  const normalized = buffer.replace(/\r\n?/g, "\n")
  const blocks = normalized.split("\n\n")
  const rest = blocks.pop() ?? ""
  const messages: SseMessage[] = []
  for (const block of blocks) {
    let event = "message"
    const data: string[] = []
    for (const line of block.split("\n")) {
      if (line === "" || line.startsWith(":")) continue
      const colon = line.indexOf(":")
      const field = colon === -1 ? line : line.slice(0, colon)
      const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "")
      if (field === "event") event = value
      else if (field === "data") data.push(value)
    }
    if (data.length > 0) messages.push({ event, data: data.join("\n") })
  }
  return { messages, rest }
}

// Only the events this client knows, with the shape it expects; anything else is dropped.
export function toPrepareEvent(message: SseMessage): PrepareEvent | null {
  let data: unknown
  try {
    data = JSON.parse(message.data)
  } catch {
    return null
  }
  if (typeof data !== "object" || data === null) return null
  const d = data as Record<string, unknown>
  if (message.event === "step") {
    const step = PREPARE_STEPS.find((s) => s === d.step)
    const status = d.status === "started" || d.status === "done" || d.status === "failed" ? d.status : null
    return step && status ? { event: "step", data: { step, status } } : null
  }
  if (message.event === "error") {
    const code = ERROR_CODES.find((c) => c === d.code) ?? "unknown"
    return { event: "error", data: { code } }
  }
  if (message.event === "result" && typeof d.reportId === "string" && typeof d.jurisdiction === "object") {
    return { event: "result", data: data as Extract<PrepareEvent, { event: "result" }>["data"] }
  }
  return null
}

// Runs one prepare request and reports it through `dispatch`, tagged with `key` so the flow can
// ignore an older request. `signal` aborts it (a new point or category, or the flow went away).
export async function runPrepare(
  input: PrepareInput,
  key: string,
  dispatch: (action: FlowAction) => void,
  signal: AbortSignal,
  timeoutMs: number = PREPARE_CLIENT_TIMEOUT_MS,
): Promise<void> {
  dispatch({ type: "prepareStarted", key })
  const timeout = AbortSignal.timeout(timeoutMs)
  const both = AbortSignal.any([signal, timeout])
  let finished = false
  const fail = (code: PrepareErrorCode) => {
    if (!finished && !signal.aborted) dispatch({ type: "prepareError", key, code })
    finished = true
  }

  try {
    const response = await fetch("/api/agent/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: both,
    })
    if (!response.ok || !response.body || !response.headers.get("Content-Type")?.startsWith("text/event-stream")) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      return fail(ERROR_CODES.find((c) => c === body?.error) ?? "unknown")
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ""
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      const parsed = parseSse(buffer + value)
      buffer = parsed.rest
      for (const message of parsed.messages) {
        const event = toPrepareEvent(message)
        if (!event || finished || signal.aborted) continue
        if (event.event === "step") {
          dispatch({ type: "prepareStep", key, step: event.data.step, status: event.data.status })
        } else if (event.event === "result") {
          finished = true
          dispatch({ type: "prepareDone", key, result: event.data })
        } else {
          fail(event.data.code)
        }
      }
    }
    // the stream ended without a result or an error
    fail("unknown")
  } catch {
    fail("unknown")
  }
}
