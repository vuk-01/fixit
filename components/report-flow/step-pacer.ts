// Ticket #32: the prepare stream ends in well under a second, so its steps would flash by.
// The pacer sits between runPrepare and the reducer and lets each step tick off one after
// another: a step's `done` / `failed` shows no earlier than `stepMs` after its `started`
// showed, and the result no earlier than `holdMs` after the last step, so the citizen sees the
// last tick. It only delays the browser's view; the server and the events stay the same.
// An error is never held back: the steps still queued show at once, then the error.

import { PREPARE_RESULT_HOLD_MS, PREPARE_STEP_MIN_MS, type PrepareStep } from "@/lib/constants"

import type { FlowAction } from "./flow-state"

export type StepPacer = {
  dispatch: (action: FlowAction) => void
  // drops what is still queued (the request was aborted or the flow went away)
  cancel: () => void
}

export function createStepPacer(
  dispatch: (action: FlowAction) => void,
  { stepMs = PREPARE_STEP_MIN_MS, holdMs = PREPARE_RESULT_HOLD_MS }: { stepMs?: number; holdMs?: number } = {},
): StepPacer {
  const queue: FlowAction[] = []
  const startedAt = new Map<PrepareStep, number>()
  let lastStepAt: number | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let cancelled = false

  // the earliest time an action may show
  const dueAt = (action: FlowAction): number => {
    if (action.type === "prepareStep" && action.status !== "started") {
      return (startedAt.get(action.step) ?? lastStepAt ?? 0) + stepMs
    }
    if (action.type === "prepareDone") return lastStepAt === null ? 0 : lastStepAt + holdMs
    return 0
  }

  const show = (action: FlowAction) => {
    if (action.type === "prepareStep") {
      const now = Date.now()
      if (action.status === "started") startedAt.set(action.step, now)
      lastStepAt = now
    }
    dispatch(action)
  }

  const drain = () => {
    timer = null
    while (!cancelled && queue.length > 0) {
      const wait = dueAt(queue[0]) - Date.now()
      if (wait > 0) {
        timer = setTimeout(drain, wait)
        return
      }
      show(queue.shift()!)
    }
  }

  const clear = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  return {
    dispatch(action) {
      if (cancelled) return
      if (action.type === "prepareError") {
        clear()
        while (queue.length > 0) dispatch(queue.shift()!)
        dispatch(action)
        return
      }
      queue.push(action)
      if (timer === null) drain()
    },
    cancel() {
      cancelled = true
      clear()
      queue.length = 0
    },
  }
}
