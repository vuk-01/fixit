// Ticket #10: POST /api/agent/prepare with mocked Supabase clients and a mocked Nominatim.
// Includes the mandatory test 2 (AGENTS.md): outside Podgorica is refused; a category with a
// rule gets the institution from jurisdiction_rules; a category without one gets no recipient
// and goes to the administrator.
import { beforeEach, describe, expect, it, vi } from "vitest"

type Result = { data: unknown; error: { message?: string; code?: string } | null }

const m = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
  // the citizen's session
  userRpc: vi.fn(),
  draft: vi.fn(),
  duplicateRow: vi.fn(),
  letterRow: vi.fn(),
  institutions: vi.fn(),
  // service key
  adminRpc: vi.fn(),
  insert: vi.fn(),
  sign: vi.fn(),
  reverse: vi.fn(),
}))

// a PostgREST query builder: every filter returns the builder, the end resolves the result
function query(resolve: (columns: string) => Promise<Result>) {
  let columns = ""
  const builder: Record<string, unknown> = {}
  for (const name of ["eq", "neq", "is", "in", "order", "limit"]) builder[name] = () => builder
  builder.select = (c: string) => {
    columns = c
    return builder
  }
  builder.maybeSingle = () => resolve(columns)
  builder.then = (ok: (r: Result) => unknown, fail: (e: unknown) => unknown) => resolve(columns).then(ok, fail)
  return builder
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: m.claims ? { claims: m.claims } : null }) },
    rpc: m.userRpc,
    from: (table: string) =>
      query(async (columns) => {
        if (table === "institutions") return m.institutions()
        if (table === "reports" && columns.includes("report_private")) return m.draft()
        if (table === "reports" && columns.includes("report_details")) return m.letterRow()
        if (table === "reports") return m.duplicateRow()
        throw new Error(`unexpected table ${table}`)
      }),
  }),
}))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: m.adminRpc,
    from: (table: string) => {
      if (table !== "agent_runs") throw new Error(`the admin client writes only agent_runs, not ${table}`)
      return { insert: m.insert }
    },
    storage: { from: () => ({ createSignedUrl: m.sign }) },
  }),
}))
vi.mock("@/lib/geo/reverse", () => ({ reverseGeocode: m.reverse }))
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://fixit-b73a.vercel.app" }) }))
// the route must not even load the model SDK (AGENTS.md rule 1: no AI in jurisdiction)
vi.mock("@anthropic-ai/sdk", () => {
  throw new Error("prepare must not import the Anthropic SDK")
})

import { POST } from "./route"

const USER = "11111111-1111-4111-8111-111111111111"
const REPORT = "22222222-2222-4222-8222-222222222222"
const PODGORICA = "33333333-3333-4333-8333-333333333333"
const SEKRETARIJAT = "44444444-4444-4444-8444-444444444444"
const PUTEVI = "55555555-5555-4555-8555-555555555555"
const RULE = "66666666-6666-4666-8666-666666666666"
const DUP = "77777777-7777-4777-8777-777777777777"

const IN_PODGORICA = { lat: 42.4411, lng: 19.2636 }
const NIKSIC = { lat: 42.7731, lng: 18.9445 }

type Rule = { outcome: string; rule_id: string | null; institution_id: string | null; cc_institution_id: string | null }
const RULES: Record<string, Rule> = {
  // Putevi: the Secretariat for traffic is the recipient, "Putevi" d.o.o. the cc (PRD)
  pothole: { outcome: "matched", rule_id: RULE, institution_id: SEKRETARIJAT, cc_institution_id: PUTEVI },
  street_light: { outcome: "matched", rule_id: RULE, institution_id: SEKRETARIJAT, cc_institution_id: null },
  water_leak: { outcome: "no_email", rule_id: RULE, institution_id: null, cc_institution_id: null },
  graffiti: { outcome: "no_rule", rule_id: null, institution_id: null, cc_institution_id: null },
  other: { outcome: "no_rule", rule_id: null, institution_id: null, cc_institution_id: null },
}

