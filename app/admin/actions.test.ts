// Ticket #15: "Proslijedi instituciji" on /admin (FR-23 manual assignment, FR-18 transition 6). The whole
// chain runs: assignReport → lib/email/report-letter.ts → lib/email/dispatch.ts → lib/email/send.ts,
// with Supabase replaced by a small in-memory fake and Resend mocked (Tech.md §12).
import { beforeEach, describe, expect, it, vi } from "vitest"

type Result = { error: { message: string } | null; data: unknown }

const REPORT = "22222222-2222-4222-8222-222222222222"
const ADMIN = "33333333-3333-4333-8333-333333333333"
const REPORTER = "66666666-6666-4666-8666-666666666666"
const INSTITUTION = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const TEST_INBOX = "inbox@fixit.test"
const REPORTER_EMAIL = "dev-2@fixit.test"
const CODE = "FX-2026-00042"
const PATHS = ["44444444-4444-4444-8444-444444444444.jpg", "55555555-5555-4555-8555-555555555555.jpg"]

const m = vi.hoisted(() => ({
  account: null as Record<string, unknown> | null,
  send: vi.fn(),
  revalidatePath: vi.fn(),
  calls: [] as { name: string; args: Record<string, unknown> }[],
  tables: [] as string[],
  writes: [] as string[],
  db: {} as {
    status: string
    institution: { name: string; email: string | null; is_active: boolean } | null
    photos: { position: number; storage_path: string }[]
    shareContact: boolean
    pending: boolean
    startError: string | null
    completeFails: number
    dispatches: number
    // the status changed between start_dispatch and complete_dispatch (DB.md §8.3)
    changedTo: string | null
  },
}))

// the two database functions, as DB.md §8.3 describes them for `assignment`
async function rpc(name: string, args: Record<string, unknown>): Promise<Result> {
  m.calls.push({ name, args })
  const db = m.db
  const raise = (message: string): Result => ({ data: null, error: { message } })
  switch (name) {
    case "count_previous_reports":
      return { error: null, data: 1 }
    case "start_dispatch":
      if (db.startError) return raise(db.startError)
      if (db.status !== "routing") return raise("invalid_state")
      if (db.pending) return raise("dispatch_in_progress")
      db.pending = true
      db.dispatches += 1
      return {
        error: null,
        data: [
          { letter_id: "letter-1", dispatch_id: `dispatch-${db.dispatches}`, to_email: "kp@institucija.test", cc_email: null },
        ],
      }
    case "complete_dispatch":
      if (db.completeFails > 0) {
        db.completeFails -= 1
        return raise("network")
      }
      db.pending = false
      if (args.p_succeeded) db.status = db.changedTo ?? "sent"
      return { error: null, data: db.status }
    default:
      throw new Error(`unexpected rpc ${name}`)
  }
}

// a query builder over the reads assignReport makes with the service key; any write is recorded
function from(table: string) {
  m.tables.push(table)
  let columns = ""
  const write = (kind: string) => () => {
    m.writes.push(`${kind} ${table}`)
    return Promise.resolve({ error: null, data: null })
  }
  const builder = {
    select(c: string) {
      columns = c
      return builder
    },
    eq: () => builder,
    insert: write("insert"),
    update: write("update"),
    upsert: write("upsert"),
    delete: write("delete"),
    async maybeSingle() {
      if (table === "institutions") {
        if (!m.db.institution) return { data: null, error: null }
        return { data: columns === "name" ? { name: m.db.institution.name } : m.db.institution, error: null }
      }
      if (table === "report_private") {
        return { data: { reporter_id: REPORTER, share_contact: m.db.shareContact }, error: null }
      }
      if (table === "profiles") return { data: { first_name: "Dev", last_name: "Dva" }, error: null }
      if (columns === "status") return { data: { status: m.db.status }, error: null }
      return {
        error: null,
        data: {
          code: CODE,
          submitted_at: "2026-11-04T15:11:58Z",
          category: "graffiti",
          description: "Grafiti na fasadi zgrade.",
          address: "Njegoševa 5, Podgorica",
          lat: 42.4411,
          lng: 19.2636,
          like_count: 3,
          report_details: { immediate_danger: false },
          report_photos: [...m.db.photos].reverse(),
        },
      }
    },
  }
  return builder
}

vi.mock("@/lib/auth", () => ({ getAccount: async () => m.account }))
vi.mock("next/cache", () => ({ revalidatePath: m.revalidatePath }))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc,
    from,
    storage: {
      from: () => ({
        download: async (path: string) => ({ data: new Blob([new Uint8Array([0xff, 0xd8, PATHS.indexOf(path)])]), error: null }),
      }),
    },
    auth: { admin: { getUserById: async () => ({ data: { user: { email: REPORTER_EMAIL } }, error: null }) } },
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

