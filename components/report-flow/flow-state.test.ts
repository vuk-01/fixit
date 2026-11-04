import { describe, expect, it } from "vitest"

import { fitWithin } from "@/lib/photos/compress"

import { flowReducer, initialFlowState, locationHint, type FlowPhoto } from "./flow-state"

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