function request(body: unknown) {
  return new Request("http://localhost/api/agent/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

const input = (over: Record<string, unknown> = {}) => ({ reportId: REPORT, ...IN_PODGORICA, category: "pothole", ...over })

type Event = { event: string; data: Record<string, unknown> }

async function events(res: Response): Promise<Event[]> {
  const text = await res.text()
  return text
    .split("\n\n")
    .filter((block) => block.startsWith("event:"))
    .map((block) => {
      const [eventLine, dataLine] = block.split("\n")
      return { event: eventLine.slice("event: ".length), data: JSON.parse(dataLine.slice("data: ".length)) }
    })
}

const steps = (list: Event[]) =>
  list.map((e) => (e.event === "step" ? `${e.data.step}:${e.data.status}` : e.event))

const result = (list: Event[]) => list.find((e) => e.event === "result")?.data as Record<string, unknown> & {
  jurisdiction: { outcome: string; ruleId: string | null; institution: { id: string; name: string } | null; cc: unknown }
  duplicate: Record<string, unknown> | null
  address: string | null
  letter: { subject: string; body: string } | null
}

const runs = () => m.insert.mock.calls.map(([row]) => row as Record<string, unknown>)

beforeEach(() => {
  m.claims = { sub: USER, is_anonymous: false }
  m.draft.mockReset().mockResolvedValue({
    data: { status: "draft", lat: null, lng: null, address: null, address_source: null, report_private: { reporter_id: USER } },
    error: null,
  })
  m.userRpc.mockReset().mockImplementation(async (name: string, args: Record<string, unknown>) => {
    if (name === "resolve_municipality") {
      return { data: args.p_lat === IN_PODGORICA.lat ? PODGORICA : null, error: null }
    }
    if (name === "resolve_jurisdiction") {
      return { data: [RULES[args.p_category as string] ?? RULES.other], error: null }
    }
    if (name === "find_nearby_open_reports") return { data: [], error: null }
    throw new Error(`unexpected rpc ${name}`)
  })
  m.institutions.mockReset().mockResolvedValue({
    data: [
      { id: SEKRETARIJAT, name: "Sekretarijat za saobraćaj Glavnog grada Podgorice" },
      { id: PUTEVI, name: "Putevi d.o.o. Podgorica" },
    ],
    error: null,
  })
  m.duplicateRow.mockReset()
  m.letterRow.mockReset().mockResolvedValue({
    data: {
      description: "Na kolovozu se vidi udarna rupa.",
      report_details: { immediate_danger: false },
      report_photos: [{ position: 2 }, { position: 1 }],
    },
    error: null,
  })
  m.adminRpc.mockReset().mockResolvedValue({ data: null, error: null })
  m.insert.mockReset().mockResolvedValue({ error: null })
  m.sign.mockReset().mockResolvedValue({ data: { signedUrl: "https://signed.example/photo.jpg" }, error: null })
  m.reverse.mockReset().mockResolvedValue({ address: "Bulevar Svetog Petra Cetinjskog 1, Podgorica", source: "nominatim" })
})

describe("POST /api/agent/prepare: before the stream", () => {
  it("rejects a guest and an anonymous session", async () => {
    m.claims = null
    let res = await POST(request(input()))
    expect(res.status).toBe(401)
    m.claims = { sub: USER, is_anonymous: true }
    res = await POST(request(input()))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "not_authenticated" })
    expect(m.draft).not.toHaveBeenCalled()
    expect(m.userRpc).not.toHaveBeenCalled()
  })

  it.each([
    ["not JSON", "{"],
    ["no report id", { lat: 42.44, lng: 19.26, category: "pothole" }],
    ["a report id that is not a uuid", input({ reportId: "abc" })],
    ["an unknown category", input({ category: "parking" })],
    ["a category in another case", input({ category: "Pothole" })],
    ["a latitude out of range", input({ lat: 91 })],
    ["a longitude as text", input({ lng: "19.26" })],
  ])("rejects %s", async (_, body) => {
    const res = await POST(request(body))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "invalid_request" })
    expect(m.draft).not.toHaveBeenCalled()
  })

  it("answers not_found for a report the citizen cannot see", async () => {
    m.draft.mockResolvedValue({ data: null, error: null })
    const res = await POST(request(input()))
    expect(res.status).toBe(404)
    expect(m.userRpc).not.toHaveBeenCalled()
    expect(m.adminRpc).not.toHaveBeenCalled()
  })

  it("refuses somebody else's report (ownership is checked on the server)", async () => {
    // a public report of another citizen: RLS hides report_private from the caller
    m.draft.mockResolvedValue({
      data: { status: "sent", lat: 1, lng: 2, address: null, address_source: null, report_private: null },
      error: null,
    })
    const res = await POST(request(input()))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "not_allowed" })
    expect(m.userRpc).not.toHaveBeenCalled()
    expect(m.adminRpc).not.toHaveBeenCalled()
    expect(m.insert).not.toHaveBeenCalled()
  })

  it("refuses a report that is no longer a draft", async () => {
    m.draft.mockResolvedValue({
      data: { status: "routing", lat: 1, lng: 2, address: null, address_source: null, report_private: { reporter_id: USER } },
      error: null,
    })
    const res = await POST(request(input()))
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: "invalid_state" })
    expect(m.adminRpc).not.toHaveBeenCalled()
  })
})

