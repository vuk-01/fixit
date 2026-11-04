// Ticket #13: a hidden photo is never shown publicly, only the note in its place (PRD §6).
import { describe, expect, it } from "vitest"

import { publicPhotos } from "./public-photos"

const signed = new Map([
  ["a.jpg", "https://signed/a"],
  ["c.jpg", "https://signed/c"],
])

describe("publicPhotos", () => {
  it("keeps the order and puts the note where the hidden photo was", () => {
    expect(
      publicPhotos(
        [
          { storage_path: "c.jpg", position: 3 },
          { storage_path: "a.jpg", position: 1 },
        ],
        [2],
        signed
      )
    ).toEqual([
      { position: 1, hidden: false, url: "https://signed/a" },
      { position: 2, hidden: true },
      { position: 3, hidden: false, url: "https://signed/c" },
    ])
  })

  it("never gives a URL for a hidden photo, even if a visible row slipped through", () => {
    const photos = publicPhotos(
      [{ storage_path: "a.jpg", position: 1 }],
      [1],
      signed
    )
    expect(photos).toEqual([{ position: 1, hidden: true }])
    expect(JSON.stringify(photos)).not.toContain("signed")
  })

  it("has no URL when signing failed and no photos for a demo report without one", () => {
    expect(
      publicPhotos([{ storage_path: "x.jpg", position: 1 }], [], signed)
    ).toEqual([{ position: 1, hidden: false, url: null }])
    expect(publicPhotos([], [], signed)).toEqual([])
  })
})
