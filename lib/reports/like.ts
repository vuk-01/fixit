// What the "Podržavam" button shows on /p/[code] (FR-16, GLOSSARY "Podrška"). The database decides
// in like_report (DB.md §8.3); this only avoids offering a tap that would be refused.
import type { ReportStatus } from "../constants"
import { OPEN_STATUSES } from "../constants"

export type LikeState =
  | "can_like" // guest, anonymous session or a citizen who is not the reporter
  | "liked" // this session already supported the report
  | "closed" // resolved or rejected: "Prijava je zatvorena"
  | "own" // the reporter
  | "staff" // officials and administrators do not support reports

export function likeState(input: {
  status: ReportStatus
  // null for a guest and for an anonymous session (they are not accounts)
  role: "citizen" | "official" | "admin" | null
  isReporter: boolean
  alreadyLiked: boolean
}): LikeState {
  if (!OPEN_STATUSES.includes(input.status)) return "closed"
  if (input.role === "official" || input.role === "admin") return "staff"
  if (input.isReporter) return "own"
  if (input.alreadyLiked) return "liked"
  return "can_like"
}

// The state after like_report refused the tap (DB.md §8.1 error codes), so the button stops
// offering it; null keeps the button and shows the error message.
export function likeStateAfterError(code: string): LikeState | null {
  switch (code) {
    case "own_report":
      return "own"
    case "not_allowed":
      return "staff"
    case "report_not_open":
      return "closed"
    default:
      return null
  }
}
