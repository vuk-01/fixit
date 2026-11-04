// Who may open the panel (ticket #14): the list only for officials; a report's detail also for
// the admin, who opens it read-only (acknowledge_report does nothing for the admin, FR-22).
// Guests and anonymous sessions sign in first; citizens are sent to the home page.
import type { Account } from "../auth"

export type PanelPage = "list" | "detail"

export type PanelAccess =
  | { kind: "login" }
  | { kind: "forbidden" }
  | { kind: "official"; institutionId: string }
  | { kind: "admin" }

export function panelAccess(account: Pick<Account, "role" | "institutionId"> | null, page: PanelPage): PanelAccess {
  if (!account) return { kind: "login" }
  if (account.role === "official" && account.institutionId) {
    return { kind: "official", institutionId: account.institutionId }
  }
  if (account.role === "admin" && page === "detail") return { kind: "admin" }
  return { kind: "forbidden" }
}
