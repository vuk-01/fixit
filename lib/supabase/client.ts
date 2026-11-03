import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "./database.types"

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

// Browser client with the publishable key; RLS decides what it can do (DB.md §9).
export function createClient() {
  client ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
  return client
}
