import { describe, expect, it } from "vitest"

import { SERVER_MODULE_MARKER } from "@/test/fixtures/server-module"

describe("server-only mock", () => {
  it("allows importing a module that starts with import 'server-only'", () => {
    expect(SERVER_MODULE_MARKER).toBe("server-module")
  })
})
