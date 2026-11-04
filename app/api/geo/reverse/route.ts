import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { REVERSE_GEOCODE_MIN_INTERVAL_MS } from "@/lib/constants"
import { createThrottle, roundCoordinate } from "@/lib/geo/address"
import { reverseGeocode } from "@/lib/geo/reverse"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
})

const allow = createThrottle(REVERSE_GEOCODE_MIN_INTERVAL_MS)

// Address under the pin (Tech.md §8): only for a signed-in account, at most 1 request/s per
// user. The address is only for display; the stored one comes from the prepare route.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims || claims.is_anonymous !== false) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 })

  if (!allow(claims.sub)) return NextResponse.json({ error: "too_many_requests" }, { status: 429 })

  const lat = roundCoordinate(parsed.data.lat)
  const lng = roundCoordinate(parsed.data.lng)
  const result = await reverseGeocode(lat, lng)

  return NextResponse.json(
    { lat, lng, address: result?.address ?? null, source: result?.source ?? null },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}
