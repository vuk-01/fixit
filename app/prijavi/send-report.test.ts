// Ticket #12: "Pošalji prijavu" (FR-11, Tech.md §6 point 3). The whole chain runs: sendReport →
// lib/email/report-letter.ts → lib/email/dispatch.ts → lib/email/send.ts, with Supabase replaced
// by a small in-memory fake of the four functions and Resend mocked (Tech.md §12).
import { beforeEach, describe, expect, it, vi } from "vitest"

type Rpc = { error: { message: string } | null; data: unknown }

const REPORT = "22222222-2222-4222-8222-222222222222"
const USER = "33333333-3333-4333-8333-333333333333"
const INSTITUTION = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const CC = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const RULE = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
const TEST_INBOX = "inbox@fixit.test"
const CITIZEN_EMAIL = "dev-3@fixit.test"
const CODE = "FX-2026-00042"
const PATHS = ["44444444-4444-4444-8444-444444444444.jpg", "55555555-5555-4555-8555-555555555555.jpg"]

const m = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
  send: vi.fn(),
  calls: [] as { name: string; args: Record<string, unknown> }[],
  runs: [] as Record<string, unknown>[],
  db: {} as {
    status: string
    code: string | null
    outcome: "matched" | "no_rule" | "no_email"
    pending: boolean
    photoMissing: boolean
    startError: string | null
    completeFails: number
    downloadFails: boolean
    dispatches: number
  },
}))

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

// the database functions, as DB.md §8.3 describes them (only what sendReport relies on)
async function rpc(name: string, args: Record<string, unknown>): Promise<Rpc> {
  m.calls.push({ name, args })
  await tick()
  const db = m.db
  const raise = (message: string): Rpc => ({ data: null, error: { message } })
  switch (name) {
    case "begin_submission":
      if (args.p_user_id !== USER) return raise("not_allowed")
      if (db.status !== "draft") return raise("invalid_state")
      if (db.photoMissing) return raise("photo_missing")
      db.code ??= CODE
      if (db.outcome !== "matched") db.status = "routing"
      return {
        error: null,
        data: [
          {
            code: db.code,
            outcome: db.outcome,
            rule_id: db.outcome === "matched" ? RULE : null,
            institution_id: db.outcome === "matched" ? INSTITUTION : null,
            cc_institution_id: db.outcome === "matched" ? CC : null,
          },
        ],
      }
    case "count_previous_reports":
      return { error: null, data: 2 }
    case "start_dispatch":
      if (db.startError) return raise(db.startError)
      if (db.status !== "draft") return raise("invalid_state")
      if (db.pending) return raise("dispatch_in_progress")
      db.pending = true
      db.dispatches += 1
      return {
        error: null,
        data: [
          {
            letter_id: "letter-1",
            dispatch_id: `dispatch-${db.dispatches}`,
            to_email: "sekretarijat@institucija.test",
            cc_email: "putevi@institucija.test",
          },
        ],
      }
    case "complete_dispatch":
      if (db.completeFails > 0) {
        db.completeFails -= 1
        return raise("network")
      }
      db.pending = false
      if (args.p_succeeded) db.status = "sent"
      return { error: null, data: db.status }
    default:
      throw new Error(`unexpected rpc ${name}`)
  }
}