describe("POST /api/agent/prepare: the stream", () => {
  it("answers text/event-stream with the steps in order, then the result", async () => {
    const res = await POST(request(input()))
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("text/event-stream; charset=utf-8")
    expect(res.headers.get("Cache-Control")).toContain("no-store")
    const list = await events(res)
    expect(steps(list)).toEqual([
      "jurisdiction:started",
      "jurisdiction:done",
      "duplicates:started",
      "duplicates:done",
      "letter:started",
      "letter:done",
      "result",
    ])
  })

  it("stores point, address and category with update_draft (admin client, the caller's id)", async () => {
    await events(await POST(request(input({ lat: 42.441104, lng: 19.263649 }))))
    expect(m.reverse).toHaveBeenCalledWith(42.4411, 19.26365)
    expect(m.adminRpc).toHaveBeenCalledWith("update_draft", {
      p_report_id: REPORT,
      p_user_id: USER,
      p_lat: 42.4411,
      p_lng: 19.26365,
      p_address: "Bulevar Svetog Petra Cetinjskog 1, Podgorica",
      p_address_source: "nominatim",
      p_category: "pothole",
    })
  })

  it("writes one agent_runs row per step, without personal data", async () => {
    await events(await POST(request(input())))
    expect(runs().map((r) => [r.step, r.outcome])).toEqual([
      ["jurisdiction", "ok"],
      ["duplicates", "ok"],
      ["letter", "ok"],
    ])
    for (const row of runs()) {
      expect(row).toMatchObject({ report_id: REPORT, user_id: USER, error_code: null })
      expect(typeof row.duration_ms).toBe("number")
      expect(JSON.stringify(row.meta)).not.toMatch(/Bulevar|Podgorica|@/)
    }
    expect(runs()[0].meta).toEqual({ jurisdiction_outcome: "matched", address_found: true, address_reused: false })
    expect(runs()[1].meta).toEqual({ duplicate_count: 0 })
  })

  it("ignores a recipient sent by the client", async () => {
    const list = await events(
      await POST(request({ ...input({ category: "graffiti" }), institutionId: SEKRETARIJAT, recipient: "x" })),
    )
    expect(result(list).jurisdiction.institution).toBeNull()
    expect(m.adminRpc.mock.calls[0][1]).not.toHaveProperty("institutionId")
  })

  it("goes on with the coordinates when Nominatim does not answer", async () => {
    m.reverse.mockResolvedValue(null)
    const list = await events(await POST(request(input())))
    expect(steps(list).at(-1)).toBe("result")
    expect(result(list).address).toBeNull()
    expect(m.adminRpc).toHaveBeenCalledWith(
      "update_draft",
      expect.objectContaining({ p_address: null, p_address_source: null, p_lat: 42.4411, p_lng: 19.2636 }),
    )
    expect(runs()[0].meta).toMatchObject({ address_found: false })
  })

  it("does not look the address up again for the same pin (e.g. a new category)", async () => {
    m.draft.mockResolvedValue({
      data: {
        status: "draft",
        ...IN_PODGORICA,
        address: "Njegoševa 5, Podgorica",
        address_source: "nominatim",
        report_private: { reporter_id: USER },
      },
      error: null,
    })
    const list = await events(await POST(request(input({ category: "street_light" }))))
    expect(m.reverse).not.toHaveBeenCalled()
    expect(result(list).address).toBe("Njegoševa 5, Podgorica")
    expect(m.adminRpc).toHaveBeenCalledWith(
      "update_draft",
      expect.objectContaining({ p_address: "Njegoševa 5, Podgorica", p_category: "street_light" }),
    )
  })

  it("ends with an error event when update_draft is refused", async () => {
    m.adminRpc.mockResolvedValue({ data: null, error: { message: "invalid_state" } })
    const list = await events(await POST(request(input())))
    expect(steps(list)).toEqual(["jurisdiction:started", "jurisdiction:failed", "error"])
    expect(list.at(-1)?.data).toEqual({ code: "invalid_state" })
    expect(runs()).toHaveLength(1)
    expect(runs()[0]).toMatchObject({ step: "jurisdiction", outcome: "error", error_code: "invalid_state" })
  })

  it("hides an unexpected database error behind unknown", async () => {
    m.userRpc.mockImplementation(async (name: string) =>
      name === "resolve_municipality"
        ? { data: PODGORICA, error: null }
        : { data: null, error: { message: "permission denied for function resolve_jurisdiction" } },
    )
    const list = await events(await POST(request(input())))
    expect(list.at(-1)).toEqual({ event: "error", data: { code: "unknown" } })
  })
})

