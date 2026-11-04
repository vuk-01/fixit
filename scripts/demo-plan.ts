// Demo reports for `pnpm db:seed-demo` (DB.md §12.4) as pure data and pure functions: the plan
// (categories, places, statuses, dates, timeline, supports) and the rows the seed inserts. No
// database, network or clock access here, so Vitest covers it and the seed only writes.
// Plain Node 24 imports this file: relative `.ts` imports, no `@/`, no enums (Tech.md §11).
import {
  CATEGORIES,
  dayCounterText,
  PREPARE_TEXT,
  TIME_ZONE,
} from "../lib/constants.ts"
import { renderLetter, type Letter } from "../lib/email/letter-template.ts"
import type { Database } from "../lib/supabase/database.types"

type Enums = Database["public"]["Enums"]
type Tables = Database["public"]["Tables"]
type ReportCategory = Enums["report_category"]
type ReportStatus = Enums["report_status"]

// The recording day (ticket 22 Q2): "N days ago" means N calendar days before this Friday in
// Podgorica, never before the moment the seed runs.
export const RECORDING_DAY = { year: 2026, month: 11, day: 6 } as const

// ---------------------------------------------------------------------------------------------
// The table from DB.md §12.4. Rows are in the order of that table (`row` = its "#").
// ---------------------------------------------------------------------------------------------

// local time in Podgorica, `daysAgo` calendar days before RECORDING_DAY
type At = { daysAgo: number; time: string }

type DemoEventSpec = {
  at: At
  kind: Enums["report_event_kind"]
  to: ReportStatus
  actor: Enums["event_actor"]
  // public timeline message; short and neutral, no deadlines, promises or names (DB.md §12.4)
  message?: string
}

export type DemoReportSpec = {
  row: number
  category: ReportCategory
  status: ReportStatus
  lat: number
  lng: number
  // Nominatim reverse geocoding of the point, formatted like lib/geo/address.ts
  address: string
  // public (ticket 19 Q4): short and neutral
  description: string
  likeCount: number
  // file in scripts/demo-photos; rows 9 and 10 have none (ticket 21)
  photo: string | null
  // Expected recipient and copy from jurisdiction_rules (DB.md §12.2). The seed asks
  // resolve_jurisdiction and stops if the answer differs; this is a check, never the source.
  institutionSlug: string | null
  ccInstitutionSlug: string | null
  // non-public model fields (report_details); null in the manual flow (rows without a photo)
  title: string | null
  severity: Enums["report_severity"] | null
  immediateDanger: boolean
  aiConfidence: number | null
  // counter on the recording day (FR-15), as in DB.md §12.4
  expectedCounter: string
  events: DemoEventSpec[]
}

const FIELD_TEAM = "Prijava je proslijeđena ekipi na terenu."

