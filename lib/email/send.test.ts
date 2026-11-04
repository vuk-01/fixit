// Mandatory test 1 (AGENTS.md): in EMAIL_MODE=test, and for every value except exactly `live`,
// both the recipient and the cc go to TEST_INBOX; without TEST_INBOX nothing is sent. Resend is
// always mocked (Tech.md §12): no test ever reaches the network.
import { beforeEach, describe, expect, it, vi } from "vitest"

const m = vi.hoisted(() => ({
  send: vi.fn(),
  constructed: vi.fn(),
  env: {} as Record<string, string | undefined>,
}))

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: m.send }
    constructor(key: string) {
      m.constructed(key)
    }
  },
}))
vi.mock("@/lib/env", () => ({ getServerEnv: () => m.env }))

import { completeDispatchArgs, emailModeOf, sendLetter, type SendLetterInput } from "./send"

const TEST_INBOX = "inbox@fixit.test"
const INSTITUTION = "sekretarijat@institucija.test"
const CC = "putevi@institucija.test"
const DISPATCH = "77777777-7777-4777-8777-777777777777"

const input = (over: Partial<SendLetterInput> = {}): SendLetterInput => ({
  dispatchId: DISPATCH,
  to: INSTITUTION,
  cc: CC,
  subject: "Prijava komunalnog problema br. FX-2026-00142 – Oštećen kolovoz / rupa na putu, Njegoševa 5",
  text: "Poštovani,\n\n…",
  attachments: [
    { filename: "FX-2026-00142-1.jpg", content: Buffer.from([0xff, 0xd8, 1]) },
    { filename: "FX-2026-00142-2.jpg", content: Buffer.from([0xff, 0xd8, 2]) },
  ],
  ...over,
})

beforeEach(() => {
  m.send.mockReset().mockResolvedValue({ data: { id: "re_123" }, error: null, headers: null })
  m.constructed.mockReset()
  m.env = {
    RESEND_API_KEY: "re_test_key",
    EMAIL_MODE: "test",
    TEST_INBOX,
    EMAIL_FROM: "Fixit <onboarding@resend.dev>",
    EMAIL_REPLY_TO: "tim@fixit.test",
  }
})

// every value that is not exactly "live" is test mode (FR-12)
const NOT_LIVE: (string | undefined)[] = ["test", "", "LIVE", "Live", " live", "live ", "production", "true", undefined]

describe("sendLetter guard (FR-12)", () => {
  it.each(NOT_LIVE)("EMAIL_MODE=%j sends both to and cc to TEST_INBOX only", async (mode) => {
    m.env.EMAIL_MODE = mode
    const result = await sendLetter(input())

    expect(m.send).toHaveBeenCalledTimes(1)
    const [payload] = m.send.mock.calls[0]
    expect(payload.to).toEqual([TEST_INBOX])
    expect(payload.cc).toEqual([TEST_INBOX])
    expect(JSON.stringify(payload)).not.toContain(INSTITUTION)
    expect(JSON.stringify(payload)).not.toContain(CC)
    expect(result).toEqual({
      succeeded: true,
      emailMode: "test",
      deliveredTo: [TEST_INBOX],
      providerMessageId: "re_123",
      errorCode: null,
    })
  })

  it("without a cc sends no cc, still only to TEST_INBOX", async () => {
    await sendLetter(input({ cc: null }))
    const [payload] = m.send.mock.calls[0]
    expect(payload.to).toEqual([TEST_INBOX])
    expect(payload).not.toHaveProperty("cc")
  })

  it.each(NOT_LIVE)("EMAIL_MODE=%j without TEST_INBOX sends nothing", async (mode) => {
    m.env.EMAIL_MODE = mode
    m.env.TEST_INBOX = undefined
    const result = await sendLetter(input())

    expect(m.send).not.toHaveBeenCalled()
    expect(m.constructed).not.toHaveBeenCalled()
    expect(result).toEqual({
      succeeded: false,
      emailMode: "test",
      deliveredTo: null,
      providerMessageId: null,
      errorCode: "no_test_inbox",
    })
  })

  it("a blank TEST_INBOX counts as missing", async () => {
    m.env.TEST_INBOX = "   "
    expect((await sendLetter(input())).errorCode).toBe("no_test_inbox")
    expect(m.send).not.toHaveBeenCalled()
  })

  it("only exactly `live` uses the institution's addresses", async () => {
    m.env.EMAIL_MODE = "live"
    const result = await sendLetter(input())
    const [payload] = m.send.mock.calls[0]
    expect(payload.to).toEqual([INSTITUTION])
    expect(payload.cc).toEqual([CC])
    expect(result.emailMode).toBe("live")
    expect(result.deliveredTo).toEqual([INSTITUTION, CC])
  })

  it("emailModeOf: test for everything but exactly live", () => {
    for (const mode of NOT_LIVE) expect(emailModeOf(mode)).toBe("test")
    expect(emailModeOf("live")).toBe("live")
  })
})

describe("sendLetter payload", () => {
  it("sends from EMAIL_FROM with reply-to EMAIL_REPLY_TO, plain text, the photos and the attempt id as Idempotency-Key", async () => {
    await sendLetter(input())
    const [payload, options] = m.send.mock.calls[0]
    expect(payload.from).toBe("Fixit <onboarding@resend.dev>")
    expect(payload.replyTo).toBe("tim@fixit.test")
    expect(payload.subject).toBe(input().subject)
    expect(payload.text).toBe(input().text)
    expect(payload.attachments.map((a: { filename: string }) => a.filename)).toEqual([
      "FX-2026-00142-1.jpg",
      "FX-2026-00142-2.jpg",
    ])
    expect(payload.attachments[0].contentType).toBe("image/jpeg")
    expect(Buffer.isBuffer(payload.attachments[0].content)).toBe(true)
    expect(options).toEqual({ idempotencyKey: DISPATCH })
  })
})

describe("sendLetter failures never throw", () => {
  it("a Resend error is a result without personal data", async () => {
    m.send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "x", statusCode: 403 }, headers: null })
    expect(await sendLetter(input())).toEqual({
      succeeded: false,
      emailMode: "test",
      deliveredTo: null,
      providerMessageId: null,
      errorCode: "resend_validation_error",
    })
  })

  it("a network failure is a result", async () => {
    m.send.mockRejectedValue(new TypeError("fetch failed"))
    expect((await sendLetter(input())).errorCode).toBe("network_error")
  })
})

describe("completeDispatchArgs", () => {
  it("maps a result onto complete_dispatch", () => {
    expect(
      completeDispatchArgs(DISPATCH, {
        succeeded: true,
        emailMode: "test",
        deliveredTo: [TEST_INBOX],
        providerMessageId: "re_123",
        errorCode: null,
      }),
    ).toEqual({
      p_dispatch_id: DISPATCH,
      p_succeeded: true,
      p_email_mode: "test",
      p_delivered_to: [TEST_INBOX],
      p_provider_message_id: "re_123",
      p_error_code: null,
    })
  })
})
