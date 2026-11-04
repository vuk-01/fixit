"use client"

import { Circle, CircleCheck, CircleX, LoaderCircle } from "lucide-react"

import { PREPARE_STEPS, PREPARE_TEXT } from "@/lib/constants"

import type { PrepareStepState, PrepareSteps } from "./flow-state"

const STATE_TEXT: Record<PrepareStepState, string> = {
  waiting: PREPARE_TEXT.stepWaiting,
  started: PREPARE_TEXT.stepRunning,
  done: PREPARE_TEXT.stepDone,
  failed: PREPARE_TEXT.stepFailed,
}

// The agent's steps after "Potvrdi lokaciju", live and without a tap (FR-5 step 3). Each step
// has an icon and its state in text for screen readers, never colour alone (PRD §6).
export function AgentSteps({ steps }: { steps: PrepareSteps }) {
  return (
    <ol className="flex flex-col gap-2 text-sm" aria-label={PREPARE_TEXT.stepsLabel} aria-live="polite" data-testid="agent-steps">
      {PREPARE_STEPS.map((step) => {
        const state = steps[step]
        return (
          <li key={step} className="flex min-h-6 items-center gap-2" data-step={step} data-state={state}>
            {state === "started" && <LoaderCircle aria-hidden className="size-5 shrink-0 animate-spin text-primary" />}
            {state === "done" && <CircleCheck aria-hidden className="size-5 shrink-0 text-status-resolved" />}
            {state === "failed" && <CircleX aria-hidden className="size-5 shrink-0 text-destructive" />}
            {state === "waiting" && <Circle aria-hidden className="size-5 shrink-0 text-muted-foreground/50" />}
            <span className={state === "waiting" ? "text-muted-foreground" : undefined}>{PREPARE_TEXT.steps[step]}</span>
            <span className="sr-only">({STATE_TEXT[state]})</span>
          </li>
        )
      })}
    </ol>
  )
}
