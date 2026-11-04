// Ticket #9: POST /api/agent/classify with mocked Supabase clients and a mocked Anthropic SDK.
import { beforeEach, describe, expect, it, vi } from "vitest"

const m = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
  env: { ANTHROPIC_API_KEY: undefined as string | undefined, ANTHROPIC_MODEL: "claude-haiku-5-5" },
  rpc: vi.fn(),
  update: vi.fn(),
  parse: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: async () => ({ data: m.claims ? { claims: m.claims } : null }) } }),
}))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: m.rpc,
    from: () => ({ update: (v: unknown) => ({ eq: (...a: unknown[]) => m.update(v, ...a) }) }),
  }),
}))
vi.mock("@/lib/env", () => ({ getServerEnv: () => m.env }))
vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@anthropic-ai/sdk")>()
  class FakeAnthropic {
    messages = { parse: m.parse }
  }
  return { ...actual, default: FakeAnthropic }
})

import { POST } from "./route"

const USER = "11111111-1111-4111-8111-111111111111"
const REPORT = "22222222-2222-4222-8222-222222222222"
const RUN = "33333333-3333-4333-8333-333333333333"
const PATH = "44444444-4444-4444-8444-444444444444.jpg"
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70])

function request(files: Blob[] = [new Blob([JPEG], { type: "image/jpeg" })], paths: string[] = [PATH]) {
  const form = new FormData()
  files.forEach((f, i) => form.append("images", f, `${i + 1}.jpg`))
  paths.forEach((p) => form.append("photo_paths", p))
  return new Request("http://localhost/api/agent/classify", { method: "POST", body: form })
}

function rpcOk() {
  m.rpc.mockImplementation(async (name: string) =>
    name === "create_draft" ? { data: [{ report_id: REPORT, agent_run_id: RUN }], error: null } : { data: null, error: null },
  )
}

beforeEach(() => {
  m.claims = { sub: USER, is_anonymous: false }
  m.env.ANTHROPIC_API_KEY = undefined
  m.rpc.mockReset()
  m.update.mockReset().mockResolvedValue({ error: null })
  m.parse.mockReset()
  rpcOk()
})

describe("POST /api/agent/classify", () => {
  it("rejects a guest", async () => {
    m.claims = null
    const res = await POST(request())
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "not_authenticated" })
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it("rejects an anonymous session", async () => {
    m.claims = { sub: USER, is_anonymous: true }
    const res = await POST(request())
    expect(res.status).toBe(401)
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it.each([
    ["no photo", [], []],
    ["four photos", Array(4).fill(new Blob([JPEG], { type: "image/jpeg" })), [PATH, PATH, PATH, PATH]],
    ["a PNG", [new Blob([JPEG], { type: "image/png" })], [PATH]],
    ["not a JPEG inside", [new Blob(["hello"], { type: "image/jpeg" })], [PATH]],
    ["a path with a user id", [new Blob([JPEG], { type: "image/jpeg" })], [`${USER}/${PATH}`]],
    ["more than 1 MB", [new Blob([JPEG, new Uint8Array(1_000_001)], { type: "image/jpeg" })], [PATH]],
  ])("rejects invalid input: %s", async (_label, files, paths) => {
    const res = await POST(request(files as Blob[], paths as string[]))
    expect(res.status).toBe(400)
    expect(m.rpc).not.toHaveBeenCalled()
  })

  it("answers with the daily limit message code on the 11th attempt", async () => {
    m.rpc.mockResolvedValue({ data: null, error: { message: "daily_limit_reached", code: "P0001" } })
    const res = await POST(request())
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: "daily_limit_reached" })
    expect(m.parse).not.toHaveBeenCalled()
  })

  it("makes the draft for the signed-in citizen only, from getClaims", async () => {
    await POST(request())
    expect(m.rpc).toHaveBeenCalledWith("create_draft", { p_user_id: USER, p_photo_paths: [PATH] })
  })

  it("returns fallback without ANTHROPIC_API_KEY and records it", async () => {
    const res = await POST(request())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ reportId: REPORT, fallback: true, reason: "no_api_key" })
    expect(m.parse).not.toHaveBeenCalled()
    expect(m.rpc).toHaveBeenCalledWith(
      "record_classification",
      expect.objectContaining({
        p_report_id: REPORT,
        p_agent_run_id: RUN,
        p_analysis_status: "failed",
        p_result: {},
        p_usage: expect.objectContaining({ outcome: "fallback", error_code: "no_api_key", model: "claude-haiku-5-5" }),
      }),
    )
  })

  it("records a model timeout as timed_out", async () => {
    const { APIConnectionTimeoutError } = await import("@anthropic-ai/sdk")
    m.env.ANTHROPIC_API_KEY = "test-key"
    m.parse.mockRejectedValue(new APIConnectionTimeoutError())
    const res = await POST(request())
    expect(await res.json()).toEqual({ reportId: REPORT, fallback: true, reason: "timeout" })
    expect(m.rpc).toHaveBeenCalledWith(
      "record_classification",
      expect.objectContaining({ p_analysis_status: "timed_out" }),
    )
  })

  it("returns the result and records it; agent_runs gets no image, name or email", async () => {
    m.env.ANTHROPIC_API_KEY = "test-key"
    const output = {
      is_municipal_problem: true,
      category: "manhole",
      confidence: 0.9,
      title: "Otvoren šaht",
      description: "Na trotoaru je otvoren šaht bez poklopca. Javite se na 067 123 456.",
      severity: "high",
      immediate_danger: true,
      personal_data_photos: [1],
      image_contains_instructions: false,
    }
    m.parse.mockImplementation(async (params: { output_config: { format: { parse: (s: string) => unknown } } }) => ({
      stop_reason: "end_turn",
      usage: { input_tokens: 900, output_tokens: 120 },
      content: [],
      parsed_output: params.output_config.format.parse(JSON.stringify(output)),
    }))

    const res = await POST(request())
    const body = await res.json()
    expect(body).toEqual({
      reportId: REPORT,
      result: {
        is_municipal_problem: true,
        category: "manhole",
        confidence: 0.9,
        description: "Na trotoaru je otvoren šaht bez poklopca. Javite se na.",
        immediate_danger: true,
        personal_data_photos: [1],
      },
    })

    const record = m.rpc.mock.calls.find(([name]) => name === "record_classification")![1]
    expect(record.p_analysis_status).toBe("done")
    expect(record.p_result.description).not.toContain("067")
    const usage = JSON.stringify(record.p_usage)
    expect(usage).not.toMatch(/\/9j|base64|@/)
    expect(record.p_usage).toMatchObject({ outcome: "ok", input_tokens: 900, output_tokens: 120 })
    expect(m.update).toHaveBeenCalledWith({ meta: { language_review: [], removed_contact_data: 1 } }, "id", RUN)
  })
})