describe("mandatory test 2: jurisdiction only from jurisdiction_rules", () => {
  it("refuses a location outside Podgorica (FR-4) before anything is stored", async () => {
    const list = await events(await POST(request(input(NIKSIC))))
    expect(steps(list)).toEqual(["jurisdiction:started", "jurisdiction:failed", "error"])
    expect(list.at(-1)?.data).toEqual({ code: "outside_area" })
    expect(m.adminRpc).not.toHaveBeenCalled()
    expect(m.userRpc).not.toHaveBeenCalledWith("resolve_jurisdiction", expect.anything())
    expect(m.userRpc).not.toHaveBeenCalledWith("find_nearby_open_reports", expect.anything())
    expect(runs()[0]).toMatchObject({ step: "jurisdiction", outcome: "error", error_code: "outside_area" })
  })

  it("refuses it too when the database trigger says outside_area", async () => {
    m.adminRpc.mockResolvedValue({ data: null, error: { message: "outside_area" } })
    const list = await events(await POST(request(input())))
    expect(list.at(-1)?.data).toEqual({ code: "outside_area" })
  })

  it("gives the institution (and cc) of the rule for a category with a rule", async () => {
    const list = await events(await POST(request(input({ category: "pothole" }))))
    expect(m.userRpc).toHaveBeenCalledWith("resolve_jurisdiction", { p_category: "pothole", p_municipality_id: PODGORICA })
    expect(result(list).jurisdiction).toEqual({
      outcome: "matched",
      ruleId: RULE,
      institution: { id: SEKRETARIJAT, name: "Sekretarijat za saobraćaj Glavnog grada Podgorice" },
      cc: { id: PUTEVI, name: "Putevi d.o.o. Podgorica" },
    })
  })

  it("gives no cc when the rule has none", async () => {
    const list = await events(await POST(request(input({ category: "street_light" }))))
    expect(result(list).jurisdiction).toMatchObject({ outcome: "matched", cc: null })
    expect(result(list).jurisdiction.institution?.id).toBe(SEKRETARIJAT)
  })

  it.each(["graffiti", "other"])("gives no recipient for %s (no rule): the report goes to the administrator", async (category) => {
    const list = await events(await POST(request(input({ category }))))
    expect(steps(list).at(-1)).toBe("result")
    expect(result(list).jurisdiction).toEqual({ outcome: "no_rule", ruleId: null, institution: null, cc: null })
    expect(m.institutions).not.toHaveBeenCalled()
    expect(runs()[0].meta).toMatchObject({ jurisdiction_outcome: "no_rule" })
  })

  it("gives no recipient when the recipient has no verified email (no_email)", async () => {
    const list = await events(await POST(request(input({ category: "water_leak" }))))
    expect(result(list).jurisdiction).toMatchObject({ outcome: "no_email", institution: null, cc: null })
  })
})

