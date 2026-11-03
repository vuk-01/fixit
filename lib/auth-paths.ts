export const LOGIN_PATH = "/uloguj-se"

// Only same-site paths: "/prijavi" yes; "//evil.example", "https://…" and "/\\…" fall back to "/".
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/"
  if (value.startsWith("//") || value.startsWith("/\\")) return "/"
  return value
}

export function loginHref(nextPath: string): string {
  const next = safeNextPath(nextPath)
  return next === "/" ? LOGIN_PATH : `${LOGIN_PATH}?next=${encodeURIComponent(next)}`
}