export const DEMO_REPORTS: DemoReportSpec[] = [
  {
    row: 1,
    category: "pothole",
    status: "in_progress",
    lat: 42.4462,
    lng: 19.247,
    address: "Bulevar Džordža Vašingtona, Podgorica",
    description: "Udarna rupa na kolovozu, uz ivicu saobraćajne trake.",
    likeCount: 23,
    photo: "pothole-1.jpg",
    institutionSlug: "pg-sekretarijat-saobracaj",
    ccInstitutionSlug: "pg-putevi",
    title: "Udarna rupa na kolovozu",
    severity: "medium",
    immediateDanger: false,
    aiConfidence: 0.94,
    expectedCounter: "14 dana bez rješenja",
    events: [
      {
        at: { daysAgo: 14, time: "09:12" },
        kind: "submitted",
        to: "sent",
        actor: "reporter",
      },
      {
        at: { daysAgo: 13, time: "08:40" },
        kind: "acknowledged",
        to: "acknowledged",
        actor: "institution",
      },
      {
        at: { daysAgo: 9, time: "11:05" },
        kind: "status_changed",
        to: "in_progress",
        actor: "institution",
        message: FIELD_TEAM,
      },
    ],
  },
  {
    row: 2,
    category: "street_light",
    status: "resolved",
    lat: 42.4398,
    lng: 19.2512,
    address: "Ivana Vujoševića, Podgorica",
    description: "Oborena ulična svjetiljka pored trotoara.",
    likeCount: 7,
    photo: "street_light-1.jpg",
    institutionSlug: "pg-komunalne-usluge",
    ccInstitutionSlug: null,
    title: "Oborena ulična svjetiljka",
    severity: "medium",
    immediateDanger: false,
    aiConfidence: 0.91,
    expectedCounter: "Riješeno za 6 dana",
    events: [
      {
        at: { daysAgo: 8, time: "18:30" },
        kind: "submitted",
        to: "sent",
        actor: "reporter",
      },
      {
        at: { daysAgo: 7, time: "08:15" },
        kind: "acknowledged",
        to: "acknowledged",
        actor: "institution",
      },
      {
        at: { daysAgo: 5, time: "10:20" },
        kind: "status_changed",
        to: "in_progress",
        actor: "institution",
        message: FIELD_TEAM,
      },
      {
        at: { daysAgo: 2, time: "13:45" },
        kind: "status_changed",
        to: "resolved",
        actor: "institution",
        message: "Svjetiljka je zamijenjena.",
      },
    ],
  },
  {
    row: 3,
    category: "illegal_dump",
    status: "sent",
    lat: 42.4385,
    lng: 19.286,
    address: "Braće Ribar, Podgorica",
    description: "Gomila odbačenog otpada na neizgrađenoj površini pored puta.",
    likeCount: 41,
    photo: "illegal_dump-1.jpg",
    institutionSlug: "pg-cistoca",
    ccInstitutionSlug: null,
    title: "Odbačen otpad pored puta",
    severity: "medium",
    immediateDanger: false,
    aiConfidence: 0.89,
    expectedCounter: "21 dan bez rješenja",
    events: [
      {
        at: { daysAgo: 21, time: "16:05" },
        kind: "submitted",
        to: "sent",
        actor: "reporter",
      },
    ],
  },
  {
    row: 4,
    category: "manhole",
    status: "acknowledged",
    lat: 42.45,
    lng: 19.24,
    address: "Meše Selimovića, Podgorica",
    description: "Šaht je otvoren, a poklopac nije na mjestu.",
    likeCount: 5,
    photo: "manhole-1.jpg",
    institutionSlug: "pg-vik",
    ccInstitutionSlug: null,
    title: "Otvoren šaht bez poklopca",
    severity: "high",
    immediateDanger: true,
    aiConfidence: 0.93,
    expectedCounter: "3 dana bez rješenja",
    events: [
      {
        at: { daysAgo: 3, time: "07:50" },
        kind: "submitted",
        to: "sent",
        actor: "reporter",
      },
      {
        at: { daysAgo: 2, time: "09:30" },
        kind: "acknowledged",
        to: "acknowledged",
        actor: "institution",
      },
    ],
  },
  {
    row: 5,
    category: "pothole",
    status: "sent",
    lat: 42.428,
    lng: 19.2635,
    address: "Bracana Bracanovića, Podgorica",
    description: "Oštećen asfalt i rupa na kolovozu.",
    likeCount: 18,
    photo: "pothole-2.jpg",
    institutionSlug: "pg-sekretarijat-saobracaj",
    ccInstitutionSlug: "pg-putevi",
    title: "Rupa na kolovozu",
    severity: "medium",
    immediateDanger: false,
    aiConfidence: 0.9,
    expectedCounter: "30 dana bez rješenja",
    events: [
      {
        at: { daysAgo: 30, time: "12:20" },
        kind: "submitted",
        to: "sent",
        actor: "reporter",
      },
    ],
  },
  {
    row: 6,
    category: "street_light",
    status: "resolved",
    lat: 42.444,
    lng: 19.254,
    address: "Vasa Raičkovića, Podgorica",
    description: "Razbijena svjetiljka javne rasvjete.",
    likeCount: 9,
    photo: "street_light-2.jpg",
    institutionSlug: "pg-komunalne-usluge",
    ccInstitutionSlug: null,
    title: "Razbijena svjetiljka javne rasvjete",
    severity: "low",
    immediateDanger: false,
    aiConfidence: 0.87,
    expectedCounter: "Riješeno istog dana",
    events: [
      {
        at: { daysAgo: 0, time: "08:05" },
        kind: "submitted",
        to: "sent",
        actor: "reporter",
      },
      {
        at: { daysAgo: 0, time: "09:40" },
        kind: "status_changed",
        to: "in_progress",
        actor: "institution",
      },
      {
        at: { daysAgo: 0, time: "12:30" },
        kind: "status_changed",
        to: "resolved",
        actor: "institution",
        message: "Rasvjeta je popravljena.",
      },
    ],
  },
  {
    row: 7,
    category: "illegal_dump",
    status: "resolved",
    lat: 42.4265,
    lng: 19.2585,
    address: "Filipa Lainovića, Podgorica",
    description: "Odbačen otpad pored puta.",
    likeCount: 3,
    photo: "illegal_dump-2.jpg",
    institutionSlug: "pg-cistoca",
    ccInstitutionSlug: null,
    title: "Odbačen otpad",
    severity: "medium",
    immediateDanger: false,
    aiConfidence: 0.92,
    expectedCounter: "Riješeno za 1 dan",
    events: [
      {
        at: { daysAgo: 5, time: "17:10" },
        kind: "submitted",
        to: "sent",
        actor: "reporter",
      },
      {
        at: { daysAgo: 4, time: "11:30" },
        kind: "status_changed",
        to: "resolved",
        actor: "institution",
        message: "Otpad je uklonjen.",
      },
    ],
  },
  {
    row: 8,
    category: "manhole",
    status: "in_progress",
    lat: 42.43,
    lng: 19.276,
    address: "Kraljevačka, Podgorica",
    description: "Otvoreno okno šahta na kolovozu.",
    likeCount: 12,
    photo: "manhole-2.jpg",
    institutionSlug: "pg-vik",
    ccInstitutionSlug: null,
    title: "Otvoreno okno šahta",
    severity: "high",
    immediateDanger: true,
    aiConfidence: 0.88,
    expectedCounter: "10 dana bez rješenja",
    events: [
      {
        at: { daysAgo: 10, time: "10:45" },
        kind: "submitted",
        to: "sent",
        actor: "reporter",
      },
      {
        at: { daysAgo: 9, time: "08:50" },
        kind: "acknowledged",
        to: "acknowledged",
        actor: "institution",
      },
      {
        at: { daysAgo: 7, time: "14:00" },
        kind: "status_changed",
        to: "in_progress",
        actor: "institution",
        message: FIELD_TEAM,
      },
    ],
  },
  {
    row: 9,
    category: "graffiti",
    status: "routing",
    lat: 42.4365,
    lng: 19.2655,
    address: "Brijeg Ćukovića, Podgorica",
    description: "Grafiti na fasadi zgrade.",
    likeCount: 2,
    photo: null,
    institutionSlug: null,
    ccInstitutionSlug: null,
    title: null,
    severity: null,
    immediateDanger: false,
    aiConfidence: null,
    expectedCounter: "6 dana bez rješenja",
    events: [
      {
        at: { daysAgo: 6, time: "19:20" },
        kind: "routed",
        to: "routing",
        actor: "reporter",
      },
    ],
  },
  {
    row: 10,
    category: "other",
    status: "rejected",
    lat: 42.4475,
    lng: 19.24,
    address: "Vijenci Danila Kiša, Podgorica",
    description: "Prijedlog da se na ovom mjestu postavi klupa.",
    likeCount: 0,
    photo: null,
    institutionSlug: null,
    ccInstitutionSlug: null,
    title: null,
    severity: null,
    immediateDanger: false,
    aiConfidence: null,
    expectedCounter: "Odbijeno nakon 1 dan",
    events: [
      {
        at: { daysAgo: 4, time: "15:35" },
        kind: "routed",
        to: "routing",
        actor: "reporter",
      },
      {
        at: { daysAgo: 3, time: "10:10" },
        kind: "status_changed",
        to: "rejected",
        actor: "fixit",
        message: "Prijava je prijedlog, a ne komunalni problem.",
      },
    ],
  },
]

