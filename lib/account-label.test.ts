import { describe, expect, it } from "vitest"

import { accountTitle, initialsOf, type AccountLabelInput } from "./account-label"

const base: AccountLabelInput = {
  role: "citizen",
  firstName: "Dev",
  lastName: "Jedan",
  email: "dev-1@fixit.test",
  institutionName: null,
}

describe("accountTitle", () => {
  it("shows an official as their institution, with the role badge", () => {
    expect(
      accountTitle({ ...base, role: "official", firstName: "Službenik", lastName: "ViK", institutionName: "Vodovod" })
    ).toEqual({ title: "Vodovod", showRole: true })
  })

  it("falls back to the person for an official without an institution", () => {
    expect(accountTitle({ ...base, role: "official", institutionName: "  " }).title).toBe("Dev Jedan")
  })

  it("shows an administrator as „Administrator” without a second badge", () => {
    expect(accountTitle({ ...base, role: "admin", institutionName: "X" })).toEqual({
      title: "Administrator",
      showRole: false,
    })
  })

  it("shows a citizen by name, never by institution", () => {
    expect(accountTitle({ ...base, institutionName: "X" })).toEqual({ title: "Dev Jedan", showRole: true })
  })

  it("shows a citizen without a name by mail", () => {
    expect(accountTitle({ ...base, firstName: " ", lastName: "" }).title).toBe("dev-1@fixit.test")
  })
})

describe("initialsOf", () => {
  it.each([
    ["Dev Jedan", "DJ"],
    ["Vodovod i kanalizacija", "VK"],
    ["Saobraćaj", "S"],
    ["Administrator", "A"],
    ["„Čistoća“ d.o.o. Podgorica", "ČP"],
    ["dev-1@fixit.test", "D"],
    ["ana.marić@example.test", "AM"],
    ["", ""],
  ])("%s → %s", (title, expected) => {
    expect(initialsOf(title)).toBe(expected)
  })
})
