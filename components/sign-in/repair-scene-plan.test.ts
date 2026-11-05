import { describe, expect, it } from "vitest"

import {
  FIRST_STEP,
  LOOP_PAUSE_MS,
  PHASE_MS,
  nextStep,
  planSpots,
  stepDuration,
  workerRoute,
  type SceneGeometry,
  type Step,
} from "./repair-scene-plan"

// measured on /uloguj-se (sign-in tab): 1280 × 800 laptop, 393 × 852 and 360 × 640 phones
const laptop: SceneGeometry = {
  width: 1280,
  height: 724,
  content: { top: 101, bottom: 623, left: 432, right: 848 },
  card: { top: 152, bottom: 527, left: 432, right: 848 },
  visibleBottom: 724,
  wide: true,
}
const tallPhone: SceneGeometry = {
  width: 393,
  height: 776,
  content: { top: 117, bottom: 659, left: 16, right: 377 },
  card: { top: 192, bottom: 543, left: 16, right: 377 },
  visibleBottom: 776,
  wide: false,
}
const shortPhone: SceneGeometry = {
  width: 360,
  height: 671,
  content: { top: 64, bottom: 607, left: 16, right: 344 },
  card: { top: 116, bottom: 491, left: 16, right: 344 },
  visibleBottom: 564,
  wide: false,
}

describe("planSpots", () => {
  it("puts the problems beside the card on a wide screen, in loop order", () => {
    const spots = planSpots(laptop)
    expect(spots.map((s) => s.kind)).toEqual(["pothole", "manhole", "street_light", "illegal_dump"])
    const [pothole, manhole, light, dump] = spots
    expect(pothole.x).toBeLessThan(laptop.content.left)
    expect(dump.x).toBeLessThan(laptop.content.left)
    expect(manhole.x).toBeGreaterThan(laptop.content.right)
    expect(light.x).toBeGreaterThan(laptop.content.right)
    // street light top right, dump bottom left
    expect(light.y).toBeLessThan(manhole.y)
    expect(dump.y).toBeGreaterThan(pothole.y)
  })

  it("keeps the drawings clear of the content beside the card", () => {
    for (const s of planSpots(laptop)) {
      // the widest drawing (road piece, dump) reaches 40 units from its ground point
      const reach = 40 * s.scale
      if (s.x < laptop.content.left) expect(s.x + reach).toBeLessThan(laptop.content.left)
      else expect(s.x - reach).toBeGreaterThan(laptop.content.right)
    }
  })

  it("uses the band above the tabs on a phone, and the band below the notice when it is on screen", () => {
    const spots = planSpots(tallPhone)
    expect(spots.map((s) => s.kind)).toEqual(["pothole", "manhole", "street_light", "illegal_dump"])
    for (const s of spots.slice(0, 3)) expect(s.y).toBeLessThan(tallPhone.content.top)
    expect(spots[3].y).toBeGreaterThan(tallPhone.content.bottom)
    expect(spots[3].x).toBeLessThan(tallPhone.width / 2)
  })

  it("drops the dump on a short phone where the band below the notice is off screen", () => {
    expect(planSpots(shortPhone).map((s) => s.kind)).toEqual(["pothole", "manhole", "street_light"])
  })

  it("never floats a ✓ above the top of the scene", () => {
    for (const g of [laptop, tallPhone, shortPhone]) {
      for (const s of planSpots(g)) expect(s.check.y).toBeGreaterThanOrEqual(9)
    }
  })
})

describe("workerRoute", () => {
  it("runs in from the screen edge nearer the problem and stops beside it on that side", () => {
    const [pothole, manhole] = planSpots(laptop)
    const left = workerRoute(pothole, laptop.width)
    expect(left.dir).toBe(1)
    expect(left.edgeX).toBeLessThan(0)
    expect(left.standX).toBeLessThan(pothole.x)

    const right = workerRoute(manhole, laptop.width)
    expect(right.dir).toBe(-1)
    expect(right.edgeX).toBeGreaterThan(laptop.width)
    expect(right.standX).toBeGreaterThan(manhole.x)
  })

  it("keeps a run between 0.7 and 1.7 s", () => {
    for (const g of [laptop, tallPhone]) {
      for (const s of planSpots(g)) {
        const { runMs } = workerRoute(s, g.width)
        expect(runMs).toBeGreaterThanOrEqual(700)
        expect(runMs).toBeLessThanOrEqual(1700)
      }
    }
  })
})

describe("nextStep and stepDuration", () => {
  it("goes through one problem at a time and starts the loop again after the last", () => {
    const phases: string[] = []
    let step: Step = FIRST_STEP
    while (step.round === 0) {
      phases.push(`${step.index}:${step.phase}`)
      step = nextStep(step, 3)
    }
    expect(phases).toHaveLength(21)
    expect(phases.slice(0, 7)).toEqual(["0:wait", "0:appear", "0:run", "0:fix", "0:done", "0:vanish", "0:leave"])
    expect(phases[7]).toBe("1:wait")
    expect(step).toEqual({ round: 1, index: 0, phase: "wait" })
  })

  it("pauses longer before the loop starts again, and runs take the route's time", () => {
    expect(stepDuration(FIRST_STEP, 1000)).toBe(PHASE_MS.wait)
    expect(stepDuration({ round: 1, index: 0, phase: "wait" }, 1000)).toBe(LOOP_PAUSE_MS)
    expect(stepDuration({ round: 1, index: 2, phase: "wait" }, 1000)).toBe(PHASE_MS.wait)
    expect(stepDuration({ round: 0, index: 1, phase: "run" }, 1234)).toBe(1234)
    expect(stepDuration({ round: 0, index: 1, phase: "leave" }, 1234)).toBe(1234)
  })
})