// ---------------------------------------------------------------------------------------------
// Time in Podgorica
// ---------------------------------------------------------------------------------------------

const zoneParts = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
})

function localParts(ms: number) {
  const p = Object.fromEntries(
    zoneParts.formatToParts(new Date(ms)).map((part) => [part.type, part.value])
  ) as Record<string, string>
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  }
}

// offset of Podgorica from UTC at an instant (CET or CEST)
function zoneOffsetMs(ms: number): number {
  const p = localParts(ms)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(ms / 1000) * 1000
}

// the instant of a local wall-clock time in Podgorica
export function podgoricaTime(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute)
  let ms = wall - zoneOffsetMs(wall)
  ms = wall - zoneOffsetMs(ms)
  return new Date(ms)
}

function startOfPodgoricaDay(at: Date): Date {
  const p = localParts(at.getTime())
  return podgoricaTime(p.year, p.month, p.day)
}

function recordingDayTime({ daysAgo, time }: At): Date {
  const day = new Date(
    Date.UTC(
      RECORDING_DAY.year,
      RECORDING_DAY.month - 1,
      RECORDING_DAY.day - daysAgo
    )
  )
  const [hour, minute] = time.split(":").map(Number)
  return podgoricaTime(
    day.getUTCFullYear(),
    day.getUTCMonth() + 1,
    day.getUTCDate(),
    hour,
    minute
  )
}

