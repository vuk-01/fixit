// pnpm db:seed-demo: demo accounts (DB.md §12.3). One mode, no options, safe to run again:
// accounts that do not exist are created, existing ones are left alone (no new password).
// Demo reports (DB.md §12.4) are added to this script later (#16).
// Plain Node 24 runs this file: no `@/` alias and no syntax beyond type annotations (Tech.md §11).
import { createClient } from "@supabase/supabase-js"

import type { Database } from "../lib/supabase/database.types"

type Role = Database["public"]["Enums"]["user_role"]

type DemoAccount = {
  handle: string
  role: Role
  institutionSlug: string | null
  firstName: string
  lastName: string
}

// Fictional names, not team members and not real officials (DB.md §12.3).
const ACCOUNTS: DemoAccount[] = [
  { handle: "citizen-video", role: "citizen", institutionSlug: null, firstName: "Milena", lastName: "Demo" },
  { handle: "citizen-seed", role: "citizen", institutionSlug: null, firstName: "Petar", lastName: "Demo" },
  { handle: "dev-1", role: "citizen", institutionSlug: null, firstName: "Dev", lastName: "Jedan" },
  { handle: "dev-2", role: "citizen", institutionSlug: null, firstName: "Dev", lastName: "Dva" },
  { handle: "dev-3", role: "citizen", institutionSlug: null, firstName: "Dev", lastName: "Tri" },
  {
    handle: "official-saobracaj",
    role: "official",
    institutionSlug: "pg-sekretarijat-saobracaj",
    firstName: "Službenik",
    lastName: "Saobraćaj",
  },
  {
    handle: "official-komunalne-usluge",
    role: "official",
    institutionSlug: "pg-komunalne-usluge",
    firstName: "Službenik",
    lastName: "Komunalne usluge",
  },
  { handle: "official-vik", role: "official", institutionSlug: "pg-vik", firstName: "Službenik", lastName: "ViK" },
  {
    handle: "official-cistoca",
    role: "official",
    institutionSlug: "pg-cistoca",
    firstName: "Službenik",
    lastName: "Čistoća",
  },
  {
    handle: "official-zelenilo",
    role: "official",
    institutionSlug: "pg-zelenilo",
    firstName: "Službenik",
    lastName: "Zelenilo",
  },
  { handle: "admin", role: "admin", institutionSlug: null, firstName: "Administrator", lastName: "Fixit" },
]

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing ${name} in .env.local`)
    process.exit(1)
  }
  return value
}

// Made-up addresses on the reserved .test domain (RFC 2606), not tied to anyone's mailbox;
// Confirm email is off, so Supabase never mails them (DB.md §12.3).
const demoEmail = (handle: string) => `${handle}@fixit.test`

// Before 4. 11. 2026 demo accounts used plus addresses of TEST_INBOX; such an account is moved
// to its new address (same user id, same password) instead of creating a second one.
function legacyEmail(testInbox: string | undefined, handle: string): string | null {
  if (!testInbox) return null
  const at = testInbox.lastIndexOf("@")
  return `${testInbox.slice(0, at)}+fixit-${handle}${testInbox.slice(at)}`.toLowerCase()
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  const testInbox = process.env.TEST_INBOX
  const password = requireEnv("DEMO_PASSWORD")
  if (password.length < 8) {
    console.error("DEMO_PASSWORD must have at least 8 characters")
    process.exit(1)
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { data: institutions, error: institutionsError } = await supabase
    .from("institutions")
    .select("id, slug")
  if (institutionsError) throw institutionsError
  const institutionId = new Map(institutions.map((i) => [i.slug, i.id]))

  // existing users by email (the project is small; one page is enough, but follow pages anyway)
  const existing = new Map<string, string>()
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const user of data.users) if (user.email) existing.set(user.email.toLowerCase(), user.id)
    if (data.users.length < 1000) break
  }

  const summary: { handle: string; email: string; role: Role; result: string }[] = []

  for (const account of ACCOUNTS) {
    const email = demoEmail(account.handle)
    let userId = existing.get(email)
    let result = "postoji, preskočen"

    const legacy = legacyEmail(testInbox, account.handle)
    const legacyId = legacy ? existing.get(legacy) : undefined
    if (!userId && legacyId) {
      const { error } = await supabase.auth.admin.updateUserById(legacyId, { email, email_confirm: true })
      if (error) throw new Error(`${account.handle}: ${error.message}`)
      userId = legacyId
      result = "mejl promijenjen"
    }

    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: account.firstName, last_name: account.lastName },
      })
      if (error) throw new Error(`${account.handle}: ${error.message}`)
      userId = data.user.id
      result = "napravljen"
    }

    // Role, institution and demo flag only change with the service key (DB.md §6, trigger 3).
    // Re-applied for existing accounts too, so an interrupted earlier run is completed; the
    // password is never touched.
    const institution = account.institutionSlug ? institutionId.get(account.institutionSlug) : null
    if (account.institutionSlug && !institution) {
      throw new Error(`${account.handle}: institution ${account.institutionSlug} not found (migration 10?)`)
    }
    const { data: updated, error: profileError } = await supabase
      .from("profiles")
      .update({ role: account.role, institution_id: institution ?? null, is_demo: true })
      .eq("id", userId)
      .select("id")
    if (profileError) throw new Error(`${account.handle}: ${profileError.message}`)
    if (!updated?.length) throw new Error(`${account.handle}: no profile row (sign-up trigger?)`)

    summary.push({ handle: account.handle, email, role: account.role, result })
  }

  console.table(summary)
  console.log("Šifra za sve naloge je DEMO_PASSWORD iz .env.local.")
  console.log("Demo prijave (DB.md §12.4) još nisu u skripti (#16).")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
