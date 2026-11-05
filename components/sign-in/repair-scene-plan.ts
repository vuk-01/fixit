// Plan of the sign-in repair scene (UI.md "Sign-in page"): where each problem sits around the form, where
// the worker runs from, and the order and length of the steps. Pure functions, so the layout rules and
// the loop are tested without a browser (repair-scene-plan.test.ts); repair-scene.tsx measures the page
// and draws.

// the same identifiers as the categories (GLOSSARY.md „vrsta problema")
export type ProblemKind = "pothole" | "manhole" | "street_light" | "illegal_dump"

export type Phase = "wait" | "appear" | "run" | "fix" | "done" | "vanish" | "leave"

/** One problem: its ground point (x, y), drawing scale, and where the ✓ floats. */
export type Spot = { kind: ProblemKind; x: number; y: number; scale: number; check: { x: number; y: number } }

export type Box = { top: number; bottom: number; left: number; right: number }

/** Measured in px, relative to the scene's wrapper. */
export type SceneGeometry = {
  width: number
  height: number
  /** tabs, form card and privacy notice together; the scene never draws over it */
  content: Box
  /** the active form card */
  card: Box
  /** the wrapper y where the first screen ends (before any scrolling) */
  visibleBottom: number
  /** from Tailwind `md` (48rem): problems beside the card instead of above and below it */
  wide: boolean
}

export type Step = { round: number; index: number; phase: Phase }

export const FIRST_STEP: Step = { round: 0, index: 0, phase: "wait" }

const PHASES: Phase[] = ["wait", "appear", "run", "fix", "done", "vanish", "leave"]

export const PHASE_MS: Record<Exclude<Phase, "run" | "leave">, number> = {
  wait: 700,
  appear: 800,
  fix: 1900,
  done: 950,
  vanish: 450,
}
/** the pause before the loop starts again with the first problem */
export const LOOP_PAUSE_MS = 2600

const RUN_SPEED = 0.26 // px per ms
const RUN_MS = { min: 700, max: 1700 }
/** off-screen start and end of a run, past the screen edge */
const EDGE_MARGIN = 40
/** the ✓ never floats higher than this, so it is never cut off at the top */
const CHECK_MIN_Y = 9

// where the worker stands from the problem's ground point, on the side he came from (drawing units)
const STAND_OFFSET: Record<ProblemKind, number> = { pothole: 24, manhole: 24, street_light: 22, illegal_dump: 30 }
// how high the ✓ floats over the ground point; the street light has its own placement (lampCheck)
const CHECK_RISE: Record<Exclude<ProblemKind, "street_light">, number> = { pothole: 24, manhole: 24, illegal_dump: 36 }

/** Phone band: the top band is the content's 64 px top padding; the dump needs this much free below it. */
export const PHONE_BOTTOM_BAND_MIN = 84

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** 1: the worker comes in from the left edge, -1: from the right; always the edge nearer the problem. */
export function sideOf(x: number, width: number): 1 | -1 {
  return x < width / 2 ? 1 : -1
}

function spot(kind: Exclude<ProblemKind, "street_light">, x: number, y: number, scale: number): Spot {
  return { kind, x, y, scale, check: { x, y: Math.max(y - CHECK_RISE[kind] * scale, CHECK_MIN_Y) } }
}

// The lamp head leans toward the worker. "above": the ✓ over the head (beside the card there is no room
// between the post and the card); "beside": on the far side of the post (the phone's top band has no room
// above the lamp).
function lampSpot(x: number, y: number, scale: number, width: number, check: "above" | "beside"): Spot {
  const dir = sideOf(x, width)
  const at = check === "above" ? { x: x - dir * 9 * scale, y: y - 60 * scale } : { x: x + dir * 16 * scale, y: y - 38 * scale }
  return { kind: "street_light", x, y, scale, check: { x: at.x, y: Math.max(at.y, CHECK_MIN_Y) } }
}

/**
 * Problems in loop order: pothole, manhole, street light, illegal dump.
 * Wide: beside the card (pothole left, manhole right, street light top right, dump bottom left).
 * Phone: in the band above the tabs; the dump below the notice only when that band is on the first screen,
 * otherwise the loop has three problems.
 */
export function planSpots(g: SceneGeometry): Spot[] {
  const { width, content, card } = g

  if (g.wide) {
    const gutter = Math.min(content.left, width - content.right)
    const scale = clamp(gutter / 110, 1.2, 1.7)
    const near = clamp(gutter * 0.42, 70, 175)
    const cardHeight = card.bottom - card.top
    return [
      spot("pothole", content.left - near, card.top + cardHeight * 0.3, scale),
      spot("manhole", content.right + near, card.top + cardHeight * 0.64, scale),
      lampSpot(content.right + clamp(gutter * 0.2, 36, 72), content.top + 50 * scale, scale, width, "above"),
      spot("illegal_dump", content.left - clamp(gutter * 0.3, 60, 130), card.bottom, scale),
    ]
  }

  const ground = content.top - 10
  const spots = [
    spot("pothole", width * 0.3, ground, 1),
    spot("manhole", width * 0.64, ground, 1),
    lampSpot(width - 42, ground, 1, width, "beside"),
  ]
  // low enough that the cheering worker's raised broom stays clear of the notice
  if (Math.min(g.height, g.visibleBottom) - content.bottom >= PHONE_BOTTOM_BAND_MIN) {
    spots.push(spot("illegal_dump", width * 0.24, content.bottom + 64, 1))
  }
  return spots
}

/** The worker's run for one problem: from the nearer edge to his place beside it, and back. */
export function workerRoute(s: Spot, width: number) {
  const dir = sideOf(s.x, width)
  const edgeX = dir === 1 ? -EDGE_MARGIN : width + EDGE_MARGIN
  const standX = s.x - dir * STAND_OFFSET[s.kind] * s.scale
  const runMs = clamp(Math.abs(standX - edgeX) / RUN_SPEED, RUN_MS.min, RUN_MS.max)
  return { dir, edgeX, standX, runMs }
}

export function stepDuration(step: Step, runMs: number): number {
  if (step.phase === "run" || step.phase === "leave") return runMs
  if (step.phase === "wait" && step.index === 0 && step.round > 0) return LOOP_PAUSE_MS
  return PHASE_MS[step.phase]
}

/** One problem at a time; after the worker leaves the last one, the loop starts again. */
export function nextStep(step: Step, spotCount: number): Step {
  if (step.phase !== "leave") return { ...step, phase: PHASES[PHASES.indexOf(step.phase) + 1] }
  return step.index >= spotCount - 1
    ? { round: step.round + 1, index: 0, phase: "wait" }
    : { round: step.round, index: step.index + 1, phase: "wait" }
}
