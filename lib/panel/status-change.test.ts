// Ticket #14: the panel offers only transitions 8–10 from the current status (FR-18).
import { describe, expect, it } from "vitest"

import { messageRequired, normalizeMessage, officialTargets } from "./status-change"

describe("officialTargets", () => {
  it("offers U radu, Riješena and Odbijena for sent and acknowledged reports", () => {
    expect(officialTargets("sent")).toEqual(["in_progress", "resolved", "rejected"])
    expect(officialTargets("acknowledged")).toEqual(["in_progress", "resolved", "rejected"])
  })

  it("offers only Riješena and Odbijena for a report in progress", () => {
    expect(officialTargets("in_progress")).toEqual(["resolved", "rejected"])
  })

  it("offers nothing for closed, not-competent, routing and draft reports", () => {
    for (const status of ["resolved", "rejected", "not_competent", "routing", "draft"] as const) {
      expect(officialTargets(status)).toEqual([])
    }
  })

  it("never offers going back to sent or acknowledged", () => {
    for (const status of ["sent", "acknowledged", "in_progress"] as const) {
      expect(officialTargets(status)).not.toContain("sent")
      expect(officialTargets(status)).not.toContain("acknowledged")
    }
  })
})

describe("messageRequired", () => {
  it("requires a message only for a rejection", () => {
    expect(messageRequired("rejected")).toBe(true)
    expect(messageRequired("in_progress")).toBe(false)
    expect(messageRequired("resolved")).toBe(false)
  })
})

describe("normalizeMessage", () => {
  it("trims and treats an empty message as none", () => {
    expect(normalizeMessage("  Ekipa je na terenu. ")).toBe("Ekipa je na terenu.")
    expect(normalizeMessage("   ")).toBeNull()
    expect(normalizeMessage(null)).toBeNull()
    expect(normalizeMessage(undefined)).toBeNull()
  })
})
