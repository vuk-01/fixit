// Timeline text from report_events (FR-18, DB.md §3: the text is not stored). The actor is the
// institution or "Tim Fixit", never a person (PRD §6 Privatnost); the citizen is never named.
import type { EventActor, ReportEventKind, ReportStatus } from "../constants"
import { STATUS_LABELS, TIMELINE_TEXT } from "../constants"

export type TimelineEvent = {
  id: string
  kind: ReportEventKind
  to_status: ReportStatus
  actor: EventActor
  institution_id: string | null
  previous_institution_id: string | null
  message: string | null
  created_at: string
}

export type TimelineEntry = {
  id: string
  title: string
  note: string | null
  message: string | null
  signature: string | null
  createdAt: string
  status: ReportStatus
}

export function timelineEntry(
  event: TimelineEvent,
  institutionNames: ReadonlyMap<string, string>,
  view: "public" | "panel",
): TimelineEntry {
  const name = (id: string | null) =>
    (id && institutionNames.get(id)) || TIMELINE_TEXT.unknownInstitution
  const signature =
    event.actor === "fixit" ? TIMELINE_TEXT.fixit : event.actor === "institution" ? name(event.institution_id) : null
  const status = STATUS_LABELS[event.to_status][view]

  const base = { id: event.id, createdAt: event.created_at, status: event.to_status, message: event.message }

  switch (event.kind) {
    case "submitted":
      return {
        ...base,
        title: TIMELINE_TEXT.submitted,
        note: event.institution_id ? TIMELINE_TEXT.sentTo(name(event.institution_id)) : null,
        signature: null,
      }
    case "routed":
      return { ...base, title: TIMELINE_TEXT.routed, note: null, signature: null }
    case "assigned":
      return {
        ...base,
        title: TIMELINE_TEXT.assigned(name(event.institution_id)),
        note: TIMELINE_TEXT.assignedNote,
        signature: null,
      }
    case "redirected":
      return {
        ...base,
        title: TIMELINE_TEXT.redirected(name(event.previous_institution_id), name(event.institution_id)),
        note: null,
        signature: null,
      }
    case "reopened":
      return { ...base, title: TIMELINE_TEXT.reopened(status), note: null, signature }
    case "acknowledged":
    case "status_changed":
    case "not_competent":
      return { ...base, title: status, note: null, signature }
  }
}
