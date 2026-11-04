// Ticket #32: the agent steps tick off one after another with a minimum display time.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { PrepareResult } from "@/lib/agent/steps"
import type { PrepareStep } from "@/lib/constants"

import type { FlowAction } from "./flow-state"
import { createStepPacer } from "./step-pacer"

const RESULT = {
  reportId: "22222222-2222-4222-8222-222222222222",
  category: "pothole",
  lat: 42.4411,
  lng: 19.2636,
  address: null,
  jurisdiction: { outcome: "no_rule", ruleId: null, institution: null, cc: null },
  duplicate: null,
  letter: null,
} as PrepareResult

const step = (s: PrepareStep, status: "started" | "done" | "failed"): FlowAction => ({
  type: "prepareStep",
  key: "k",
  step: s,
  status,
})
const started: FlowAction = { type: "prepareStarted", key: "k" }
const done: FlowAction = { type: "prepareDone", key: "k", result: RESULT }

// the whole stream as the server sends it, all at once
const STREAM: FlowAction[] = [
  started,
  step("jurisdiction", "started"),
  step("jurisdiction", "done"),
  step("duplicates", "started"),
  step("duplicates", "done"),
  step("letter", "started"),
  step("letter", "done"),
  done,
]

const label = (a: FlowAction) => (a.type === "prepareStep" ? `${a.step}:${a.status}` : a.type)

function setup() {
  const shown: string[] = []
  const pacer = createStepPacer((a) => shown.push(label(a)), { stepMs: 900, holdMs: 400 })
  return { shown, pacer }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("createStepPacer", () => {
  it("shows each step at least 900 ms and the result 400 ms after the last tick", () => {
    const { shown, pacer } = setup()
    STREAM.forEach(pacer.dispatch)
    expect(shown).toEqual(["prepareStarted", "jurisdiction:started"])

    vi.advanceTimersByTime(899)
    expect(shown).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(shown.slice(2)).toEqual(["jurisdiction:done", "duplicates:started"])

    vi.advanceTimersByTime(900)
    expect(shown.slice(4)).toEqual(["duplicates:done", "letter:started"])

    vi.advanceTimersByTime(900)
    expect(shown.slice(6)).toEqual(["letter:done"])

    vi.advanceTimersByTime(399)
    expect(shown).not.toContain("prepareDone")
    vi.advanceTimersByTime(1)
    expect(shown.at(-1)).toBe("prepareDone")
  })

  it("takes about 3.1 s in all for a stream that arrives at once", () => {
    const { shown, pacer } = setup()
    const t0 = Date.now()
    STREAM.forEach(pacer.dispatch)
    vi.advanceTimersByTime(3099)
    expect(shown).not.toContain("prepareDone")
    vi.advanceTimersByTime(1)
    expect(shown).toEqual(STREAM.map(label))
    expect(Date.now() - t0).toBe(3100)
  })

  it("does not add a delay to a step that was already slower than the minimum", () => {
    const { shown, pacer } = setup()
    pacer.dispatch(started)
    pacer.dispatch(step("jurisdiction", "started"))
    vi.advanceTimersByTime(2000)
    pacer.dispatch(step("jurisdiction", "done"))
    expect(shown.at(-1)).toBe("jurisdiction:done")
  })

  it("treats a failed step like a done one", () => {
    const { shown, pacer } = setup()
    pacer.dispatch(step("letter", "started"))
    pacer.dispatch(step("letter", "failed"))
    expect(shown).toEqual(["letter:started"])
    vi.advanceTimersByTime(900)
    expect(shown).toEqual(["letter:started", "letter:failed"])
  })

  it("shows an error at once, after the steps still queued", () => {
    const { shown, pacer } = setup()
    pacer.dispatch(started)
    pacer.dispatch(step("jurisdiction", "started"))
    pacer.dispatch(step("jurisdiction", "failed"))
    pacer.dispatch({ type: "prepareError", key: "k", code: "outside_area" })
    expect(shown).toEqual(["prepareStarted", "jurisdiction:started", "jurisdiction:failed", "prepareError"])
    // nothing left on a timer
    vi.advanceTimersByTime(5000)
    expect(shown).toHaveLength(4)
  })

  it("drops what is queued after cancel", () => {
    const { shown, pacer } = setup()
    STREAM.forEach(pacer.dispatch)
    pacer.cancel()
    vi.advanceTimersByTime(5000)
    pacer.dispatch(step("duplicates", "started"))
    expect(shown).toEqual(["prepareStarted", "jurisdiction:started"])
  })

  it("keeps a duplicate in the result (FR-9 screen after the steps)", () => {
    const received: FlowAction[] = []
    const pacer = createStepPacer((a) => received.push(a))
    const duplicateResult = { ...RESULT, duplicate: { id: "d1" } } as unknown as PrepareResult
    ;[...STREAM.slice(0, -1), { type: "prepareDone", key: "k", result: duplicateResult } as FlowAction].forEach(
      pacer.dispatch,
    )
    vi.runAllTimers()
    const last = received.at(-1)
    expect(last?.type === "prepareDone" && last.result.duplicate).toEqual({ id: "d1" })
  })
})
