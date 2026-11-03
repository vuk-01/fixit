import "server-only"

import { createClient } from "@supabase/supabase-js"

import { getServerEnv } from "@/lib/env"

import type { Database } from "./database.types"

// Service key client: bypasses RLS. Use only after checking the user with getClaims(),
// and only for what RLS does not cover (Tech.md §4, DB.md §8.2).
export function createAdminClient() {
  const env = getServerEnv()

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
