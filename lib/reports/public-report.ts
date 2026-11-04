import "server-only"

import { cache } from "react"

import { getAccount } from "@/lib/auth"
import type { PublicReportStatus, ReportCategory } from "@/lib/constants"
import { likeState, type LikeState } from "@/lib/reports/like"
import { publicPhotos, type PublicPhoto } from "@/lib/reports/public-photos"
import type { TimelineEvent } from "@/lib/reports/timeline"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type { PublicPhoto } from "@/lib/reports/public-photos"

export type PublicReport = {
  id: string
  code: string
  status: PublicReportStatus
  category: ReportCategory
  address: string | null
  description: string | null
  institutionName: string | null
  ccInstitutionName: string | null
  ruleId: string | null
  like_count: number
  submitted_at: string
  closed_at: string | null
  is_demo: boolean
  photos: PublicPhoto[]
  events: TimelineEvent[]
  institutionNames: Map<string, string>
  likeState: LikeState
}

const CODE = /^FX-\d{4}-\d{5}$/
const SIGNED_URL_SECONDS = 60 * 60

// The public report /p/[code] (PRD §8), or null for an unknown code, a draft and a hidden report:
// all three give the same "not found" page. Everything is read with the visitor's session, so RLS
// decides (DB.md §9), and drafts and hidden reports are also filtered explicitly, because the
// reporter, the recipient's official and the administrator may read them through RLS. This page is
// the public view for everyone: no letter, no report_details, never report_private data beyond
// "is this my report". Cached per request (generateMetadata and the page share one read).
export const getPublicReport = cache(
  async (code: string): Promise<PublicReport | null> => {
    if (!CODE.test(code)) return null
    const supabase = await createClient()

    const { data: r, error } = await supabase
      .from("reports")
      .select(
        "id, code, status, category, address, description, institution_id, cc_institution_id, jurisdiction_rule_id, like_count, submitted_at, closed_at, is_demo"
      )
      .eq("code", code)
      .neq("status", "draft")
      .is("hidden_at", null)
      .maybeSingle()

    if (error) console.error("getPublicReport", error.code, error.message)
    if (!r || r.status === "draft" || !r.code || !r.category || !r.submitted_at)
      return null

    const [{ data: claimsData }, account, institutions, visiblePhotos, events] =
      await Promise.all([
        supabase.auth.getClaims(),
        getAccount(),
        supabase.from("institutions").select("id, name"),
        supabase
          .from("report_photos")
          .select("storage_path, position")
          .eq("report_id", r.id)
          .is("hidden_at", null)
          .order("position", { ascending: true }),
        supabase
          .from("report_events")
          .select(
            "id, kind, to_status, actor, institution_id, previous_institution_id, message, created_at"
          )
          .eq("report_id", r.id)
          .order("created_at", { ascending: true }),
      ])

    const userId = claimsData?.claims?.sub ?? null
    const role = account?.role ?? null

    // "Is this my report" and "did I already support it" without a special RPC (DB.md §5): RLS shows
    // the reporter their report_private row and every session its own report_likes rows. Only the
    // existence of the row is read; reporter_id never leaves the database.
    const [reporterRow, likeRow] = await Promise.all([
      role === "citizen"
        ? supabase
            .from("report_private")
            .select("report_id")
            .eq("report_id", r.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      userId
        ? supabase
            .from("report_likes")
            .select("report_id")
            .eq("report_id", r.id)
            .eq("user_id", userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    // Hidden photos are replaced by a note (PRD §6). A guest's RLS never returns them, so only their
    // positions are read with the admin client, for a report the visitor's own query returned as
    // public; their paths are never read and never signed.
    const { data: hiddenRows, error: hiddenError } = await createAdminClient()
      .from("report_photos")
      .select("position")
      .eq("report_id", r.id)
      .not("hidden_at", "is", null)
    if (hiddenError)
      console.error("getPublicReport hidden photos", hiddenError.message)

    // Sign only the paths this visitor's query returned, never hidden ones (DB.md §10).
    const visible = visiblePhotos.data ?? []
    const signed = new Map<string, string>()
    if (visible.length > 0) {
      const { data: urls, error: signError } = await createAdminClient()
        .storage.from("report-photos")
        .createSignedUrls(
          visible.map((p) => p.storage_path),
          SIGNED_URL_SECONDS
        )
      if (signError) console.error("getPublicReport sign", signError.message)
      for (const u of urls ?? [])
        if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl)
    }

    const photos = publicPhotos(
      visible,
      (hiddenRows ?? []).map((p) => p.position),
      signed
    )

    const names = new Map((institutions.data ?? []).map((i) => [i.id, i.name]))
    const status = r.status as PublicReportStatus

    return {
      id: r.id,
      code: r.code,
      status,
      category: r.category,
      address: r.address,
      description: r.description,
      institutionName: r.institution_id
        ? (names.get(r.institution_id) ?? null)
        : null,
      ccInstitutionName: r.cc_institution_id
        ? (names.get(r.cc_institution_id) ?? null)
        : null,
      ruleId: r.jurisdiction_rule_id,
      like_count: r.like_count,
      submitted_at: r.submitted_at,
      closed_at: r.closed_at,
      is_demo: r.is_demo,
      photos,
      events: events.data ?? [],
      institutionNames: names,
      likeState: likeState({
        status,
        role,
        isReporter: reporterRow.data !== null,
        alreadyLiked: likeRow.data !== null,
      }),
    }
  }
)