// a query builder over the few reads sendReport makes with the service key
function from(table: string) {
  let columns = ""
  const builder = {
    select(c: string) {
      columns = c
      return builder
    },
    eq: () => builder,
    in: () => builder,
    async maybeSingle() {
      if (table === "profiles") return { data: { first_name: "Dev", last_name: "Tri" }, error: null }
      if (columns === "code, status") return { data: { code: m.db.code, status: m.db.status }, error: null }
      return {
        error: null,
        data: {
          category: "pothole",
          description: "Udarna rupa na kolovozu.",
          address: "Njegoševa 5, Podgorica",
          lat: 42.4411,
          lng: 19.2636,
          like_count: 0,
          report_details: { immediate_danger: true },
          report_photos: [
            { position: 2, storage_path: PATHS[1] },
            { position: 1, storage_path: PATHS[0] },
          ],
        },
      }
    },
    then(resolve: (value: unknown) => void) {
      resolve({
        error: null,
        data: [
          { id: INSTITUTION, name: "Sekretarijat za saobraćaj" },
          { id: CC, name: "„Putevi“ d.o.o." },
        ],
      })
    },
    async insert(row: Record<string, unknown>) {
      if (table === "agent_runs") m.runs.push(row)
      return { error: null }
    },
  }
  return builder
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: m.claims ? { claims: m.claims } : null }) },
  }),
}))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc,
    from,
    storage: {
      from: () => ({
        download: async (path: string) =>
          m.db.downloadFails
            ? { data: null, error: { message: "not found" } }
            : { data: new Blob([new Uint8Array([0xff, 0xd8, PATHS.indexOf(path)])]), error: null },
      }),
    },
    auth: { admin: { getUserById: async () => ({ data: { user: { email: CITIZEN_EMAIL } }, error: null }) } },
  }),
}))
vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    NEXT_PUBLIC_SITE_URL: "https://fixit-b73a.vercel.app",
    RESEND_API_KEY: "re_test_key",
    EMAIL_MODE: "test",
    TEST_INBOX,
    EMAIL_FROM: "Fixit <onboarding@resend.dev>",
    EMAIL_REPLY_TO: "tim@fixit.test",
  }),
}))
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: m.send }
  },
}))

import { sendReport } from "./actions"

const input = { reportId: REPORT, category: "pothole" as const, description: "Udarna rupa na kolovozu.", shareContact: false }
const names = () => m.calls.map((c) => c.name)
const call = (name: string) => m.calls.find((c) => c.name === name)?.args

beforeEach(() => {
  m.claims = { sub: USER, is_anonymous: false }
  m.calls = []
  m.runs = []
  m.send.mockReset().mockResolvedValue({ data: { id: "re_1" }, error: null, headers: null })
  m.db = {
    status: "draft",
    code: null,
    outcome: "matched",
    pending: false,
    photoMissing: false,
    startError: null,
    completeFails: 0,
    downloadFails: false,
    dispatches: 0,
  }
})

