import type { Metadata } from "next"

import { requireAccount } from "@/lib/auth"

export const metadata: Metadata = { title: "Prijavi problem" }

// Placeholder until the report flow (#8). Guests and anonymous sessions go to /uloguj-se
// and come back here after signing in (FR-1).
export default async function ReportPage() {
  await requireAccount("/prijavi")

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-2 px-4 py-6">
      <h1 className="font-heading text-2xl font-semibold">Prijavi problem</h1>
    </main>
  )
}