// a moment on the recording day, for the counter check
export const RECORDING_DAY_NOON = podgoricaTime(
  RECORDING_DAY.year,
  RECORDING_DAY.month,
  RECORDING_DAY.day,
  12
)

// ---------------------------------------------------------------------------------------------
// Plan: concrete instants, oldest report first
// ---------------------------------------------------------------------------------------------

export type PlannedEvent = {
  kind: Enums["report_event_kind"]
  fromStatus: ReportStatus
  toStatus: ReportStatus
  actor: Enums["event_actor"]
  // the recipient for submitted and institution events; null for reporter routing and Fixit
  institutionSlug: string | null
  message: string | null
  createdAt: Date
}

export type PlannedReport = Omit<DemoReportSpec, "events"> & {
  routingReason: Enums["routing_reason"] | null
  submittedAt: Date
  closedAt: Date | null
  events: PlannedEvent[]
}

const CLOSED: ReportStatus[] = ["resolved", "rejected"]
// spacing of moved events and how far before the run the last one lands
const SHIFT_STEP_MS = 60_000

// Instants from the recording day; an instant that would fall after `now` (row 6, "today", when
// the seed runs before Friday) moves to a few minutes before `now`. All moved instants keep
// their order and stay after every instant that did not move, and they never cross into the
// previous day in Podgorica, so counters stay as in the table (ticket 22 Q2).
function placeInstants(targets: Date[], now: Date): Date[] {
  const order = targets
    .map((t, i) => i)
    .sort((a, b) => targets[a].getTime() - targets[b].getTime())
  const nowMs = now.getTime()
  const dayStart = startOfPodgoricaDay(now).getTime()

  let moved = targets.filter((t) => t.getTime() > nowMs).length
  let step = SHIFT_STEP_MS
  for (;;) {
    if (moved === 0) return targets
    step = Math.min(SHIFT_STEP_MS, Math.floor((nowMs - dayStart) / (moved + 1)))
    const firstSlot = nowMs - moved * step
    const needed = targets.filter((t) => t.getTime() >= firstSlot).length
    if (needed === moved) break
    moved = needed
  }

  const placed = [...targets]
  order.slice(order.length - moved).forEach((index, i) => {
    placed[index] = new Date(nowMs - (moved - i) * step)
  })
  return placed
}

