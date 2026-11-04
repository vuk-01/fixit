// Who may open /admin (ticket #15, PRD §8 "Administrator"): only the `admin` role. Guests and
// anonymous sessions (no account) sign in first and come back; citizens and officials go home.
import type { Account } from "../auth"

export type AdminAccess = { kind: "login" } | { kind: "forbidden" } | { kind: "admin"; userId: string }

export function adminAccess(account: Pick<Account, "id" | "role"> | null): AdminAccess {
  if (!account) return { kind: "login" }
  if (account.role === "admin") return { kind: "admin", userId: account.id }
  return { kind: "forbidden" }
}
