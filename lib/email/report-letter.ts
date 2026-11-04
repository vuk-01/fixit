import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { LetterInput } from "@/lib/agent/prepare"
import type { PreviewLetter } from "@/lib/agent/steps"
import { CATEGORIES, PREPARE_TEXT } from "@/lib/constants"
import { getServerEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/database.types"

import { renderLetter, type LetterParams } from "./letter-template"

// Server side of the letter (Tech.md §3, §6): collects the report's data and calls the pure
// template. The model only gave the description (FR-10); the recipient comes from the
// jurisdiction step (resolve_jurisdiction), never from the model.

// The letter for the review, step `letter` of the prepare route (Tech.md §6, point 2). The
// report has no number, submission time or earlier-reports count yet, so those places read
// "dodjeljuje se pri slanju" (FR-11, ticket 22 Q5); contact sharing is off until the citizen
// turns it on, so no name or email. Not stored: sendReport (#12) renders the real one.
// `db` is the citizen's session (RLS shows the reporter their own draft).
export async function buildPreviewLetter(db: SupabaseClient<Database>, input: LetterInput): Promise<PreviewLetter> {
  const { data, error } = await db
    .from("reports")
    .select("description, report_details(immediate_danger), report_photos(position)")
    .eq("id", input.reportId)
    .maybeSingle()
  if (error || !data) throw new Error(`letter: report data not readable (${error?.code ?? "no_row"})`)

  const params: LetterParams = {
    kind: "initial",
    code: null,
    submittedAt: null,
    previousReports: null,
    pendingText: PREPARE_TEXT.assignedAtSubmit,
    categoryLabel: CATEGORIES[input.category].label,
    description: data.description,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    institutionName: input.jurisdiction.institution?.name ?? null,
    ccInstitutionName: input.jurisdiction.cc?.name ?? null,
    likeCount: 0,
    immediateDanger: data.report_details?.immediate_danger ?? false,
    photoPositions: data.report_photos.map((p) => p.position).sort((a, b) => a - b),
    contact: null,
    siteUrl: getServerEnv().NEXT_PUBLIC_SITE_URL,
  }
  const letter = renderLetter(params)
  return { subject: letter.subject, body: letter.bodyText, params }
}