export function planDemoReports(now: Date): PlannedReport[] {
  const targets = DEMO_REPORTS.flatMap((spec) =>
    spec.events.map((event) => recordingDayTime(event.at))
  )
  const placed = placeInstants(targets, now)

  let cursor = 0
  const plan = DEMO_REPORTS.map((spec): PlannedReport => {
    let from: ReportStatus = "draft"
    const events = spec.events.map((event): PlannedEvent => {
      const planned: PlannedEvent = {
        kind: event.kind,
        fromStatus: from,
        toStatus: event.to,
        actor: event.actor,
        institutionSlug:
          event.actor === "fixit" || event.kind === "routed"
            ? null
            : spec.institutionSlug,
        message: event.message ?? null,
        createdAt: placed[cursor++],
      }
      from = event.to
      return planned
    })
    const last = events[events.length - 1]
    const { events: _specEvents, ...rest } = spec
    void _specEvents
    return {
      ...rest,
      routingReason: events[0].kind === "routed" ? "no_rule" : null,
      submittedAt: events[0].createdAt,
      closedAt: CLOSED.includes(spec.status) ? last.createdAt : null,
      events,
    }
  })

  plan.sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())

  // The table is the contract for the video: stop before writing anything if a counter on the
  // recording day would differ (e.g. the seed runs earlier than the dates allow).
  for (const report of plan) {
    const counter = dayCounterText(
      {
        status: report.status,
        submitted_at: report.submittedAt.toISOString(),
        closed_at: report.closedAt?.toISOString() ?? null,
      },
      RECORDING_DAY_NOON
    )
    if (counter !== report.expectedCounter) {
      throw new Error(
        `Demo prijava ${report.row}: brojač bi bio „${counter}", a treba „${report.expectedCounter}".`
      )
    }
  }

  return plan
}

// ---------------------------------------------------------------------------------------------
// Rows the seed inserts (the same objects go to supabase-js and to the local Postgres check)
// ---------------------------------------------------------------------------------------------

export type DemoRowIds = {
  reportId: string
  photoId: string | null
  photoPath: string | null
  letterId: string | null
  dispatchId: string | null
  eventIds: string[]
}

export type DemoInstitution = { id: string; email: string | null }

export type DemoJurisdiction = {
  ruleId: string | null
  institution: DemoInstitution | null
  cc: DemoInstitution | null
}

export type DemoRows = {
  report: Tables["reports"]["Insert"]
  reportPrivate: Tables["report_private"]["Insert"]
  details: Tables["report_details"]["Insert"]
  photo: Tables["report_photos"]["Insert"] | null
  events: Tables["report_events"]["Insert"][]
}

// the draft existed for a moment before it was sent
const DRAFT_LEAD_MS = 90_000
const LETTER_LEAD_MS = 3_000

export function buildReportRows(
  report: PlannedReport,
  ids: DemoRowIds,
  code: string,
  reporterId: string,
  jurisdiction: DemoJurisdiction,
  institutionIdBySlug: ReadonlyMap<string, string>
): DemoRows {
  if (report.photo && !ids.photoPath)
    throw new Error(`Demo prijava ${report.row}: nema putanje fotografije.`)
  if (report.institutionSlug && !jurisdiction.institution) {
    throw new Error(`Demo prijava ${report.row}: nema nadležne institucije.`)
  }

  const createdAt = new Date(
    report.submittedAt.getTime() - DRAFT_LEAD_MS
  ).toISOString()
  const fromModel = report.photo !== null

  const slugId = (slug: string | null) => {
    if (!slug) return null
    const id = institutionIdBySlug.get(slug)
    if (!id) throw new Error(`Institucija ${slug} ne postoji.`)
    return id
  }

  return {
    report: {
      id: ids.reportId,
      code,
      status: report.status,
      category: report.category,
      lat: report.lat,
      lng: report.lng,
      address: report.address,
      address_source: "nominatim",
      description: report.description,
      institution_id: jurisdiction.institution?.id ?? null,
      cc_institution_id: jurisdiction.cc?.id ?? null,
      jurisdiction_rule_id: report.institutionSlug ? jurisdiction.ruleId : null,
      routing_reason: report.routingReason,
      like_count: report.likeCount,
      is_demo: true,
      submitted_at: report.submittedAt.toISOString(),
      closed_at: report.closedAt?.toISOString() ?? null,
      created_at: createdAt,
    },
    reportPrivate: {
      report_id: ids.reportId,
      reporter_id: reporterId,
      share_contact: false,
      created_at: createdAt,
    },
    details: {
      report_id: ids.reportId,
      // rows without a photo look like the manual flow: the citizen picked the category
      analysis_status: fromModel ? "done" : "failed",
      is_municipal_problem: fromModel ? true : null,
      ai_category: fromModel ? report.category : null,
      ai_confidence: report.aiConfidence,
      category_source: fromModel ? "ai" : "citizen",
      title: report.title,
      severity: report.severity,
      immediate_danger: report.immediateDanger,
      image_contains_instructions: false,
      created_at: createdAt,
    },
    photo:
      report.photo && ids.photoPath
        ? {
            id: ids.photoId ?? undefined,
            report_id: ids.reportId,
            storage_path: ids.photoPath,
            position: 1,
            sent_to_model: true,
            has_personal_data: false,
            created_at: createdAt,
          }
        : null,
    events: report.events.map((event, i) => ({
      id: ids.eventIds[i],
      report_id: ids.reportId,
      kind: event.kind,
      from_status: event.fromStatus,
      to_status: event.toStatus,
      actor: event.actor,
      institution_id: slugId(event.institutionSlug),
      message: event.message,
      created_at: event.createdAt.toISOString(),
    })),
  }
}

