// Ticket #14: timeline text from report_events; signed by the institution or "Tim Fixit",
// never by a person (FR-18, PRD §6 Privatnost).
import { describe, expect, it } from "vitest"

import { timelineEntry, type TimelineEvent } from "./timeline"

const names = new Map([
  ["sek", "Sekretarijat za saobraćaj"],
  ["vik", "Vodovod i kanalizacija"],
])

function event(e: Partial<TimelineEvent>): TimelineEvent {
  return {
    id: "e",
    kind: "status_changed",
    to_status: "in_progress",
    actor: "institution",
    institution_id: "sek",
    previous_institution_id: null,
    message: null,
    created_at: "2026-11-04T10:00:00Z",
    ...e,
  }
}

describe("timelineEntry", () => {
  it("signs an official's status change with the institution and keeps the public message", () => {
    const entry = timelineEntry(event({ message: "Ekipa je na terenu." }), names, "public")
    expect(entry.title).toBe("U radu")
    expect(entry.signature).toBe("Sekretarijat za saobraćaj")
    expect(entry.message).toBe("Ekipa je na terenu.")
  })

  it("signs the admin's change as Tim Fixit", () => {
    expect(timelineEntry(event({ actor: "fixit", to_status: "rejected" }), names, "public").signature).toBe("Tim Fixit")
  })

  it("never signs the citizen's submission", () => {
    const entry = timelineEntry(event({ kind: "submitted", to_status: "sent", actor: "reporter" }), names, "public")
    expect(entry.title).toBe("Prijava poslata")
    expect(entry.note).toBe("Upućena instituciji: Sekretarijat za saobraćaj")
    expect(entry.signature).toBeNull()
  })

  it("uses the panel label for not_competent in the panel and the public one elsewhere", () => {
    const e = event({ kind: "not_competent", to_status: "not_competent", message: "Nije naše." })
    expect(timelineEntry(e, names, "panel").title).toBe("Nije naša nadležnost")
    expect(timelineEntry(e, names, "public").title).toBe("Preusmjerava se")
  })

  it("describes acknowledgement, routing, assignment and redirect", () => {
    expect(timelineEntry(event({ kind: "acknowledged", to_status: "acknowledged" }), names, "panel").title).toBe("Primljena")
    expect(timelineEntry(event({ kind: "routed", to_status: "routing", actor: "reporter", institution_id: null }), names, "public").title).toBe(
      "Prijava primljena. Nadležnu instituciju određuje tim Fixit.",
    )
    const assigned = timelineEntry(event({ kind: "assigned", to_status: "sent", actor: "fixit" }), names, "public")
    expect(assigned.title).toBe("Proslijeđeno: Sekretarijat za saobraćaj")
    expect(assigned.note).toBe("Nadležnog je odredio administrator Fixita.")
    expect(
      timelineEntry(
        event({ kind: "redirected", to_status: "sent", actor: "fixit", institution_id: "vik", previous_institution_id: "sek" }),
        names,
        "public",
      ).title,
    ).toBe("Preusmjereno: Sekretarijat za saobraćaj → Vodovod i kanalizacija")
  })
})