import { ADMIN_TEXT, ERROR_MESSAGES, PREPARE_TEXT, UNKNOWN_ERROR_MESSAGE } from "@/lib/constants"

import { assignReport } from "./actions"

const input = { reportId: REPORT, institutionId: INSTITUTION }
const names = () => m.calls.map((c) => c.name)
const call = (name: string) => m.calls.find((c) => c.name === name)?.args

beforeEach(() => {
  m.account = { id: ADMIN, firstName: "Admin", lastName: "Fixit", role: "admin", institutionId: null }
  m.calls = []
  m.tables = []
  m.writes = []
  m.revalidatePath.mockReset()
  m.send.mockReset().mockResolvedValue({ data: { id: "re_1" }, error: null, headers: null })
  m.db = {
    status: "routing",
    institution: { name: "Služba komunalne policije", email: "kp@institucija.test", is_active: true },
    photos: [
      { position: 1, storage_path: PATHS[0] },
      { position: 2, storage_path: PATHS[1] },
    ],
    shareContact: false,
    pending: false,
    startError: null,
    completeFails: 0,
    dispatches: 0,
    changedTo: null,
  }
})

describe("assignReport: access", () => {
  it("refuses guests and anonymous sessions (no account) without touching the database", async () => {
    m.account = null
    expect(await assignReport(input)).toEqual({ ok: false, error: ERROR_MESSAGES.not_authenticated })
    expect(m.tables).toEqual([])
    expect(m.calls).toEqual([])
    expect(m.send).not.toHaveBeenCalled()
  })

  it("refuses citizens and officials", async () => {
    for (const role of ["citizen", "official"]) {
      m.account = { id: ADMIN, firstName: "A", lastName: "B", role, institutionId: role === "official" ? INSTITUTION : null }
      expect(await assignReport(input)).toEqual({ ok: false, error: ERROR_MESSAGES.not_allowed })
    }
    expect(m.tables).toEqual([])
    expect(m.calls).toEqual([])
    expect(m.send).not.toHaveBeenCalled()
  })

  it("refuses input that is not a report and an institution id", async () => {
    expect(await assignReport({ reportId: "FX-2026-00013", institutionId: INSTITUTION })).toEqual({
      ok: false,
      error: UNKNOWN_ERROR_MESSAGE,
    })
    expect(await assignReport({ reportId: REPORT, institutionId: "" })).toEqual({ ok: false, error: UNKNOWN_ERROR_MESSAGE })
    expect(m.tables).toEqual([])
  })
})

describe("assignReport: the institution and the report", () => {
  it("refuses an institution that does not exist, has no verified email or is not active", async () => {
    for (const institution of [
      null,
      { name: "Bez mejla", email: null, is_active: true },
      { name: "Neaktivna", email: "x@institucija.test", is_active: false },
    ]) {
      m.db.institution = institution
      expect(await assignReport(input)).toEqual({ ok: false, error: ERROR_MESSAGES.no_verified_email })
    }
    expect(names()).not.toContain("start_dispatch")
    expect(m.send).not.toHaveBeenCalled()
  })

  it("refuses a report that is no longer in routing, and a draft", async () => {
    m.db.status = "sent"
    expect(await assignReport(input)).toEqual({ ok: false, error: ADMIN_TEXT.notRouting })
    m.db.status = "draft"
    expect(await assignReport(input)).toEqual({ ok: false, error: ERROR_MESSAGES.not_found })
    expect(names()).not.toContain("start_dispatch")
    expect(m.send).not.toHaveBeenCalled()
  })

  it("refuses a report without photos (nothing to attach) before start_dispatch", async () => {
    m.db.photos = []
    expect(await assignReport(input)).toEqual({ ok: false, error: ADMIN_TEXT.noPhotos })
    expect(names()).not.toContain("start_dispatch")
    expect(m.send).not.toHaveBeenCalled()
  })
})

