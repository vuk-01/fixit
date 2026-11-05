import { HEADER_TEXT, type UserRole } from "@/lib/constants"

export type AccountLabelInput = {
  role: UserRole
  firstName: string
  lastName: string
  email: string | null
  institutionName: string | null
}

// What the account menu's navy top shows (UI.md "Header" → "Account menu"): an official is shown as their
// institution, an administrator as „Administrator", a citizen by name or, without one, by mail. The role
// badge is left out when the title already is the role.
export function accountTitle(a: AccountLabelInput): { title: string; showRole: boolean } {
  const role = HEADER_TEXT.roles[a.role]
  const person = `${a.firstName} ${a.lastName}`.replace(/\s+/g, " ").trim()
  const email = a.email?.trim() || ""
  const title =
    a.role === "admin"
      ? role
      : (a.role === "official" ? a.institutionName?.trim() : "") || person || email || role
  return { title, showRole: title !== role }
}

// First letters of the first and last word of the shown title; for a mail address, of its local part.
// Words are runs of letters, so quotes, „d.o.o." dots and digits do not count.
export function initialsOf(title: string): string {
  const source = title.includes("@") ? title.slice(0, title.indexOf("@")) : title
  const words = source.match(/\p{L}+/gu) ?? []
  const first = words.at(0)?.charAt(0) ?? ""
  const last = words.length > 1 ? (words.at(-1)?.charAt(0) ?? "") : ""
  return `${first}${last}`.toLocaleUpperCase("sr-Latn")
}
