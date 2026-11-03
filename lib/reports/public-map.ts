import "server-only"

import type { PublicReportStatus, ReportCategory } from "@/lib/constants"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type MapReport = {
  id: string
  code: string
  status: PublicReportStatus
  category: ReportCategory
  lat: number
  lng: number
  address: string | null
  like_count: number
  submitted_at: string
  closed_at: string | null
  is_demo: boolean
  photoUrl: string | null
}

const SIGNED_URL_SECONDS = 60 * 60

// Public reports for the map and the list (FR-14). Read with the visitor's session, so RLS
// decides what is visible (DB.md §9); drafts and hidden reports are also filtered explicitly,
// because a reporter or an official may see their own through RLS. The admin client only
// signs the photo paths this same query returned (DB.md §10).
export async function getPublicMapReports(): Promise<{ reports: MapReport[]; failed: boolean }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, code, status, category, lat, lng, address, like_count, submitted_at, closed_at, is_demo, report_photos(storage_path, position)",
    )
    .neq("status", "draft")
    .is("hidden_at", null)
    .not("lat", "is", null)
    .is("report_photos.hidden_at", null)
    .order("submitted_at", { ascending: false })
    .order("position", { referencedTable: "report_photos", ascending: true })
    .limit(1, { referencedTable: "report_photos" })
    .limit(500)

  if (error) {
    console.error("getPublicMapReports", error.code, error.message)
    return { reports: [], failed: true }
  }

  const paths = data.flatMap((r) => r.report_photos.map((p) => p.storage_path))
  const signed = new Map<string, string>()

  if (paths.length > 0) {
    const { data: urls, error: signError } = await createAdminClient()
      .storage.from("report-photos")
      .createSignedUrls(paths, SIGNED_URL_SECONDS)
    if (signError) {
      console.error("getPublicMapReports sign", signError.message)
    }
    for (const u of urls ?? []) {
      if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl)
    }
  }

  const reports = data.flatMap((r): MapReport[] => {
    // the CHECK constraints guarantee these for every non-draft report
    if (!r.code || !r.category || r.lat === null || r.lng === null || !r.submitted_at) return []
    const path = r.report_photos[0]?.storage_path
    return [
      {
        id: r.id,
        code: r.code,
        status: r.status as PublicReportStatus,
        category: r.category,
        lat: r.lat,
        lng: r.lng,
        address: r.address,
        like_count: r.like_count,
        submitted_at: r.submitted_at,
        closed_at: r.closed_at,
        is_demo: r.is_demo,
        photoUrl: path ? (signed.get(path) ?? null) : null,
      },
    ]
  })

  return { reports, failed: false }
}
