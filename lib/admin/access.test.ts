// Ticket #15: /admin is for the admin role only.
import { describe, expect, it } from "vitest"

import { adminAccess } from "./access"

describe("adminAccess", () => {
  it("sends guests and anonymous sessions (no account) to sign in", () => {
    expect(adminAccess(null)).toEqual({ kind: "login" })
  })

  it("lets the admin in", () => {
    expect(adminAccess({ id: "a", role: "admin" })).toEqual({ kind: "admin", userId: "a" })
  })

  it("turns away citizens and officials", () => {
    expect(adminAccess({ id: "c", role: "citizen" })).toEqual({ kind: "forbidden" })
    expect(adminAccess({ id: "o", role: "official" })).toEqual({ kind: "forbidden" })
  })
})
