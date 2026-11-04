import "server-only"

import { REVERSE_GEOCODE_TIMEOUT_MS } from "@/lib/constants"
import { getServerEnv } from "@/lib/env"

import { formatAddress, roundCoordinate, type NominatimAddress } from "./address"

export type ReverseResult = { address: string; source: "nominatim" }

// Nominatim, only from the server (Tech.md §8). accept-language=cnr-Latn, never sr-Latn
// (Cyrillic in Podgorica). The User-Agent names the site, never an email address.
// Photon is not built in P0; it would go behind this same function (ticket 22 Q9).
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse")
  url.search = new URLSearchParams({
    format: "jsonv2",
    lat: String(roundCoordinate(lat)),
    lon: String(roundCoordinate(lng)),
    zoom: "18",
    addressdetails: "1",
    "accept-language": "cnr-Latn",
  }).toString()

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": `Fixit/0.1 (+${getServerEnv().NEXT_PUBLIC_SITE_URL})` },
      signal: AbortSignal.timeout(REVERSE_GEOCODE_TIMEOUT_MS),
      cache: "no-store",
    })
    if (!response.ok) return null
    const body = (await response.json()) as { address?: NominatimAddress }
    const address = formatAddress(body.address, lat, lng)
    return address ? { address, source: "nominatim" } : null
  } catch {
    return null
  }
}
