"use client"

import { useEffect, useMemo, useState } from "react"

import { createClient } from "@/lib/supabase/client"

// Live support count (FR-17): Postgres Changes UPDATE on `reports` (Tech.md §9). Without a
// filter for the map; `/p/[code]` passes `id=eq.<id>`. Realtime applies RLS per subscriber.
export function useLiveLikeCounts<T extends { id: string; like_count: number }>(
  reports: T[],
  filter?: string,
): T[] {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`reports-like-count:${filter ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports", ...(filter ? { filter } : {}) },
        (payload) => {
          const row = payload.new as { id?: string; like_count?: number }
          const { id, like_count } = row
          if (id && typeof like_count === "number") {
            setCounts((current) => ({ ...current, [id]: like_count }))
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [filter])

  return useMemo(
    () => reports.map((r) => (counts[r.id] === undefined ? r : { ...r, like_count: counts[r.id] })),
    [reports, counts],
  )
}
