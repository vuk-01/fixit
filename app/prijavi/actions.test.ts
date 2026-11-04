// Ticket #9: "Odustani" deletes the draft with the citizen's session and only the files that
// delete_draft returned, with the admin client.
import { beforeEach, describe, expect, it, vi } from "vitest"

const m = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
  rpc: vi.fn(),
  lookup: vi.fn(),
  remove: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: m.claims ? { claims: m.claims } : null }) },
    rpc: m.rpc,
    from: () => ({ select: () => ({ in: () => ({ limit: () => ({ maybeSingle: m.lookup }) }) }) }),
  }),
}))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ storage: { from: () => ({ remove: m.remove }) } }),
}))

import { cancelReport } from "./actions"

const REPORT = "22222222-2222-4222-8222-222222222222"
const A = "44444444-4444-4444-8444-444444444444.jpg"
const B = "55555555-5555-4555-8555-555555555555.jpg"

beforeEach(() => {
  m.claims = { sub: "u", is_anonymous: false }
  m.rpc.mockReset().mockResolvedValue({ data: [A], error: null })
  m.lookup.mockReset().mockResolvedValue({ data: { report_id: REPORT } })
  m.remove.mockReset().mockResolvedValue({ error: null })
})

describe("cancelReport", () => {
  it("deletes the draft, then only the paths delete_draft returned", async () => {
    expect(await cancelReport({ reportId: REPORT, photoPaths: [A, B] })).toEqual({ ok: true })
    expect(m.rpc).toHaveBeenCalledWith("delete_draft", { p_report_id: REPORT })
    expect(m.remove).toHaveBeenCalledWith([A])
  })

  it("finds the draft by its photo paths when the client has no id", async () => {
    await cancelReport({ reportId: null, photoPaths: [A] })
    expect(m.lookup).toHaveBeenCalled()
    expect(m.rpc).toHaveBeenCalledWith("delete_draft", { p_report_id: REPORT })
  })

  it("does nothing when no draft was made", async () => {
    m.lookup.mockResolvedValue({ data: null })
    expect(await cancelReport({ reportId: null, photoPaths: [A] })).toEqual({ ok: true })
    expect(m.rpc).not.toHaveBeenCalled()
    expect(m.remove).not.toHaveBeenCalled()
  })

  it("rejects a guest and an anonymous session", async () => {
    m.claims = null
    expect((await cancelReport({ reportId: REPORT, photoPaths: [] })).ok).toBe(false)
    m.claims = { sub: "u", is_anonymous: true }
    expect((await cancelReport({ reportId: REPORT, photoPaths: [] })).ok).toBe(false)
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it("does not remove files when delete_draft refuses (not the reporter)", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "not_allowed" } })
    expect(await cancelReport({ reportId: REPORT, photoPaths: [A] })).toEqual({
      ok: false,
      error: "Nemate dozvolu za ovu radnju.",
    })
    expect(m.remove).not.toHaveBeenCalled()
  })

  it("rejects paths that are not <uuid>.jpg", async () => {
    expect((await cancelReport({ reportId: REPORT, photoPaths: ["../x.jpg"] })).ok).toBe(false)
    expect(m.rpc).not.toHaveBeenCalled()
  })
})
