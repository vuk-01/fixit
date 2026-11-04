import { describe, expect, it } from "vitest"

import { fitWithin } from "@/lib/photos/compress"

import type { ClassificationForClient } from "@/lib/agent/schema"

import type { PrepareResult } from "@/lib/agent/steps"
import { ERROR_MESSAGES } from "@/lib/constants"

import {
  currentPrepare,
  draftId,
  flowReducer,
  initialFlowState,
  inputFromKey,
  locationError,
  locationHint,
  needsCategoryChoice,
  prepareDue,
  prepareInput,
  prepareKey,
  showCategoryPicker,
  shownDuplicate,
  visibleSteps,
  type FlowPhoto,
  type FlowState,
} from "./flow-state"

const photo = (id: string): FlowPhoto => ({
  id,
  path: `${id}.jpg`,
  previewUrl: `blob:${id}`,
  full: new Blob(),
  model: new Blob(),
  upload: "uploading",
})

describe("flowReducer", () => {
  it("goes to the location screen as soon as a photo is in (FR-2)", () => {
    const s = flowReducer(flowReducer(initialFlowState, { type: "pick", source: "gallery" }), {
      type: "photosAdded",
      photos: [photo("a")],
      notice: null,
    })
    expect(s.step).toBe("location")
    expect(s.source).toBe("gallery")
  })

  it("stays on the photo screen when no photo could be opened", () => {
    const s = flowReducer(initialFlowState, { type: "photosAdded", photos: [], notice: "x" })
    expect(s.step).toBe("photos")
    expect(s.notice).toBe("x")
  })

  it("keeps the first source and a found position", () => {
    let s = flowReducer(initialFlowState, { type: "pick", source: "camera" })
    s = flowReducer(s, { type: "pick", source: "gallery" })
    expect(s.source).toBe("camera")
    s = flowReducer(s, { type: "device", device: { status: "found", lat: 1, lng: 2, accuracy: 10 } })
    s = flowReducer(s, { type: "device", device: { status: "unavailable" } })
    expect(s.device.status).toBe("found")
  })

  it("tracks the upload of each photo", () => {
    let s = flowReducer(initialFlowState, { type: "photosAdded", photos: [photo("a"), photo("b")], notice: null })
    s = flowReducer(s, { type: "upload", id: "b", status: "done" })
    expect(s.photos.map((p) => p.upload)).toEqual(["uploading", "done"])
  })
})

describe("analysis and category (ticket #9, FR-7)", () => {
  const result = (over: Partial<ClassificationForClient> = {}): ClassificationForClient => ({
    is_municipal_problem: true,
    category: "pothole",
    confidence: 0.9,
    description: "Rupa na kolovozu.",
    immediate_danger: false,
    personal_data_photos: [],
    ...over,
  })
  const pending = flowReducer(initialFlowState, { type: "analysisStarted" })
  const confirmed = (s: FlowState) => flowReducer(s, { type: "confirm", point: { lat: 42.44, lng: 19.26, address: null } })

  it("takes the model's category when it is sure", () => {
    const s = flowReducer(pending, { type: "analysisDone", reportId: "r", result: result() })
    expect(s.category).toBe("pothole")
    expect(s.categorySource).toBe("ai")
    expect(s.description).toBe("Rupa na kolovozu.")
    expect(showCategoryPicker(confirmed(s))).toBe(false)
  })

  it.each([
    ["confidence below 0.6", result({ confidence: 0.59 })],
    ["not a municipal problem", result({ is_municipal_problem: false, category: "other" })],
  ])("asks the citizen when %s and keeps the description", (_label, r) => {
    const s = flowReducer(pending, { type: "analysisDone", reportId: "r", result: r })
    expect(s.category).toBeNull()
    expect(s.description).toBe("Rupa na kolovozu.")
    expect(showCategoryPicker(s)).toBe(false) // only after the pin is confirmed
    expect(showCategoryPicker(confirmed(s))).toBe(true)
  })

  it("goes to the manual flow on fallback and waits while the analysis runs", () => {
    expect(showCategoryPicker(confirmed(pending))).toBe(false)
    const s = flowReducer(pending, { type: "analysisFallback", reportId: null, reason: "client_timeout" })
    expect(needsCategoryChoice(s.analysis)).toBe(true)
    expect(showCategoryPicker(confirmed(s))).toBe(true)
    expect(s.description).toBe("")
    const found = flowReducer(s, { type: "draftFound", reportId: "r" })
    expect(draftId(found.analysis)).toBe("r")
  })

  it("ignores an answer that arrives after the manual flow started", () => {
    let s = flowReducer(pending, { type: "analysisFallback", reportId: "r", reason: "client_timeout" })
    s = flowReducer(s, { type: "analysisDone", reportId: "r", result: result() })
    expect(s.analysis.status).toBe("fallback")
    expect(s.category).toBeNull()
  })

  it("one tap picks the category; 'Promijeni vrstu' opens the picker again", () => {
    let s = confirmed(flowReducer(pending, { type: "analysisDone", reportId: "r", result: result() }))
    s = flowReducer(s, { type: "changeCategory" })
    expect(showCategoryPicker(s)).toBe(true)
    s = flowReducer(s, { type: "chooseCategory", category: "sidewalk" })
    expect(s.category).toBe("sidewalk")
    expect(s.categorySource).toBe("citizen")
    expect(showCategoryPicker(s)).toBe(false)
  })
})

