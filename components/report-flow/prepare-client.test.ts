// Ticket #10: the client reads the prepare stream with fetch and response.body.
import { afterEach, describe, expect, it, vi } from "vitest"

import type { FlowAction } from "./flow-state"
import { parseSse, runPrepare, toPrepareEvent } from "./prepare-client"

const INPUT = { reportId: "22222222-2222-4222-8222-222222222222", lat: 42.4411, lng: 19.2636, category: "pothole" as const }
const RESULT = {
  reportId: INPUT.reportId,
  category: "pothole",
  lat: INPUT.lat,
  lng: INPUT.lng,
  address: null,
  jurisdiction: { outcome: "no_rule", ruleId: null, institution: null, cc: null },
  duplicate: null,
  letter: null,
}

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

function streamResponse(chunks: string[]) {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return new Response(body, { headers: { "Content-Type": "text/event-stream; charset=utf-8" } })
}

async function run(response: Response | Promise<Response>, signal = new AbortController().signal) {
  vi.stubGlobal("fetch", vi.fn(async () => response))
  const actions: FlowAction[] = []
  await runPrepare(INPUT, "k", (a) => actions.push(a), signal)
  return actions
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("parseSse", () => {
  it("splits complete messages, skips comments and keeps the rest", () => {
    const { messages, rest } = parseSse(`: padding\n\nevent: step\ndata: {"a":1}\n\nevent: res`)
    expect(messages).toEqual([{ event: "step", data: '{"a":1}' }])
    expect(rest).toBe("event: res")
  })

  it("accepts CRLF and multi-line data", () => {
    expect(parseSse("event: x\r\ndata: 1\r\ndata: 2\r\n\r\n").messages).toEqual([{ event: "x", data: "1\n2" }])
  })
})

describe("toPrepareEvent", () => {
  it("keeps only known steps and statuses", () => {
    expect(toPrepareEvent({ event: "step", data: '{"step":"duplicates","status":"done"}' })).toEqual({
      event: "step",
      data: { step: "duplicates", status: "done" },
    })
    expect(toPrepareEvent({ event: "step", data: '{"step":"classify","status":"done"}' })).toBeNull()
    expect(toPrepareEvent({ event: "step", data: "not json" })).toBeNull()
  })

  it("turns an unknown error code into unknown", () => {
    expect(toPrepareEvent({ event: "error", data: '{"code":"weird"}' })).toEqual({ event: "error", data: { code: "unknown" } })
  })
})

describe("runPrepare", () => {
  it("posts the input as JSON and reports the steps, then the result", async () => {
    const actions = await run(
      streamResponse([
        `:${" ".repeat(2048)}\n\n`,
        sse("step", { step: "jurisdiction", status: "started" }),
        // a message split over two chunks
        sse("step", { step: "jurisdiction", status: "done" }).slice(0, 10),
        sse("step", { step: "jurisdiction", status: "done" }).slice(10),
        sse("result", RESULT),
      ]),
    )
    expect(fetch).toHaveBeenCalledWith(
      "/api/agent/prepare",
      expect.objectContaining({ method: "POST", body: JSON.stringify(INPUT) }),
    )
    expect(actions.map((a) => a.type)).toEqual(["prepareStarted", "prepareStep", "prepareStep", "prepareDone"])
    expect(actions[2]).toEqual({ type: "prepareStep", key: "k", step: "jurisdiction", status: "done" })
  })

  it("reports the error event's code", async () => {
    const actions = await run(streamResponse([sse("error", { code: "outside_area" })]))
    expect(actions.at(-1)).toEqual({ type: "prepareError", key: "k", code: "outside_area" })
  })

  it("reports the JSON error of a refused request", async () => {
    const actions = await run(new Response(JSON.stringify({ error: "not_allowed" }), { status: 403 }))
    expect(actions.at(-1)).toEqual({ type: "prepareError", key: "k", code: "not_allowed" })
  })

  it("reports unknown when the stream ends without a result", async () => {
    const actions = await run(streamResponse([sse("step", { step: "jurisdiction", status: "started" })]))
    expect(actions.at(-1)).toEqual({ type: "prepareError", key: "k", code: "unknown" })
  })

  it("reports unknown when the network fails", async () => {
    const actions = await run(Promise.reject(new TypeError("Failed to fetch")))
    expect(actions.at(-1)).toEqual({ type: "prepareError", key: "k", code: "unknown" })
  })

  it("stays quiet after it was aborted (a newer request took over)", async () => {
    const controller = new AbortController()
    controller.abort()
    const actions = await run(Promise.reject(new DOMException("aborted", "AbortError")), controller.signal)
    expect(actions.map((a) => a.type)).toEqual(["prepareStarted"])
  })
})
