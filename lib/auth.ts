import "server-only"

import { redirect } from "next/navigation"

import { loginHref } from "@/lib/auth-paths"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export type Account = {
  id: string
  firstName: string
  lastName: string
  role: Database["public"]["Enums"]["user_role"]
  institutionId: string | null
}

// A signed-in account with a profile; null for guests and anonymous sessions (GLOSSARY:
// "Anonimni korisnik" is not an account). Uses getClaims(), never getSession() (Tech.md §4).
export async function getAccount(): Promise<Account | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims || claims.is_anonymous !== false) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role, institution_id")
    .eq("id", claims.sub)
    .maybeSingle()
  if (!profile) return null

  return {
    id: claims.sub,
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: profile.role,
    institutionId: profile.institution_id,
  }
}

// For pages that need an account: guests go to /uloguj-se and come back afterwards (FR-1).
export async function requireAccount(nextPath: string): Promise<Account> {
  const account = await getAccount()
  if (!account) redirect(loginHref(nextPath))
  return account
}