describe("duplicates (FR-9)", () => {
  const nearby = { id: DUP, code: "FX-2026-00007", status: "sent", like_count: 3, submitted_at: "2026-11-01T10:00:00Z", distance_m: 23.4, is_own: false }
  const row = {
    id: DUP,
    code: "FX-2026-00007",
    status: "sent",
    category: "pothole",
    lat: 42.4412,
    lng: 19.2637,
    address: "Njegoševa 5, Podgorica",
    like_count: 3,
    submitted_at: "2026-11-01T10:00:00Z",
    closed_at: null,
    is_demo: true,
    report_photos: [{ storage_path: "88888888-8888-4888-8888-888888888888.jpg", position: 1 }],
  }

  beforeEach(() => {
    const base = m.userRpc.getMockImplementation()!
    m.userRpc.mockImplementation(async (name: string, args: Record<string, unknown>) =>
      name === "find_nearby_open_reports" ? { data: [nearby], error: null } : base(name, args),
    )
    m.duplicateRow.mockResolvedValue({ data: row, error: null })
  })

  it("looks for open reports of the same category near the pin, without the draft itself", async () => {
    const list = await events(await POST(request(input())))
    expect(m.userRpc).toHaveBeenCalledWith("find_nearby_open_reports", {
      p_category: "pothole",
      p_lat: 42.4411,
      p_lng: 19.2636,
      p_exclude_report_id: REPORT,
    })
    expect(result(list).duplicate).toMatchObject({
      id: DUP,
      code: "FX-2026-00007",
      status: "sent",
      like_count: 3,
      distanceM: 23.4,
      isOwn: false,
      photoUrl: "https://signed.example/photo.jpg",
    })
    expect(runs()[1].meta).toEqual({ duplicate_count: 1 })
  })

  it("marks the citizen's own report", async () => {
    const base = m.userRpc.getMockImplementation()!
    m.userRpc.mockImplementation(async (name: string, args: Record<string, unknown>) =>
      name === "find_nearby_open_reports" ? { data: [{ ...nearby, is_own: true }], error: null } : base(name, args),
    )
    const list = await events(await POST(request(input())))
    expect(result(list).duplicate).toMatchObject({ isOwn: true })
  })

  it("offers none when the report is no longer visible (hidden in the meantime)", async () => {
    m.duplicateRow.mockResolvedValue({ data: null, error: null })
    const list = await events(await POST(request(input())))
    expect(result(list).duplicate).toBeNull()
  })

  it("goes on without an offer when the check fails", async () => {
    const base = m.userRpc.getMockImplementation()!
    m.userRpc.mockImplementation(async (name: string, args: Record<string, unknown>) =>
      name === "find_nearby_open_reports" ? { data: null, error: { message: "boom" } } : base(name, args),
    )
    const list = await events(await POST(request(input())))
    expect(steps(list)).toEqual([
      "jurisdiction:started",
      "jurisdiction:done",
      "duplicates:started",
      "duplicates:failed",
      "letter:started",
      "letter:done",
      "result",
    ])
    expect(result(list).duplicate).toBeNull()
    expect(runs()[1]).toMatchObject({ step: "duplicates", outcome: "error", error_code: "unknown" })
  })
})

describe("the letter for the review (FR-10, FR-11)", () => {
  it("comes from the template with the recipient from the rule and no number yet", async () => {
    const list = await events(await POST(request(input())))
    const letter = result(list).letter!
    expect(letter.subject).toBe(
      "Prijava komunalnog problema br. dodjeljuje se pri slanju – Oštećen kolovoz / rupa na putu, Bulevar Svetog Petra Cetinjskog 1, Podgorica",
    )
    expect(letter.body).toContain("nadležna institucija za ovu prijavu je: Sekretarijat za saobraćaj Glavnog grada Podgorice.")
    expect(letter.body).toContain("Kopija ovog dopisa upućena je i instituciji: Putevi d.o.o. Podgorica.")
    expect(letter.body).toContain("Opis: Na kolovozu se vidi udarna rupa.")
    expect(letter.body).toContain("Datum i vrijeme prijave: dodjeljuje se pri slanju")
    expect(letter.body).toContain("Prilog: 2 fotografije prijave (nazivi priloga: dodjeljuje se pri slanju)")
    expect(letter.body.endsWith("S poštovanjem,\nTim Fixit\nhttps://fixit-b73a.vercel.app")).toBe(true)
    // no email address at all: contact sharing is off in the preview
    expect(letter.body).not.toMatch(/@/)
  })

  it("says the administrator will choose the institution for a category without a rule", async () => {
    const list = await events(await POST(request(input({ category: "other" }))))
    expect(result(list).letter!.body).toContain("Nadležnu instituciju za ovu prijavu odrediće administrator platforme Fixit.")
  })

  it("goes on without the preview when the report data cannot be read", async () => {
    m.letterRow.mockResolvedValue({ data: null, error: { code: "PGRST116" } })
    const list = await events(await POST(request(input())))
    expect(steps(list).slice(-3)).toEqual(["letter:started", "letter:failed", "result"])
    expect(result(list).letter).toBeNull()
    expect(runs()[2]).toMatchObject({ step: "letter", outcome: "error", error_code: "unknown" })
  })
})
