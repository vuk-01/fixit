// Which status changes the panel offers an official (FR-18 transitions 8–10, DB.md §8.4).
// The database enforces the same table in set_report_status; this only decides what is shown.
// "Nije naša nadležnost" (transition 12) is P1 (FR-23) and is not offered yet.
import type { ReportStatus } from "../constants"

export const OFFICIAL_TARGETS = ["in_progress", "resolved", "rejected"] as const
export type OfficialTarget = (typeof OFFICIAL_TARGETS)[number]

const FROM: Record<OfficialTarget, readonly ReportStatus[]> = {
  in_progress: ["sent", "acknowledged"], // 8
  resolved: ["sent", "acknowledged", "in_progress"], // 9
  rejected: ["sent", "acknowledged", "in_progress"], // 10
}

export function officialTargets(status: ReportStatus): OfficialTarget[] {
  return OFFICIAL_TARGETS.filter((to) => FROM[to].includes(status))
}

// transition 10: rejecting needs a public explanation
export function messageRequired(to: OfficialTarget): boolean {
  return to === "rejected"
}

// same rule as set_report_status: trimmed, empty means no message
export function normalizeMessage(message: string | null | undefined): string | null {
  const trimmed = (message ?? "").trim()
  return trimmed === "" ? null : trimmed
}
