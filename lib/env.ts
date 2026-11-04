import "server-only"

import { z } from "zod"

// Server env (Tech.md §10, "Hosting i mejl"). Fails loudly on first use instead of
// failing halfway through a report. No secret has the NEXT_PUBLIC_ prefix (AGENTS.md rule 3).
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // optional on purpose: without a key the classify route answers `fallback` and the citizen
  // picks the category (ticket #9, FR-7); an empty value counts as missing
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-haiku-5-5"),
  RESEND_API_KEY: z.string().min(1),
  // anything except exactly "live" means test; lib/email/send.ts applies that guard
  EMAIL_MODE: z.string().default("test"),
  // without TEST_INBOX nothing is sent (lib/email/send.ts)
  TEST_INBOX: z.email().optional(),
  EMAIL_FROM: z.string().min(1),
  EMAIL_REPLY_TO: z.email(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | undefined

export function getServerEnv(): ServerEnv {
  if (cached) return cached

  const result = serverEnvSchema.safeParse(process.env)
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join(".")).join(", ")
    throw new Error(`Missing or invalid server env variables: ${names}`)
  }

  cached = result.data
  return cached
}
