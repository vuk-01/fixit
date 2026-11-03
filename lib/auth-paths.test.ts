import { describe, expect, it } from "vitest"

import { loginHref, safeNextPath } from "./auth-paths"

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/prijavi")).toBe("/prijavi")
    expect(safeNextPath("/p/FX-2026-00001?x=1")).toBe("/p/FX-2026-00001?x=1")
  })

  it("refuses anything that could leave the site", () => {
    for (const value of ["//evil.example", "/\\evil.example", "https://evil.example", "prijavi", "", null, undefined, ["/prijavi"]]) {
      expect(safeNextPath(value)).toBe("/")
    }
  })
})

describe("loginHref", () => {
  it("carries next only when it is not the home page", () => {
    expect(loginHref("/prijavi")).toBe("/uloguj-se?next=%2Fprijavi")
    expect(loginHref("/")).toBe("/uloguj-se")
    expect(loginHref("//evil.example")).toBe("/uloguj-se")
  })
})
