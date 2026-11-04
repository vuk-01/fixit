// Ticket #13: who may tap "Podržavam" on /p/[code] (FR-16).
import { describe, expect, it } from "vitest"

import { likeCountText } from "../constants"
import { likeState, likeStateAfterError } from "./like"

const base = {
  status: "sent" as const,
  role: null,
  isReporter: false,
  alreadyLiked: false,
}

describe("likeState", () => {
  it("lets a guest, an anonymous session and another citizen support an open report", () => {
    for (const status of [
      "routing",
      "sent",
      "acknowledged",
      "in_progress",
      "not_competent",
    ] as const) {
      expect(likeState({ ...base, status })).toBe("can_like")
      expect(likeState({ ...base, status, role: "citizen" })).toBe("can_like")
    }
  })

  it("shows 'Podržano' once this session has supported the report", () => {
    expect(likeState({ ...base, alreadyLiked: true })).toBe("liked")
    expect(likeState({ ...base, role: "citizen", alreadyLiked: true })).toBe(
      "liked"
    )
  })

  it("never offers the button on a closed report, even to someone who supported it", () => {
    expect(likeState({ ...base, status: "resolved" })).toBe("closed")
    expect(likeState({ ...base, status: "rejected", alreadyLiked: true })).toBe(
      "closed"
    )
  })

  it("refuses the reporter, officials and administrators", () => {
    expect(likeState({ ...base, role: "citizen", isReporter: true })).toBe(
      "own"
    )
    expect(likeState({ ...base, role: "official" })).toBe("staff")
    expect(likeState({ ...base, role: "admin" })).toBe("staff")
  })
})

describe("likeStateAfterError", () => {
  it("maps like_report refusals to a state and keeps other errors as messages", () => {
    expect(likeStateAfterError("own_report")).toBe("own")
    expect(likeStateAfterError("not_allowed")).toBe("staff")
    expect(likeStateAfterError("report_not_open")).toBe("closed")
    expect(likeStateAfterError("not_authenticated")).toBeNull()
  })
})

describe("likeCountText on the public page (FR-16 word forms)", () => {
  it("covers the acceptance examples", () => {
    expect(likeCountText(1)).toBe("1 podrška")
    expect([2, 3, 4].map(likeCountText)).toEqual([
      "2 podrške",
      "3 podrške",
      "4 podrške",
    ])
    expect([5, 9, 10].map(likeCountText)).toEqual([
      "5 podrški",
      "9 podrški",
      "10 podrški",
    ])
    expect(likeCountText(21)).toBe("21 podrška")
    expect([11, 12, 13, 14].map(likeCountText)).toEqual([
      "11 podrški",
      "12 podrški",
      "13 podrški",
      "14 podrški",
    ])
    expect([22, 41, 111, 112, 122].map(likeCountText)).toEqual([
      "22 podrške",
      "41 podrška",
      "111 podrški",
      "112 podrški",
      "122 podrške",
    ])
  })
})
