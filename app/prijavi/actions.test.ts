// Ticket #9: "Odustani" deletes the draft with the citizen's session and only the files that
// delete_draft returned, with the admin client. Ticket #10: "Podrži postojeću" the same way,
// with support_existing_report. Ticket #11: photos on the review and the sendReport stub.
import { beforeEach, describe, expect, it, vi } from "vitest"

const m = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
  rpc: vi.fn(),
  lookup: vi.fn(),
  report: vi.fn(),
  remove: vi.fn(),
}))

// a query builder: filters return the builder; report_photos → lookup, reports → report
function query(table: string) {
  const builder: Record<string, unknown> = {}
  for (const name of ["select", "in", "eq", "neq", "limit"]) builder[name] = () => builder
  builder.maybeSingle = () => (table === "reports" ? m.report() : m.lookup())
  return builder
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: m.claims ? { claims: m.claims } : null }) },
    rpc: m.rpc,
    from: query,
  }),
}))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ storage: { from: () => ({ remove: m.remove }) } }),
}))

import { addReportPhoto, cancelReport, removeReportPhoto, sendReport, supportExistingReport } from "./actions"

const REPORT = "22222222-2222-4222-8222-222222222222"
const A = "44444444-4444-4444-8444-444444444444.jpg"
const B = "55555555-5555-4555-8555-555555555555.jpg"

beforeEach(() => {
  m.claims = { sub: "u", is_anonymous: false }
  m.rpc.mockReset().mockResolvedValue({ data: [A], error: null })
  m.lookup.mockReset().mockResolvedValue({ data: { report_id: REPORT } })
  m.report.mockReset().mockResolvedValue({ data: { code: "FX-2026-00007" } })
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

describe("supportExistingReport (FR-9)", () => {
  const EXISTING = "66666666-6666-4666-8666-666666666666"

  beforeEach(() => {
    m.rpc.mockResolvedValue({ data: [{ like_count: 4, removed_paths: [A, B] }], error: null })
  })

  it("supports the report and deletes the draft in one call, then only the returned files", async () => {
    expect(await supportExistingReport({ draftId: REPORT, reportId: EXISTING })).toEqual({ ok: true, code: "FX-2026-00007" })
    expect(m.rpc).toHaveBeenCalledWith("support_existing_report", { p_draft_id: REPORT, p_report_id: EXISTING })
    expect(m.remove).toHaveBeenCalledWith([A, B])
  })

  it("keeps everything when the database refuses (own report, closed report)", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "own_report" } })
    expect(await supportExistingReport({ draftId: REPORT, reportId: EXISTING })).toEqual({
      ok: false,
      error: "Ne možete podržati svoju prijavu.",
    })
    expect(m.remove).not.toHaveBeenCalled()
  })

  it("does not call the function for a report that is not public", async () => {
    m.report.mockResolvedValue({ data: null })
    expect((await supportExistingReport({ draftId: REPORT, reportId: EXISTING })).ok).toBe(false)
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it("rejects a guest, an anonymous session and ids that are not uuids", async () => {
    m.claims = null
    expect((await supportExistingReport({ draftId: REPORT, reportId: EXISTING })).ok).toBe(false)
    m.claims = { sub: "u", is_anonymous: true }
    expect((await supportExistingReport({ draftId: REPORT, reportId: EXISTING })).ok).toBe(false)
    m.claims = { sub: "u", is_anonymous: false }
    expect((await supportExistingReport({ draftId: "x", reportId: EXISTING })).ok).toBe(false)
    expect(m.rpc).not.toHaveBeenCalled()
  })
})

describe("addReportPhoto (FR-2, review)", () => {
  it("saves the uploaded path to the draft with the citizen's session", async () => {
    m.rpc.mockResolvedValue({ data: "photo-id", error: null })
    expect(await addReportPhoto({ reportId: REPORT, path: B })).toEqual({ ok: true })
    expect(m.rpc).toHaveBeenCalledWith("add_report_photo", { p_report_id: REPORT, p_storage_path: B })
  })

  it("passes the fourth photo's photo_limit on as a message", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "photo_limit" } })
    expect(await addReportPhoto({ reportId: REPORT, path: B })).toEqual({
      ok: false,
      error: "Prijava može imati najviše 3 fotografije.",
    })
  })

  it("rejects a bad path, a guest and an anonymous session", async () => {
    expect((await addReportPhoto({ reportId: REPORT, path: "../x.jpg" })).ok).toBe(false)
    m.claims = { sub: "u", is_anonymous: true }
    expect((await addReportPhoto({ reportId: REPORT, path: B })).ok).toBe(false)
    expect(m.rpc).not.toHaveBeenCalled()
  })
})

describe("removeReportPhoto (FR-2, review)", () => {
  beforeEach(() => {
    m.lookup.mockResolvedValue({ data: { id: "photo-id" } })
    m.rpc.mockResolvedValue({ data: B, error: null })
  })

  it("finds the photo by its path, removes the row, then only the returned file", async () => {
    expect(await removeReportPhoto({ reportId: REPORT, path: B })).toEqual({ ok: true })
    expect(m.rpc).toHaveBeenCalledWith("remove_report_photo", { p_photo_id: "photo-id" })
    expect(m.remove).toHaveBeenCalledWith([B])
  })

  it("keeps the last photo (photos_required) and its file", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "photos_required" } })
    expect(await removeReportPhoto({ reportId: REPORT, path: B })).toEqual({
      ok: false,
      error: "Prijava mora imati bar jednu fotografiju.",
    })
    expect(m.remove).not.toHaveBeenCalled()
  })

  it("does nothing for a photo the citizen cannot see", async () => {
    m.lookup.mockResolvedValue({ data: null })
    expect((await removeReportPhoto({ reportId: REPORT, path: B })).ok).toBe(false)
    expect(m.rpc).not.toHaveBeenCalled()
    expect(m.remove).not.toHaveBeenCalled()
  })
})

describe("sendReport (stub until #12)", () => {
  const input = { reportId: REPORT, category: "pothole" as const, description: "Rupa.", shareContact: false }

  it("answers that sending is not available yet, without writing anything", async () => {
    expect(await sendReport(input)).toEqual({
      ok: false,
      error: "Slanje prijave još nije dostupno. Pokušajte ponovo kasnije.",
      code: null,
    })
    expect(m.rpc).not.toHaveBeenCalled()
    expect(m.remove).not.toHaveBeenCalled()
  })

  it("checks the input and the session first", async () => {
    expect((await sendReport({ ...input, category: "parking" as never })).ok).toBe(false)
    expect((await sendReport({ ...input, description: "x".repeat(1001) })).ok).toBe(false)
    m.claims = null
    expect(await sendReport(input)).toEqual({ ok: false, error: "Prijavite se da biste nastavili.", code: null })
  })
})
