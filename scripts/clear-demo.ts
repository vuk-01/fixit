// pnpm db:clear-demo (FR-25, DB.md §12.5): deletes every demo report (is_demo) with everything
// attached and the demo accounts' agent_runs, then their photo files in batches. With
// `-- --accounts` it also deletes the demo accounts (profiles.is_demo).
// Run only after grading: never before the rehearsal, the recording or the submission.
// The code counter is not wound back (DB.md §8.3).
// Plain Node 24 runs this file: no `@/` alias and no syntax beyond type annotations (Tech.md §11).
import { createInterface } from "node:readline/promises"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "../lib/supabase/database.types"

const BUCKET = "report-photos"
const REMOVE_BATCH = 100
const CONFIRM_WORD = "obriši"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing ${name} in .env.local`)
    process.exit(1)
  }
  return value
}

async function main() {
  const withAccounts = process.argv.slice(2).includes("--accounts")
  const supabase = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )

  const { count, error: countError } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("is_demo", true)
  if (countError) throw countError

  // the demo data must stay until grading is over; one typed word guards against a slip
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(
    `Brišem ${count ?? 0} demo prijava${withAccounts ? " i sve demo naloge" : ""}. ` +
      `Samo poslije ocjenjivanja! Upiši „${CONFIRM_WORD}" za nastavak: `
  )
  rl.close()
  if (answer.trim() !== CONFIRM_WORD) {
    console.log("Prekinuto, ništa nije obrisano.")
    return
  }

  // 1. rows: demo reports (cascade) and the demo accounts' agent_runs; returns photo paths
  const { data: paths, error: clearError } =
    await supabase.rpc("clear_demo_data")
  if (clearError) throw clearError
  console.log(
    `Obrisano demo prijava: ${count ?? 0}; fotografija za brisanje: ${paths.length}.`
  )

  // 2. files, in batches (a direct DELETE on storage.objects would not remove a file, DB.md §10)
  let removed = 0
  const failed: string[] = []
  for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
    const batch = paths.slice(i, i + REMOVE_BATCH)
    const { data, error } = await supabase.storage.from(BUCKET).remove(batch)
    if (error) {
      console.error(
        `Brisanje fajlova ${i + 1}–${i + batch.length} nije uspjelo: ${error.message}`
      )
      failed.push(...batch)
    } else {
      removed += data.length
    }
  }
  console.log(`Obrisano fajlova: ${removed}.`)
  if (failed.length)
    console.error(
      `Fajlovi koji nisu obrisani (obriši ih ručno u Storage-u):\n${failed.join("\n")}`
    )

  // 3. only with --accounts: the demo accounts themselves
  if (withAccounts) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_demo", true)
    if (profilesError) throw profilesError
    let deleted = 0
    for (const profile of profiles) {
      const { error } = await supabase.auth.admin.deleteUser(profile.id)
      if (error)
        console.error(`Nalog ${profile.id} nije obrisan: ${error.message}`)
      else deleted++
    }
    console.log(`Obrisano demo naloga: ${deleted} od ${profiles.length}.`)
  } else {
    console.log(
      "Demo nalozi su ostali (za njihovo brisanje: pnpm db:clear-demo -- --accounts)."
    )
  }

  if (failed.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
