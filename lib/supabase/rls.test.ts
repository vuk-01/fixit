// AGENTS.md required test 4: an anonymous client and an anonymous session cannot write to
// `reports`, read `report_private` or call a server function. Runs against the shared project
// and only attempts forbidden operations; each anonymous session is signed out at the end.
import { createClient } from "@supabase/supabase-js"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import type { Database } from "./database.types"

// only this test talks to the network, so only it reads .env.local (skipped when absent)
try {
  process.loadEnvFile(".env.local")
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

const newClient = () =>
  createClient<Database>(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

function forbiddenOperations(getClient: () => ReturnType<typeof newClient>) {
  it("cannot insert into reports", async () => {
    const { data, error } = await getClient().from("reports").insert({ status: "draft" }).select()
    expect(data).toBeNull()
    expect(error?.code).toBe("42501")
  })

  it("cannot update reports", async () => {
    const { error } = await getClient()
      .from("reports")
      .update({ like_count: 1_000_000 })
      .neq("id", "00000000-0000-0000-0000-000000000000")
    expect(error?.code).toBe("42501")
  })

  it("reads no rows from report_private", async () => {
    const { data, error } = await getClient().from("report_private").select("report_id, reporter_id")
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it("cannot call create_draft", async () => {
    const { data, error } = await getClient().rpc("create_draft", {
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_photo_paths: ["00000000-0000-4000-8000-000000000000.jpg"],
    })
    expect(data).toBeNull()
    expect(error?.code).toBe("42501")
  })

  it("cannot call next_report_code", async () => {
    const { error } = await getClient().rpc("next_report_code")
    expect(error?.code).toBe("42501")
  })
}

describe.skipIf(!url || !key)("RLS on the shared project", () => {
  describe("anonymous client (no session)", () => {
    const client = newClient()
    forbiddenOperations(() => client)
  })

  describe("anonymous session (is_anonymous = true)", () => {
    const client = newClient()

    beforeAll(async () => {
      const { data, error } = await client.auth.signInAnonymously()
      if (error) throw error
      expect(data.user?.is_anonymous).toBe(true)
    })

    afterAll(async () => {
      await client.auth.signOut()
    })

    forbiddenOperations(() => client)
  })
})
