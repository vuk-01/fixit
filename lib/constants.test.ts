import { describe, expect, it } from "vitest"

import {
  dayCounterText,
  dayWord,
  errorMessage,
  ERROR_MESSAGES,
  formatDay,
  likeCountText,
  REVIEW_TEXT,
  sourceTypeText,
} from "./constants"

// 6. 11. 2026, 10:00 in Podgorica (CET, UTC+1)
const now = new Date("2026-11-06T09:00:00Z")

describe("dayCounterText (FR-15)", () => {
  it("counts calendar days in Podgorica for open reports", () => {
    expect(dayCounterText({ status: "sent", submitted_at: "2026-11-06T07:00:00Z", closed_at: null }, now)).toBe(
      "Prijavljeno danas",
    )
    expect(dayCounterText({ status: "sent", submitted_at: "2026-11-05T09:00:00Z", closed_at: null }, now)).toBe(
      "1 dan bez rješenja",
    )
    expect(dayCounterText({ status: "routing", submitted_at: "2026-10-26T09:00:00Z", closed_at: null }, now)).toBe(
      "11 dana bez rješenja",
    )
    expect(dayCounterText({ status: "in_progress", submitted_at: "2026-10-16T09:00:00Z", closed_at: null }, now)).toBe(
      "21 dan bez rješenja",
    )
  })

  it("uses the Podgorica calendar, not UTC", () => {
    // 5. 11. 23:30 UTC is already 6. 11. 00:30 in Podgorica
    expect(dayCounterText({ status: "sent", submitted_at: "2026-11-05T23:30:00Z", closed_at: null }, now)).toBe(
      "Prijavljeno danas",
    )
    // 5. 11. 22:30 UTC is still 5. 11. 23:30 in Podgorica
    expect(dayCounterText({ status: "sent", submitted_at: "2026-11-05T22:30:00Z", closed_at: null }, now)).toBe(
      "1 dan bez rješenja",
    )
  })

  it("stops at closed_at for closed reports", () => {
    expect(
      dayCounterText({ status: "resolved", submitted_at: "2026-11-06T06:00:00Z", closed_at: "2026-11-06T08:00:00Z" }, now),
    ).toBe("Riješeno istog dana")
    expect(
      dayCounterText({ status: "resolved", submitted_at: "2026-10-29T09:00:00Z", closed_at: "2026-11-04T09:00:00Z" }, now),
    ).toBe("Riješeno za 6 dana")
    expect(
      dayCounterText({ status: "rejected", submitted_at: "2026-11-02T09:00:00Z", closed_at: "2026-11-03T09:00:00Z" }, now),
    ).toBe("Odbijeno nakon 1 dan")
    expect(
      dayCounterText({ status: "rejected", submitted_at: "2026-11-03T09:00:00Z", closed_at: "2026-11-03T10:00:00Z" }, now),
    ).toBe("Odbijeno istog dana")
  })

  it("has no counter for a draft", () => {
    expect(dayCounterText({ status: "draft", submitted_at: null, closed_at: null }, now)).toBeNull()
  })

  it("picks dan/dana by the last digit", () => {
    expect([1, 2, 5, 11, 14, 21, 22, 101, 111].map(dayWord)).toEqual([
      "dan", "dana", "dana", "dana", "dana", "dan", "dana", "dan", "dana",
    ])
  })
})

describe("likeCountText (FR-16)", () => {
  it("follows Montenegrin grammar", () => {
    expect([0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 112].map(likeCountText)).toEqual([
      "0 podrški",
      "1 podrška",
      "2 podrške",
      "4 podrške",
      "5 podrški",
      "11 podrški",
      "12 podrški",
      "14 podrški",
      "21 podrška",
      "22 podrške",
      "25 podrški",
      "101 podrška",
      "112 podrški",
    ])
  })
})

describe("errorMessage", () => {
  it("maps database error codes to text", () => {
    expect(errorMessage({ message: "daily_limit_reached" })).toBe(ERROR_MESSAGES.daily_limit_reached)
    expect(errorMessage({ message: "outside_area" })).toContain("Glavnog grada Podgorice")
  })

  it("falls back for anything else", () => {
    expect(errorMessage(new Error("connection reset"))).toBe("Nešto nije u redu. Pokušajte ponovo.")
    expect(errorMessage(null)).toBe("Nešto nije u redu. Pokušajte ponovo.")
  })
})

describe("Zašto ova institucija? (ticket #11)", () => {
  it("shows a phone confirmation as the weaker source (GLOSSARY)", () => {
    expect(sourceTypeText("phone_confirmation")).toBe("slabiji izvor (potvrda telefonom)")
    expect(sourceTypeText("official_page")).toBe("Zvanična stranica institucije")
    expect(sourceTypeText("written_confirmation")).toBe("Pisana potvrda institucije")
  })

  it("writes the check date the Montenegrin way", () => {
    expect(formatDay("2026-11-02")).toBe("2. 11. 2026.")
  })
})

describe("review notes are verbatim from the PRD (ticket #11)", () => {
  it("has the FR-6, §6 and FR-11 texts", () => {
    expect(REVIEW_TEXT.danger).toBe("Ako je neko u opasnosti, pozovite 112.")
    expect(REVIEW_TEXT.flaggedPhoto).toBe("Na fotografiji su možda vidljiva lica ili tablice. Fotografija će biti javna.")
    expect(REVIEW_TEXT.descriptionPublic).toBe(
      "Opis je javan i vidi se uz fotografiju. Ne upisujte ime, broj telefona, mejl ni druge lične podatke.",
    )
    expect(REVIEW_TEXT.shareContact).toBe("Dostavi moje ime i mejl instituciji")
  })
})