describe("sendReport: letter sent", () => {
  it("runs begin_submission → count_previous_reports → start_dispatch → send → complete_dispatch", async () => {
    expect(await sendReport(input)).toEqual({ ok: true, outcome: "sent", code: CODE })
    expect(names()).toEqual(["begin_submission", "count_previous_reports", "start_dispatch", "complete_dispatch"])
    expect(call("begin_submission")).toEqual({
      p_report_id: REPORT,
      p_user_id: USER,
      p_category: "pothole",
      p_description: "Udarna rupa na kolovozu.",
      p_share_contact: false,
    })
    expect(m.send).toHaveBeenCalledTimes(1)
    expect(m.db.status).toBe("sent")
  })

  it("the recipient and cc come from begin_submission, never from the client", async () => {
    await sendReport(input)
    expect(call("start_dispatch")).toMatchObject({
      p_kind: "initial",
      p_institution_id: INSTITUTION,
      p_cc_institution_id: CC,
      p_rule_id: RULE,
      p_actor_id: USER,
      p_includes_contact: false,
    })
  })

  it("the sent letter has the real code, date and count, and no 'dodjeljuje se pri slanju'", async () => {
    await sendReport(input)
    const { p_subject: subject, p_body_text: body } = call("start_dispatch") as { p_subject: string; p_body_text: string }
    expect(subject).toBe(`Prijava komunalnog problema br. ${CODE} – Oštećen kolovoz / rupa na putu, Njegoševa 5, Podgorica`)
    expect(subject + body).not.toContain("dodjeljuje se pri slanju")
    expect(body).toContain(`Broj prijave: ${CODE}`)
    expect(body).toMatch(/Datum i vrijeme prijave: \d{1,2}\. \d{1,2}\. 2\d{3}\. u \d{2}:\d{2}/)
    expect(body).toContain("Ranije prijave iste vrste na ovoj lokaciji (do 50 m): 2")
    // immediate danger is read from report_details on the server
    expect(body).toContain("Na fotografiji je uočena moguća neposredna opasnost.")
    expect(body).toContain(`Prilog: ${CODE}-1.jpg, ${CODE}-2.jpg`)
    expect(body).not.toContain(CITIZEN_EMAIL)
  })

  it("the email goes only to TEST_INBOX with every photo as {code}-{position}.jpg and the attempt id as key", async () => {
    await sendReport(input)
    const [payload, options] = m.send.mock.calls[0]
    expect(payload.to).toEqual([TEST_INBOX])
    expect(payload.cc).toEqual([TEST_INBOX])
    expect(payload.subject).toBe(call("start_dispatch")?.p_subject)
    expect(payload.text).toBe(call("start_dispatch")?.p_body_text)
    expect(payload.attachments.map((a: { filename: string }) => a.filename)).toEqual([`${CODE}-1.jpg`, `${CODE}-2.jpg`])
    // position 1 is the first file
    expect([...payload.attachments[0].content]).toEqual([0xff, 0xd8, 0])
    expect(options).toEqual({ idempotencyKey: "dispatch-1" })
  })

  it("records the guard's outcome with complete_dispatch", async () => {
    await sendReport(input)
    expect(call("complete_dispatch")).toEqual({
      p_dispatch_id: "dispatch-1",
      p_succeeded: true,
      p_email_mode: "test",
      p_delivered_to: [TEST_INBOX],
      p_provider_message_id: "re_1",
      p_error_code: null,
    })
  })

  it("adds the citizen's name and email only with contact sharing on", async () => {
    await sendReport({ ...input, shareContact: true })
    const args = call("start_dispatch") as { p_body_text: string; p_includes_contact: boolean }
    expect(args.p_includes_contact).toBe(true)
    expect(args.p_body_text).toContain(`Dev Tri, ${CITIZEN_EMAIL}.`)
  })

  it("leaves one agent_runs row for `send` without names or emails", async () => {
    await sendReport(input)
    expect(m.runs).toHaveLength(1)
    const run = m.runs[0]
    expect(run).toMatchObject({
      report_id: REPORT,
      user_id: USER,
      step: "send",
      outcome: "ok",
      error_code: null,
      photo_count: 2,
      meta: { submission: "sent", jurisdiction_outcome: "matched", email_mode: "test", previous_reports: 2, dispatch_id: "dispatch-1" },
    })
    expect(JSON.stringify(run)).not.toMatch(/@|Dev Tri/)
  })
})

describe("sendReport: routing (FR-8)", () => {
  it.each(["no_rule", "no_email"] as const)("%s: the report is submitted to the administrator, no email", async (outcome) => {
    m.db.outcome = outcome
    expect(await sendReport({ ...input, category: "graffiti" })).toEqual({ ok: true, outcome: "routing", code: CODE })
    expect(names()).toEqual(["begin_submission"])
    expect(m.send).not.toHaveBeenCalled()
    expect(m.runs[0]).toMatchObject({ step: "send", outcome: "ok", meta: { submission: "routing", jurisdiction_outcome: outcome } })
  })
})

