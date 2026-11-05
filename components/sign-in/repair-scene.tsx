"use client"

import { cn } from "cn"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import { Check, Problem, Worker } from "./repair-scene-art"
import {
  FIRST_STEP,
  nextStep,
  planSpots,
  stepDuration,
  workerRoute,
  type Box,
  type Phase,
  type Spot,
  type Step,
} from "./repair-scene-plan"
import s from "./repair-scene.module.css"

// Decorative animation around the sign-in form (UI.md "Sign-in page"). Automatic, no interaction:
// problems appear one at a time around the card, a worker runs in from the nearer screen edge, fixes each
// with its tool, a ✓ shows, the problem disappears and the worker runs off; after the last one, a pause
// and the loop repeats.
//
// The wrapper holds the layer and the page content. The layer is aria-hidden, has pointer-events: none
// and sits under the content (z-0; the content is `relative z-10`). The content element is marked
// `data-scene-content`: the scene measures it and its visible form card (`[data-slot=card]`) and never
// draws over it. Phones (below `md`) need 64 px of padding above and below the content for the problems.
// prefers-reduced-motion: a static scene, the first problem already fixed.

const WIDE_QUERY = "(min-width: 48rem)" // Tailwind `md`, the page's breakpoint for the phone bands
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

type Layout = { width: number; height: number; spots: Spot[] }

function measure(wrapper: HTMLElement, wide: boolean): Layout | null {
  const content = wrapper.querySelector<HTMLElement>("[data-scene-content]")
  const first = content?.firstElementChild
  const last = content?.lastElementChild
  // the other tab's card is hidden and has no size
  const card = [...(content?.querySelectorAll<HTMLElement>("[data-slot=card]") ?? [])].find(
    (el) => el.offsetHeight > 0,
  )
  if (!first || !last || !card) return null

  const box = wrapper.getBoundingClientRect()
  const rel = (el: Element): Box => {
    const r = el.getBoundingClientRect()
    return { top: r.top - box.top, bottom: r.bottom - box.top, left: r.left - box.left, right: r.right - box.left }
  }
  const head = rel(first)
  const spots = planSpots({
    width: box.width,
    height: box.height,
    content: { top: head.top, left: head.left, right: head.right, bottom: rel(last).bottom },
    card: rel(card),
    visibleBottom: window.innerHeight - (box.top + window.scrollY),
    wide,
  })
  return { width: box.width, height: box.height, spots }
}

export function RepairScene({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const wide = useMediaQuery(WIDE_QUERY)
  const reduced = useMediaQuery(REDUCED_QUERY)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [step, setStep] = useState<Step>(FIRST_STEP)

  // measure on mount, on resize, and when the content changes size (tab switch, error message)
  useEffect(() => {
    const wrapper = ref.current
    const content = wrapper?.querySelector("[data-scene-content]")
    if (!wrapper || !content) return
    const observer = new ResizeObserver(() => setLayout(measure(wrapper, wide)))
    observer.observe(wrapper)
    observer.observe(content)
    return () => observer.disconnect()
  }, [wide])

  const spots = layout?.spots ?? []
  // the number of problems can drop (a phone rotated, the bottom band gone) in the middle of a loop
  const index = Math.min(step.index, spots.length - 1)
  const spot = spots[index]
  const route = spot && layout ? workerRoute(spot, layout.width) : null

  const runMs = route?.runMs

  // one timer per step; a re-measure that keeps the same run length does not restart it
  useEffect(() => {
    if (reduced || runMs === undefined) return
    const current = { ...step, index }
    const id = window.setTimeout(() => setStep(nextStep(current, spots.length)), stepDuration(current, runMs))
    return () => window.clearTimeout(id)
  }, [step, index, spots.length, runMs, reduced])

  return (
    <div ref={ref} className={cn("relative isolate overflow-x-clip", className)}>
      <div aria-hidden className={s.layer}>
        {layout && spot && route && (
          <Scene layout={layout} spot={spot} route={route} step={step} index={index} reduced={reduced} />
        )}
      </div>
      {children}
    </div>
  )
}

function Scene({
  layout,
  spot,
  route,
  step,
  index,
  reduced,
}: {
  layout: Layout
  spot: Spot
  route: ReturnType<typeof workerRoute>
  step: Step
  index: number
  reduced: boolean
}) {
  const { dir, edgeX, standX, runMs } = route
  // static scene: the first problem already fixed, the worker beside it
  const phase: Phase = reduced ? "done" : step.phase
  const atSpot = reduced || phase === "run" || phase === "fix" || phase === "done" || phase === "vanish"
  const moving = !reduced && (phase === "run" || phase === "leave")
  const transition =
    phase === "run"
      ? `transform ${runMs}ms cubic-bezier(0.25, 0.7, 0.35, 1)`
      : phase === "leave"
        ? `transform ${runMs}ms cubic-bezier(0.55, 0, 0.8, 0.45)`
        : "none"

  return (
    <svg className={s.scene} viewBox={`0 0 ${layout.width} ${layout.height}`} data-phase={phase}>
      {/* a new key per problem restarts its pop-in */}
      <g key={`${step.round}-${index}`} transform={`translate(${spot.x} ${spot.y}) scale(${spot.scale})`}>
        <g className={s.problem}>
          <g className={s.pop}>
            <Problem kind={spot.kind} dir={dir} />
          </g>
        </g>
      </g>

      <g
        className={s.worker}
        data-kind={spot.kind}
        data-moving={moving || undefined}
        style={{ transform: `translate(${atSpot ? standX : edgeX}px, ${spot.y}px)`, transition }}
      >
        <g transform={`scale(${(phase === "leave" ? -dir : dir) * spot.scale} ${spot.scale})`}>
          <g className={s.bob}>
            <Worker kind={spot.kind} />
          </g>
        </g>
      </g>

      <g transform={`translate(${spot.check.x} ${spot.check.y}) scale(${spot.scale})`}>
        <g className={s.check}>
          <Check />
        </g>
      </g>
    </svg>
  )
}