describe("assignReport: sending", () => {
  it("sends the assignment letter to TEST_INBOX and returns the status complete_dispatch gave", async () => {
    const result = await assignReport(input)
    expect(result).toEqual({ ok: true, status: "sent", institutionName: "Služba komunalne policije" })
    expect(names()).toEqual(["count_previous_reports", "start_dispatch", "complete_dispatch"])

    // start_dispatch(assignment): the admin's choice, no cc, no rule, the admin as actor
    const started = call("start_dispatch")!
    expect(started).toMatchObject({
      p_report_id: REPORT,
      p_kind: "assignment",
      p_institution_id: INSTITUTION,
      p_cc_institution_id: null,
      p_rule_id: null,
      p_actor_id: ADMIN,
      p_includes_contact: false,
    })
    const subject = started.p_subject as string
    const body = started.p_body_text as string
    expect(subject).toBe(`Prijava komunalnog problema br. ${CODE} – Grafiti, Njegoševa 5, Podgorica`)
    expect(body).toContain("Nadležnu instituciju za ovu prijavu odredio je administrator platforme Fixit: Služba komunalne policije.")
    expect(body).toContain("Datum i vrijeme prijave: 4. 11. 2026. u 16:11")
    expect(body).toContain("Ranije prijave iste vrste na ovoj lokaciji (do 50 m): 1")
    expect(body).toContain("Broj građana koji su podržali prijavu: 3")
    expect(body).toContain(`Prilog: ${CODE}-1.jpg, ${CODE}-2.jpg`)
    expect(body).not.toContain(PREPARE_TEXT.assignedAtSubmit)
    expect(body).not.toContain(REPORTER_EMAIL)
    expect(body).not.toContain("Dev Dva")

    // lib/email/send.ts in test mode: only TEST_INBOX, both photos attached in order
    expect(m.send).toHaveBeenCalledTimes(1)
    const [payload] = m.send.mock.calls[0]
    expect(payload.to).toEqual([TEST_INBOX])
    expect(payload.cc).toBeUndefined()
    expect(payload.attachments.map((a: { filename: string }) => a.filename)).toEqual([`${CODE}-1.jpg`, `${CODE}-2.jpg`])
    expect(call("complete_dispatch")).toMatchObject({ p_succeeded: true, p_email_mode: "test", p_delivered_to: [TEST_INBOX] })

    expect(m.revalidatePath).toHaveBeenCalledWith("/admin")
    expect(m.revalidatePath).toHaveBeenCalledWith("/panel")
  })

  it("never reads or writes jurisdiction_rules and writes no table directly (golden rule 1)", async () => {
    await assignReport(input)
    expect(m.tables).not.toContain("jurisdiction_rules")
    expect(m.writes).toEqual([])
    // the only changes go through the two database functions
    expect(names().filter((n) => n !== "count_previous_reports")).toEqual(["start_dispatch", "complete_dispatch"])
  })

  it("includes the reporter's name and email only when they chose to share them", async () => {
    m.db.shareContact = true
    await assignReport(input)
    const started = call("start_dispatch")!
    expect(started.p_includes_contact).toBe(true)
    expect(started.p_body_text).toContain(`instituciji: Dev Dva, ${REPORTER_EMAIL}.`)
  })

  it("shows the status complete_dispatch returns when it changed meanwhile", async () => {
    // e.g. the report was rejected while the email was going out: complete_dispatch keeps it
    m.db.changedTo = "rejected"
    expect(await assignReport(input)).toEqual({ ok: true, status: "rejected", institutionName: "Služba komunalne policije" })
  })

  it("refuses a second attempt while one is going out, without a second email", async () => {
    m.db.startError = "dispatch_in_progress"
    expect(await assignReport(input)).toEqual({ ok: false, error: ERROR_MESSAGES.dispatch_in_progress })
    expect(m.send).not.toHaveBeenCalled()
    expect(names()).not.toContain("complete_dispatch")
  })

  it("passes on start_dispatch's own refusals", async () => {
    m.db.startError = "no_verified_email"
    expect(await assignReport(input)).toEqual({ ok: false, error: ERROR_MESSAGES.no_verified_email })
    m.db.startError = "not_allowed"
    expect(await assignReport(input)).toEqual({ ok: false, error: ERROR_MESSAGES.not_allowed })
    m.db.startError = "invalid_state"
    expect(await assignReport(input)).toEqual({ ok: false, error: ADMIN_TEXT.notRouting })
    expect(m.send).not.toHaveBeenCalled()
  })

  it("records a failed send and leaves the report in routing", async () => {
    m.send.mockResolvedValue({ data: null, error: { name: "application_error", message: "boom" }, headers: null })
    expect(await assignReport(input)).toEqual({ ok: false, error: ADMIN_TEXT.sendFailed })
    expect(call("complete_dispatch")).toMatchObject({ p_succeeded: false })
    expect(m.db.status).toBe("routing")
    expect(m.revalidatePath).not.toHaveBeenCalled()
  })

  it("says the email went out when complete_dispatch fails twice, so nobody sends it again", async () => {
    m.db.completeFails = 2
    expect(await assignReport(input)).toEqual({ ok: false, error: ADMIN_TEXT.completeFailed })
    expect(m.send).toHaveBeenCalledTimes(1)
    expect(names().filter((n) => n === "complete_dispatch")).toHaveLength(2)
  })
})