describe("sendReport: failures", () => {
  it("a failed send keeps the draft and its code; 'Pokušaj ponovo' repeats the whole sequence", async () => {
    m.send.mockResolvedValueOnce({ data: null, error: { name: "internal_server_error", message: "x", statusCode: 500 }, headers: null })
    expect(await sendReport(input)).toEqual({ ok: false, error: "Slanje prijave nije uspjelo. Pokušajte ponovo.", code: CODE })
    expect(call("complete_dispatch")).toMatchObject({ p_succeeded: false, p_error_code: "resend_internal_server_error" })
    expect(m.db.status).toBe("draft")
    expect(m.runs[0]).toMatchObject({ outcome: "error", error_code: "resend_internal_server_error" })

    m.calls = []
    expect(await sendReport(input)).toEqual({ ok: true, outcome: "sent", code: CODE })
    expect(names()).toEqual(["begin_submission", "count_previous_reports", "start_dispatch", "complete_dispatch"])
    expect(m.send.mock.calls[1][1]).toEqual({ idempotencyKey: "dispatch-2" })
  })

  it("photo_missing: the citizen waits for the upload, nothing is sent; a retry keeps the code", async () => {
    m.db.code = CODE // an earlier attempt already assigned it
    m.db.photoMissing = true
    expect(await sendReport(input)).toEqual({
      ok: false,
      error: "Fotografija se još otprema. Sačekajte trenutak i pokušajte ponovo.",
      code: CODE,
    })
    expect(names()).toEqual(["begin_submission"])
    expect(m.send).not.toHaveBeenCalled()
  })

  it("dispatch_in_progress sends no second email", async () => {
    m.db.code = CODE
    m.db.startError = "dispatch_in_progress"
    expect(await sendReport(input)).toEqual({ ok: false, error: "Prijava se već šalje. Sačekajte trenutak.", code: CODE })
    expect(m.send).not.toHaveBeenCalled()
    expect(names()).not.toContain("complete_dispatch")
  })

  it("a double tap sends at most one email", async () => {
    const results = await Promise.all([sendReport(input), sendReport(input)])
    expect(m.send).toHaveBeenCalledTimes(1)
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(results.find((r) => !r.ok)).toEqual({ ok: false, error: "Prijava se već šalje. Sačekajte trenutak.", code: CODE })

    // a tap after the report was submitted answers with that submission, still one email
    expect(await sendReport(input)).toEqual({ ok: true, outcome: "sent", code: CODE })
    expect(m.send).toHaveBeenCalledTimes(1)
  })

  it("an unreadable photo is a failed attempt, no email", async () => {
    m.db.downloadFails = true
    expect((await sendReport(input)).ok).toBe(false)
    expect(m.send).not.toHaveBeenCalled()
    expect(call("complete_dispatch")).toMatchObject({ p_succeeded: false, p_error_code: "photo_unreadable" })
  })

  it("after a sent email complete_dispatch is tried once more", async () => {
    m.db.completeFails = 1
    expect(await sendReport(input)).toEqual({ ok: true, outcome: "sent", code: CODE })
    expect(names().filter((n) => n === "complete_dispatch")).toHaveLength(2)

    m.db = { ...m.db, status: "draft", pending: false, completeFails: 2 }
    const result = await sendReport(input)
    expect(result).toMatchObject({ ok: false, code: CODE })
    expect(m.runs.at(-1)).toMatchObject({ outcome: "error", error_code: "complete_failed" })
  })

  it("a refusal by the database (not the reporter) passes its message on", async () => {
    m.claims = { sub: "99999999-9999-4999-8999-999999999999", is_anonymous: false }
    expect(await sendReport(input)).toEqual({ ok: false, error: "Nemate dozvolu za ovu radnju.", code: null })
    expect(m.send).not.toHaveBeenCalled()
  })
})

describe("sendReport: input and session", () => {
  it("rejects a guest, an anonymous session and bad input before any database call", async () => {
    expect((await sendReport({ ...input, category: "parking" as never })).ok).toBe(false)
    expect((await sendReport({ ...input, description: "x".repeat(1001) })).ok).toBe(false)
    m.claims = null
    expect(await sendReport(input)).toEqual({ ok: false, error: "Uloguj se da nastaviš.", code: null })
    m.claims = { sub: USER, is_anonymous: true }
    expect((await sendReport(input)).ok).toBe(false)
    expect(m.calls).toEqual([])
    expect(m.runs).toEqual([])
    expect(m.send).not.toHaveBeenCalled()
  })
})