describe("locationHint (FR-3)", () => {
  it("asks to check the pin for a coarse fix or a gallery photo", () => {
    const found = (accuracy: number) => ({ status: "found" as const, lat: 0, lng: 0, accuracy })
    expect(locationHint({ device: found(20), source: "camera" }, 50)).toBeNull()
    expect(locationHint({ device: found(120), source: "camera" }, 50)).toBe("checkPin")
    expect(locationHint({ device: found(20), source: "gallery" }, 50)).toBe("checkPin")
    expect(locationHint({ device: { status: "unavailable" }, source: "camera" }, 50)).toBe("unavailable")
    expect(locationHint({ device: { status: "pending" }, source: "camera" }, 50)).toBeNull()
  })
})

describe("fitWithin", () => {
  it("scales the longer side down and never up", () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 })
    expect(fitWithin(3000, 4000, 1024)).toEqual({ width: 768, height: 1024 })
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 })
  })
})

describe("prepare (ticket #10, FR-5 step 3)", () => {
  const point = { lat: 42.4411, lng: 19.2636, address: null }
  const recognised = flowReducer(flowReducer(initialFlowState, { type: "analysisStarted" }), {
    type: "analysisDone",
    reportId: "r",
    result: {
      is_municipal_problem: true,
      category: "pothole",
      confidence: 0.9,
      description: "Rupa.",
      immediate_danger: false,
      personal_data_photos: [],
    },
  })
  const ready = flowReducer(recognised, { type: "confirm", point })
  const input = prepareInput(ready)!
  const key = prepareKey(input)
  const outcome = (duplicate: PrepareResult["duplicate"] = null): PrepareResult => ({
    reportId: "r",
    category: "pothole",
    lat: point.lat,
    lng: point.lng,
    address: null,
    jurisdiction: { outcome: "no_rule", ruleId: null, institution: null, cc: null },
    duplicate,
    letter: null,
  })

  it("needs a confirmed pin, a category and the draft id", () => {
    expect(prepareInput(recognised)).toBeNull()
    expect(input).toEqual({ reportId: "r", lat: 42.4411, lng: 19.2636, category: "pothole" })
    expect(inputFromKey(key)).toEqual(input)
    const waiting = flowReducer(flowReducer(initialFlowState, { type: "analysisStarted" }), { type: "confirm", point })
    expect(prepareInput(waiting)).toBeNull()
  })

  it("shows the first step as running while the analysis still runs", () => {
    const waiting = flowReducer(flowReducer(initialFlowState, { type: "analysisStarted" }), { type: "confirm", point })
    expect(visibleSteps(waiting)).toEqual({ jurisdiction: "started", duplicates: "waiting", letter: "waiting" })
  })

  it("follows the step events of the current request and ignores an older one", () => {
    expect(prepareDue(ready, input)).toBe(true)
    let s = flowReducer(ready, { type: "prepareStarted", key })
    expect(prepareDue(s, input)).toBe(false)
    s = flowReducer(s, { type: "prepareStep", key, step: "jurisdiction", status: "done" })
    s = flowReducer(s, { type: "prepareStep", key: "older", step: "duplicates", status: "failed" })
    expect(visibleSteps(s)).toEqual({ jurisdiction: "done", duplicates: "waiting", letter: "waiting" })
    s = flowReducer(s, { type: "prepareDone", key: "older", result: outcome() })
    expect(s.prepare.status).toBe("running")
    s = flowReducer(s, { type: "prepareDone", key, result: outcome() })
    expect(currentPrepare(s)?.status).toBe("done")
  })

  it("starts again for a new category, and after 'Pokušaj ponovo'", () => {
    let s = flowReducer(flowReducer(ready, { type: "prepareStarted", key }), { type: "prepareDone", key, result: outcome() })
    s = flowReducer(flowReducer(s, { type: "changeCategory" }), { type: "chooseCategory", category: "graffiti" })
    expect(currentPrepare(s)).toBeNull()
    expect(prepareDue(s, prepareInput(s))).toBe(true)

    let failed = flowReducer(flowReducer(ready, { type: "prepareStarted", key }), { type: "prepareError", key, code: "unknown" })
    expect(prepareDue(failed, input)).toBe(false)
    failed = flowReducer(failed, { type: "prepareRetry" })
    expect(prepareDue(failed, input)).toBe(true)
  })

  it("goes back to the map with the FR-4 message for outside_area", () => {
    const s = flowReducer(flowReducer(ready, { type: "prepareStarted", key }), { type: "prepareError", key, code: "outside_area" })
    expect(s.step).toBe("location")
    expect(locationError(s)).toBe(ERROR_MESSAGES.outside_area)
    expect(locationError(flowReducer(s, { type: "confirm", point }))).toBeNull()
  })

  it("shows the duplicate until the citizen answers 'Ipak pošalji novu'", () => {
    const duplicate = {
      id: "d",
      code: "FX-2026-00001",
      status: "sent" as const,
      category: "pothole" as const,
      lat: 0,
      lng: 0,
      address: null,
      like_count: 0,
      submitted_at: "2026-11-01T10:00:00Z",
      closed_at: null,
      is_demo: false,
      photoUrl: null,
      distanceM: 12,
      isOwn: false,
    }
    let s = flowReducer(flowReducer(ready, { type: "prepareStarted", key }), {
      type: "prepareDone",
      key,
      result: outcome(duplicate),
    })
    expect(shownDuplicate(s)?.id).toBe("d")
    s = flowReducer(s, { type: "dismissDuplicate", id: "d" })
    expect(shownDuplicate(s)).toBeNull()
  })
})
