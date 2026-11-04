import { describe, expect, it } from "vitest"

import { fitWithin } from "@/lib/photos/compress"

import type { ClassificationForClient } from "@/lib/agent/schema"

import {
  draftId,
  flowReducer,
  initialFlowState,
  locationHint,
  needsCategoryChoice,
  showCategoryPicker,
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
