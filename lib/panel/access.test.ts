// Ticket #14: the panel is for officials; the admin may open a report read-only.
import { describe, expect, it } from "vitest"

import { panelAccess } from "./access"

const INSTITUTION = "11111111-1111-4111-8111-111111111111"

describe("panelAccess", () => {
  it("sends guests and anonymous sessions (no account) to sign in", () => {
    expect(panelAccess(null, "list")).toEqual({ kind: "login" })
    expect(panelAccess(null, "detail")).toEqual({ kind: "login" })
  })

  it("lets an official with an institution in", () => {
    const official = { role: "official" as const, institutionId: INSTITUTION }
    expect(panelAccess(official, "list")).toEqual({ kind: "official", institutionId: INSTITUTION })
    expect(panelAccess(official, "detail")).toEqual({ kind: "official", institutionId: INSTITUTION })
  })

  it("turns away citizens", () => {
    const citizen = { role: "citizen" as const, institutionId: null }
    expect(panelAccess(citizen, "list")).toEqual({ kind: "forbidden" })
    expect(panelAccess(citizen, "detail")).toEqual({ kind: "forbidden" })
  })

  it("lets the admin open a report but not the list", () => {
    const admin = { role: "admin" as const, institutionId: null }
    expect(panelAccess(admin, "list")).toEqual({ kind: "forbidden" })
    expect(panelAccess(admin, "detail")).toEqual({ kind: "admin" })
  })

  it("turns away an official without an institution (the profile CHECK forbids it)", () => {
    expect(panelAccess({ role: "official", institutionId: null }, "list")).toEqual({ kind: "forbidden" })
  })
})
