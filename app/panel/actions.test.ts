// Ticket #14: status change from the panel goes through set_report_status with the official's
// session; a rejection without a message gets the message_required text (FR-18 transition 10).
import { beforeEach, describe, expect, it, vi } from "vitest"

const m = vi.hoisted(() => ({
  account: null as Record<string, unknown> | null,
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ getAccount: async () => m.account }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: m.rpc }) }))
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }))

import { ERROR_MESSAGES, PANEL_TEXT, UNKNOWN_ERROR_MESSAGE } from "@/lib/constants"

import { changeReportStatus } from "./actions"

const REPORT = "22222222-2222-4222-8222-222222222222"
const OFFICIAL = { id: "u", firstName: "A", lastName: "B", role: "official", institutionId: "i" }

beforeEach(() => {
  m.account = { ...OFFICIAL }
  m.rpc.mockReset().mockImplementation(async (_fn: string, args: { p_to: string }) => ({ data: args.p_to, error: null }))
  m.revalidatePath.mockReset()
})

describe("changeReportStatus", () => {
  it("rejects a rejection without a message with the message_required text, without calling the database", async () => {
    expect(await changeReportStatus({ reportId: REPORT, to: "rejected", message: "" })).toEqual({
      ok: false,
      error: ERROR_MESSAGES.message_required,
    })
    expect(await changeReportStatus({ reportId: REPORT, to: "rejected", message: "   " })).toEqual({
      ok: false,
      error: ERROR_MESSAGES.message_required,
    })
    expect(await changeReportStatus({ reportId: REPORT, to: "rejected" })).toEqual({
      ok: false,
      error: ERROR_MESSAGES.message_required,
    })
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it("shows the message_required text when the database raises it", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "message_required" } })
    expect(await changeReportStatus({ reportId: REPORT, to: "rejected", message: "Duplikat." })).toEqual({
      ok: false,
      error: ERROR_MESSAGES.message_required,
    })
  })

  it("rejects with a trimmed message", async () => {
    const result = await changeReportStatus({ reportId: REPORT, to: "rejected", message: "  Duplikat prijave FX-2026-00003. " })
    expect(result).toEqual({ ok: true, status: "rejected" })
    expect(m.rpc).toHaveBeenCalledWith("set_report_status", {
      p_report_id: REPORT,
      p_to: "rejected",
      p_message: "Duplikat prijave FX-2026-00003.",
    })
  })

  it("sets U radu without a message (the message is optional)", async () => {
    expect(await changeReportStatus({ reportId: REPORT, to: "in_progress", message: " " })).toEqual({
      ok: true,
      status: "in_progress",
    })
    expect(m.rpc).toHaveBeenCalledWith("set_report_status", { p_report_id: REPORT, p_to: "in_progress" })
  })

  it("passes the public message for U radu and refreshes the panel and the public pages", async () => {
    await changeReportStatus({ reportId: REPORT, to: "in_progress", message: "Ekipa je na terenu." })
    expect(m.rpc).toHaveBeenCalledWith("set_report_status", {
      p_report_id: REPORT,
      p_to: "in_progress",
      p_message: "Ekipa je na terenu.",
    })
    expect(m.revalidatePath).toHaveBeenCalledWith(`/panel/prijave/${REPORT}`)
    expect(m.revalidatePath).toHaveBeenCalledWith("/p/[code]", "page")
  })

  it("maps a refused transition to its text", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "transition_not_allowed" } })
    expect(await changeReportStatus({ reportId: REPORT, to: "in_progress" })).toEqual({
      ok: false,
      error: ERROR_MESSAGES.transition_not_allowed,
    })
    expect(m.revalidatePath).not.toHaveBeenCalled()
  })

  it("maps another institution's report (not_allowed) to its text", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "not_allowed" } })
    expect(await changeReportStatus({ reportId: REPORT, to: "resolved" })).toEqual({
      ok: false,
      error: ERROR_MESSAGES.not_allowed,
    })
  })

  it("does not accept statuses the panel never offers (acknowledged, not_competent, sent, reopening)", async () => {
    for (const to of ["acknowledged", "not_competent", "sent", "routing", "draft"]) {
      expect(await changeReportStatus({ reportId: REPORT, to, message: "x" })).toEqual({
        ok: false,
        error: UNKNOWN_ERROR_MESSAGE,
      })
    }
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it("does not accept an invalid report id", async () => {
    expect((await changeReportStatus({ reportId: "FX-2026-00001", to: "resolved" })).ok).toBe(false)
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it("refuses guests, anonymous sessions, citizens and the admin", async () => {
    m.account = null
    expect(await changeReportStatus({ reportId: REPORT, to: "resolved" })).toEqual({
      ok: false,
      error: ERROR_MESSAGES.not_authenticated,
    })
    for (const role of ["citizen", "admin"]) {
      m.account = { ...OFFICIAL, role, institutionId: null }
      expect(await changeReportStatus({ reportId: REPORT, to: "resolved" })).toEqual({
        ok: false,
        error: ERROR_MESSAGES.not_allowed,
      })
    }
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it("refuses a message over 1000 characters", async () => {
    expect(await changeReportStatus({ reportId: REPORT, to: "resolved", message: "a".repeat(1001) })).toEqual({
      ok: false,
      error: PANEL_TEXT.messageTooLong,
    })
    expect(m.rpc).not.toHaveBeenCalled()
  })
})
