import { existsSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { calendarDaysBetween, dayCounterText } from "../lib/constants.ts"

import {
  buildLetterRows,
  buildReportRows,
  DEMO_REPORTS,
  distanceMeters,
  planDemoReports,
  podgoricaTime,
  RECORDING_DAY_NOON,
  type DemoRowIds,
  type PlannedReport,
} from "./demo-plan.ts"

// Allowed (from, to) pairs, copied from DB.md §6 trigger 5 / PRD FR-18 on purpose: the test
// must fail if the plan ever needs a transition the database would refuse.
const ALLOWED: Record<string, string[]> = {
  draft: ["sent", "routing"],
  routing: ["sent", "rejected"],
  sent: [
    "acknowledged",
    "in_progress",
    "resolved",
    "rejected",
    "not_competent",
  ],
  acknowledged: [
    "in_progress",
    "resolved",
    "rejected",
    "not_competent",
    "sent",
  ],
  in_progress: ["resolved", "rejected", "not_competent", "sent"],
  not_competent: ["rejected", "sent"],
  resolved: ["in_progress"],
  rejected: ["in_progress"],
}

// counters from the table in DB.md §12.4, by row
const TABLE_COUNTERS: Record<number, string> = {
  1: "14 dana bez rješenja",
  2: "Riješeno za 6 dana",
  3: "21 dan bez rješenja",
  4: "3 dana bez rješenja",
  5: "30 dana bez rješenja",
  6: "Riješeno istog dana",
  7: "Riješeno za 1 dan",
  8: "10 dana bez rješenja",
  9: "6 dana bez rješenja",
  10: "Odbijeno nakon 1 dan",
}

const counterOnRecordingDay = (r: PlannedReport) =>
  dayCounterText(
    {
      status: r.status,
      submitted_at: r.submittedAt.toISOString(),
      closed_at: r.closedAt?.toISOString() ?? null,
    },
    RECORDING_DAY_NOON
  )

const allInstants = (plan: PlannedReport[]) =>
  plan.flatMap((r) => [
    r.submittedAt,
    ...(r.closedAt ? [r.closedAt] : []),
    ...r.events.map((e) => e.createdAt),
  ])

// runs before, on and after the recording day (local time in Podgorica)
const RUNS: [string, Date][] = [
  ["srijeda 4. 11. u 00:01", podgoricaTime(2026, 11, 4, 0, 1)],
  ["srijeda 4. 11. u 10:00", podgoricaTime(2026, 11, 4, 10, 0)],
  ["srijeda 4. 11. u 23:59", podgoricaTime(2026, 11, 4, 23, 59)],
  ["četvrtak 5. 11. u 07:00", podgoricaTime(2026, 11, 5, 7, 0)],
  ["četvrtak 5. 11. u 21:30", podgoricaTime(2026, 11, 5, 21, 30)],
  ["petak 6. 11. u 08:00", podgoricaTime(2026, 11, 6, 8, 0)],
  ["petak 6. 11. u 18:00", podgoricaTime(2026, 11, 6, 18, 0)],
  ["subota 7. 11. u 09:00", podgoricaTime(2026, 11, 7, 9, 0)],
]

describe("demo report plan (DB.md §12.4)", () => {
  it("has the ten rows of the table, with statuses and recipients", () => {
    expect(
      DEMO_REPORTS.map((r) => [
        r.row,
        r.category,
        r.status,
        r.likeCount,
        r.photo,
      ])
    ).toEqual([
      [1, "pothole", "in_progress", 23, "pothole-1.jpg"],
      [2, "street_light", "resolved", 7, "street_light-1.jpg"],
      [3, "illegal_dump", "sent", 41, "illegal_dump-1.jpg"],
      [4, "manhole", "acknowledged", 5, "manhole-1.jpg"],
      [5, "pothole", "sent", 18, "pothole-2.jpg"],
      [6, "street_light", "resolved", 9, "street_light-2.jpg"],
      [7, "illegal_dump", "resolved", 3, "illegal_dump-2.jpg"],
      [8, "manhole", "in_progress", 12, "manhole-2.jpg"],
      [9, "graffiti", "routing", 2, null],
      [10, "other", "rejected", 0, null],
    ])
    // every status except not_competent, and four institutions on the map
    expect(new Set(DEMO_REPORTS.map((r) => r.status))).toEqual(
      new Set([
        "routing",
        "sent",
        "acknowledged",
        "in_progress",
        "resolved",
        "rejected",
      ])
    )
    expect(
      new Set(
        DEMO_REPORTS.flatMap((r) =>
          r.institutionSlug ? [r.institutionSlug] : []
        )
      )
    ).toEqual(
      new Set([
        "pg-sekretarijat-saobracaj",
        "pg-komunalne-usluge",
        "pg-cistoca",
        "pg-vik",
      ])
    )
  })

  it("uses each demo photo exactly once, and every file exists", () => {
    const photos = DEMO_REPORTS.flatMap((r) => (r.photo ? [r.photo] : []))
    expect(new Set(photos).size).toBe(8)
    for (const photo of photos) {
      expect(
        photo.startsWith(DEMO_REPORTS.find((r) => r.photo === photo)!.category)
      ).toBe(true)
      expect(
        existsSync(new URL(`./demo-photos/${photo}`, import.meta.url))
      ).toBe(true)
    }
  })

  it("keeps two demo reports of the same category more than 50 m apart", () => {
    for (const a of DEMO_REPORTS) {
      for (const b of DEMO_REPORTS) {
        if (a.row < b.row && a.category === b.category) {
          expect(
            distanceMeters(a, b),
            `rows ${a.row} and ${b.row}`
          ).toBeGreaterThan(50)
        }
      }
    }
  })

  it("keeps public texts short and neutral", () => {
    const texts = DEMO_REPORTS.flatMap((r) => [
      r.description,
      ...r.events.flatMap((e) => (e.message ? [e.message] : [])),
    ])
    for (const text of texts) {
      expect(text.length).toBeLessThanOrEqual(120)
      // no deadlines, dates or promises
      expect(text).not.toMatch(/\d|\brok|\bdana\b|sedmic|uskoro|obeća|biće/i)
    }
  })

  describe.each(RUNS)("seed run on %s", (_label, now) => {
    const plan = planDemoReports(now)

    it("matches every counter of the table on the recording day", () => {
      for (const report of plan) {
        expect(counterOnRecordingDay(report), `row ${report.row}`).toBe(
          TABLE_COUNTERS[report.row]
        )
      }
    })

    it("puts no submitted_at, closed_at or event time in the future", () => {
      for (const instant of allInstants(plan))
        expect(instant.getTime()).toBeLessThanOrEqual(now.getTime())
    })

    it("keeps events in order within a report and across the whole plan", () => {
      for (const report of plan) {
        const times = report.events.map((e) => e.createdAt.getTime())
        expect([...times].sort((a, b) => a - b)).toEqual(times)
        expect(report.submittedAt).toEqual(report.events[0].createdAt)
        if (report.closedAt)
          expect(report.closedAt).toEqual(report.events.at(-1)!.createdAt)
      }
      // the same global order as with no shifting (on Saturday nothing moves)
      const reference = planDemoReports(podgoricaTime(2026, 11, 8))
      const key = (p: PlannedReport[]) =>
        p
          .flatMap((r) =>
            r.events.map((e, i) => ({
              id: `${r.row}.${i}`,
              t: e.createdAt.getTime(),
            }))
          )
          .sort((a, b) => a.t - b.t)
          .map((e) => e.id)
      expect(key(plan)).toEqual(key(reference))
    })

    it("lists reports oldest first, so codes go in submission order", () => {
      const times = plan.map((r) => r.submittedAt.getTime())
      expect([...times].sort((a, b) => a - b)).toEqual(times)
      expect(plan.map((r) => r.row)).toEqual([5, 3, 1, 8, 2, 9, 7, 10, 4, 6])
    })

    it("moves only what would be in the future, to a few minutes before the run", () => {
      const reference = planDemoReports(podgoricaTime(2026, 11, 8))
      const original = new Map(allInstants(reference).map((t, i) => [i, t]))
      allInstants(plan).forEach((t, i) => {
        const target = original.get(i)!
        if (target.getTime() <= now.getTime() - 10 * 60_000)
          expect(t).toEqual(target)
        else
          expect(now.getTime() - t.getTime()).toBeLessThanOrEqual(10 * 60_000)
      })
    })
  })

  it("puts 'today' on the day of the run when the seed runs before Friday", () => {
    const now = podgoricaTime(2026, 11, 5, 21, 30)
    const today = planDemoReports(now).find((r) => r.row === 6)!
    expect(calendarDaysBetween(today.submittedAt, now)).toBe(0)
    expect(calendarDaysBetween(today.closedAt!, now)).toBe(0)
    expect(now.getTime() - today.closedAt!.getTime()).toBeLessThanOrEqual(
      5 * 60_000
    )
  })

  it("uses the Podgorica calendar across the end of summer time", () => {
    // row 5 is 30 days before 6. 11., on 7. 10. (CEST), at 12:20 local time
    const row5 = planDemoReports(podgoricaTime(2026, 11, 8)).find(
      (r) => r.row === 5
    )!
    expect(row5.submittedAt.toISOString()).toBe("2026-10-07T10:20:00.000Z")
    const row1 = planDemoReports(podgoricaTime(2026, 11, 8)).find(
      (r) => r.row === 1
    )!
    expect(row1.submittedAt.toISOString()).toBe("2026-10-23T07:12:00.000Z")
  })

  it("only uses allowed status transitions, ending in the final status", () => {
    for (const report of planDemoReports(podgoricaTime(2026, 11, 8))) {
      let status = "draft"
      for (const event of report.events) {
        expect(event.fromStatus).toBe(status)
        expect(
          ALLOWED[status],
          `row ${report.row}: ${status} → ${event.toStatus}`
        ).toContain(event.toStatus)
        status = event.toStatus
      }
      expect(status).toBe(report.status)
    }
  })

  it("uses event kinds and actors like the RPC functions do (DB.md §8.4)", () => {
    for (const report of planDemoReports(podgoricaTime(2026, 11, 8))) {
      const [first, ...rest] = report.events
      if (report.institutionSlug) {
        expect(first).toMatchObject({
          kind: "submitted",
          fromStatus: "draft",
          toStatus: "sent",
          actor: "reporter",
        })
        expect(first.institutionSlug).toBe(report.institutionSlug)
        for (const e of rest) {
          expect(e.actor).toBe("institution")
          expect(e.institutionSlug).toBe(report.institutionSlug)
          expect(e.kind).toBe(
            e.toStatus === "acknowledged" ? "acknowledged" : "status_changed"
          )
        }
        expect(report.routingReason).toBeNull()
      } else {
        expect(first).toMatchObject({
          kind: "routed",
          fromStatus: "draft",
          toStatus: "routing",
          actor: "reporter",
        })
        expect(report.routingReason).toBe("no_rule")
        for (const e of [first, ...rest]) expect(e.institutionSlug).toBeNull()
        // a report in routing is rejected only by the Fixit team, with a message (transition 11)
        for (const e of rest)
          expect(e).toMatchObject({ actor: "fixit", toStatus: "rejected" })
        for (const e of rest) expect(e.message).toBeTruthy()
      }
    }
  })

  it("refuses a run so early that a counter would change", () => {
    expect(() => planDemoReports(podgoricaTime(2026, 11, 2, 12))).toThrow(
      /brojač/
    )
  })
})

describe("demo rows", () => {
  const plan = planDemoReports(podgoricaTime(2026, 11, 8))
  const slugs = new Map([
    ["pg-sekretarijat-saobracaj", "inst-saobracaj"],
    ["pg-putevi", "inst-putevi"],
    ["pg-komunalne-usluge", "inst-ku"],
    ["pg-cistoca", "inst-cistoca"],
    ["pg-vik", "inst-vik"],
  ])
  const ids = (r: PlannedReport): DemoRowIds => ({
    reportId: `report-${r.row}`,
    photoId: r.photo ? `photo-${r.row}` : null,
    photoPath: r.photo ? "00000000-0000-4000-8000-000000000000.jpg" : null,
    letterId: r.institutionSlug ? `letter-${r.row}` : null,
    dispatchId: r.institutionSlug ? `dispatch-${r.row}` : null,
    eventIds: r.events.map((_, i) => `event-${r.row}-${i}`),
  })
  const jurisdiction = (r: PlannedReport) =>
    r.institutionSlug
      ? {
          ruleId: `rule-${r.category}`,
          institution: {
            id: slugs.get(r.institutionSlug)!,
            email: "institucija@example.org",
          },
          cc: r.ccInstitutionSlug
            ? {
                id: slugs.get(r.ccInstitutionSlug)!,
                email: "kopija@example.org",
              }
            : null,
        }
      : { ruleId: null, institution: null, cc: null }

  it("writes a demo report in its final state, without a user id in public rows", () => {
    for (const r of plan) {
      const rows = buildReportRows(
        r,
        ids(r),
        "FX-2026-00001",
        "user-seed",
        jurisdiction(r),
        slugs
      )
      expect(rows.report).toMatchObject({
        is_demo: true,
        status: r.status,
        like_count: r.likeCount,
      })
      expect(
        JSON.stringify([rows.report, rows.photo, rows.events, rows.details])
      ).not.toContain("user-seed")
      expect(rows.reportPrivate).toMatchObject({
        reporter_id: "user-seed",
        share_contact: false,
      })
      expect(rows.photo === null).toBe(r.photo === null)
      if (r.status === "routing" || r.row === 10) {
        expect(rows.report).toMatchObject({
          institution_id: null,
          cc_institution_id: null,
          jurisdiction_rule_id: null,
        })
      } else {
        expect(rows.report.institution_id).toBe(slugs.get(r.institutionSlug!))
      }
      expect(rows.report.closed_at === null).toBe(
        !["resolved", "rejected"].includes(r.status)
      )
      expect(new Date(rows.report.created_at!).getTime()).toBeLessThan(
        r.submittedAt.getTime()
      )
    }
  })

  it("writes a sent test-mode dispatch without delivering anything", () => {
    const r = plan.find((p) => p.row === 1)!
    const { letter, dispatch } = buildLetterRows(r, ids(r), jurisdiction(r), {
      subject: "s",
      bodyText: "b",
    })
    expect(letter).toMatchObject({
      kind: "initial",
      includes_contact: false,
      sent_at: r.submittedAt.toISOString(),
    })
    expect(letter.cc_institution_id).toBe("inst-putevi")
    expect(dispatch).toMatchObject({
      status: "succeeded",
      email_mode: "test",
      delivered_to: null,
    })
  })
})