export type DemoLetterRows = {
  letter: Tables["letters"]["Insert"]
  dispatch: Tables["dispatches"]["Insert"]
}

// Signature of demo letters: the production URL (PRD FR-11), not NEXT_PUBLIC_SITE_URL from
// .env.local, which is localhost on the machine that runs the seed.
export const DEMO_SITE_URL = "https://fixit-b73a.vercel.app"

// The first letter of a demo report from the same template as real letters
// (lib/email/letter-template.ts; DB.md §12.4, ticket 22 Q6): real code, submission time and
// earlier-reports count; no supports yet at send time; contact sharing off, so no name or email.
export function renderDemoLetter(
  report: PlannedReport,
  data: {
    code: string
    previousReports: number
    institutionName: string
    ccInstitutionName: string | null
  }
): Letter {
  return renderLetter({
    kind: "initial",
    code: data.code,
    submittedAt: report.submittedAt,
    previousReports: data.previousReports,
    pendingText: PREPARE_TEXT.assignedAtSubmit,
    categoryLabel: CATEGORIES[report.category].label,
    description: report.description,
    address: report.address,
    lat: report.lat,
    lng: report.lng,
    institutionName: data.institutionName,
    ccInstitutionName: data.ccInstitutionName,
    likeCount: 0,
    immediateDanger: report.immediateDanger,
    photoPositions: report.photo ? [1] : [],
    contact: null,
    siteUrl: DEMO_SITE_URL,
    timeZone: TIME_ZONE,
  })
}

// The first letter of a sent report and its one successful, test-mode dispatch. Nothing is
// mailed: no call to lib/email/send.ts, and `delivered_to` stays empty because nobody received
// it (DB.md §12.4).
export function buildLetterRows(
  report: PlannedReport,
  ids: DemoRowIds,
  jurisdiction: DemoJurisdiction,
  letter: { subject: string; bodyText: string }
): DemoLetterRows {
  const institution = jurisdiction.institution
  if (!institution?.email || !ids.letterId || !ids.dispatchId) {
    throw new Error(
      `Demo prijava ${report.row}: dopis traži primaoca sa provjerenim mejlom.`
    )
  }
  const sentAt = report.submittedAt.toISOString()
  const startedAt = new Date(
    report.submittedAt.getTime() - LETTER_LEAD_MS
  ).toISOString()

  return {
    letter: {
      id: ids.letterId,
      report_id: ids.reportId,
      kind: "initial",
      institution_id: institution.id,
      cc_institution_id: jurisdiction.cc?.id ?? null,
      jurisdiction_rule_id: jurisdiction.ruleId,
      to_email: institution.email,
      cc_email: jurisdiction.cc?.email ?? null,
      subject: letter.subject,
      body_text: letter.bodyText,
      includes_contact: false,
      sent_at: sentAt,
      created_at: startedAt,
    },
    dispatch: {
      id: ids.dispatchId,
      letter_id: ids.letterId,
      report_id: ids.reportId,
      status: "succeeded",
      email_mode: "test",
      delivered_to: null,
      provider_message_id: null,
      error_code: null,
      started_at: startedAt,
      finished_at: sentAt,
      created_at: startedAt,
    },
  }
}

// great-circle distance in metres, for the 50 m rule (DB.md §12.4)
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6_371_008.8 * Math.asin(Math.sqrt(h))
}
