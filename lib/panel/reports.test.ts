// Ticket #14: opening a report in the panel. The recipient's official acknowledges a `sent`
// report on the first opening (FR-22); the admin and other institutions never do; an official
// does not get another institution's report even though RLS shows public reports to everyone.
import { beforeEach, describe, expect, it, vi } from "vitest"

const m = vi.hoisted(() => ({
  report: null as Record<string, unknown> | null,
  rpc: vi.fn(),
  tables: [] as string[],
  sign: vi.fn(),
}))

const ROWS: Record<string, unknown> = {
  institutions: [{ id: "inst-a", name: "Institucija A" }],
  report_photos: [{ id: "p1", storage_path: "a.jpg", position: 1, hidden_at: "2026-11-04T10:00:00Z", has_personal_data: true }],
  report_events: [],
}

// a query builder: filters return the builder; awaiting it or maybeSingle() gives the table's rows
function query(table: string) {
  m.tables.push(table)
  const result = () => {
    if (table === "reports") return { data: m.report, error: null }
    if (table === "report_details") return { data: { severity: "high", immediate_danger: true }, error: null }
    if (table === "letters") return { data: { subject: "S", body_text: "B", sent_at: "2026-11-04T10:00:00Z" }, error: null }
    return { data: ROWS[table] ?? [], error: null }
  }
  const builder: Record<string, unknown> = {}
  for (const name of ["select", "eq", "neq", "not", "order", "limit"]) builder[name] = () => builder
  builder.maybeSingle = async () => result()
  builder.then = (resolve: (v: unknown) => unknown) => resolve(result())
  return builder
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: query, rpc: m.rpc }),
}))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ storage: { from: () => ({ createSignedUrls: m.sign }) } }),
}))
vi.mock("@/lib/auth", () => ({ getAccount: async () => null }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

import { getPanelReport } from "./reports"

const ID = "22222222-2222-4222-8222-222222222222"
const OFFICIAL_A = { kind: "official" as const, institutionId: "inst-a" }
const OFFICIAL_B = { kind: "official" as const, institutionId: "inst-b" }
const ADMIN = { kind: "admin" as const }

function reportRow(status: string) {
  return {
    id: ID,
    code: "FX-2026-00042",
    status,
    category: "pothole",
    lat: 42.44,
    lng: 19.26,
    address: "Ulica 1, Podgorica",
    description: "Rupa.",
    institution_id: "inst-a",
    cc_institution_id: null,
    like_count: 3,
    submitted_at: "2026-11-01T10:00:00Z",
    closed_at: null,
    is_demo: false,
    is_hidden: false,
  }
}

beforeEach(() => {
  m.report = reportRow("sent")
  m.tables = []
  m.rpc.mockReset().mockResolvedValue({ data: "acknowledged", error: null })
  m.sign.mockReset().mockResolvedValue({ data: [{ path: "a.jpg", signedUrl: "https://signed/a" }], error: null })
})

describe("getPanelReport", () => {
  it("acknowledges a sent report when the recipient's official opens it", async () => {
    const report = await getPanelReport(ID, OFFICIAL_A)
    expect(m.rpc).toHaveBeenCalledWith("acknowledge_report", { p_report_id: ID })
    expect(report?.status).toBe("acknowledged")
  })

  it("does not call acknowledge_report when the admin opens a sent report", async () => {
    const report = await getPanelReport(ID, ADMIN)
    expect(m.rpc).not.toHaveBeenCalled()
    expect(report?.status).toBe("sent")
  })

  it("does not acknowledge a report that is no longer sent", async () => {
    for (const status of ["acknowledged", "in_progress", "resolved", "rejected"]) {
      m.report = reportRow(status)
      expect((await getPanelReport(ID, OFFICIAL_A))?.status).toBe(status)
    }
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it("gives another institution's official nothing, and acknowledges nothing", async () => {
    expect(await getPanelReport(ID, OFFICIAL_B)).toBeNull()
    expect(m.rpc).not.toHaveBeenCalled()
    expect(m.tables).toEqual(["reports"])
  })

  it("does not show drafts or reports in routing to an official", async () => {
    m.report = { ...reportRow("draft"), code: null, submitted_at: null }
    expect(await getPanelReport(ID, OFFICIAL_A)).toBeNull()
    m.report = { ...reportRow("routing"), institution_id: null }
    expect(await getPanelReport(ID, OFFICIAL_A)).toBeNull()
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it("returns null for a missing report or an id that is not a uuid", async () => {
    m.report = null
    expect(await getPanelReport(ID, OFFICIAL_A)).toBeNull()
    expect(await getPanelReport("FX-2026-00001", OFFICIAL_A)).toBeNull()
  })

  it("shows hidden photos, severity, the immediate danger and the letter", async () => {
    m.report = reportRow("in_progress")
    const report = await getPanelReport(ID, OFFICIAL_A)
    expect(m.sign).toHaveBeenCalledWith(["a.jpg"], 3600)
    expect(report?.photos).toEqual([{ id: "p1", position: 1, url: "https://signed/a", hidden: true, hasPersonalData: true }])
    expect(report?.severity).toBe("high")
    expect(report?.immediateDanger).toBe(true)
    expect(report?.letter).toEqual({ subject: "S", body: "B", sentAt: "2026-11-04T10:00:00Z" })
  })
})
