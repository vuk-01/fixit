// Pure helpers for the address under the pin (Tech.md §8); used by the route and the tests.
import { COORDINATE_DECIMALS } from "@/lib/constants"

import { transliterate } from "./transliterate"

export function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_DECIMALS
  return Math.round(value * factor) / factor
}

export type NominatimAddress = Partial<
  Record<
    | "road"
    | "pedestrian"
    | "house_number"
    | "city"
    | "town"
    | "village"
    | "hamlet"
    | "suburb"
    | "neighbourhood"
    | "quarter"
    | "municipality"
    | "county",
    string
  >
>

// road + house number + city/town/village, never display_name. Without a street: settlement,
// municipality and coordinates. Always Latin script.
export function formatAddress(address: NominatimAddress | undefined, lat: number, lng: number): string | null {
  if (!address) return null
  const place = address.city ?? address.town ?? address.village
  const road = address.road ?? address.pedestrian

  let text: string
  if (road) {
    const street = address.house_number ? `${road} ${address.house_number}` : road
    text = place ? `${street}, ${place}` : street
  } else {
    const settlement =
      address.suburb ?? address.neighbourhood ?? address.quarter ?? address.hamlet ?? address.village
    const municipality = address.city ?? address.town ?? address.municipality ?? address.county
    const parts = [settlement, municipality].filter(
      (part, index, all): part is string => !!part && all.indexOf(part) === index,
    )
    parts.push(`${lat.toFixed(COORDINATE_DECIMALS)}, ${lng.toFixed(COORDINATE_DECIMALS)}`)
    text = parts.join(", ")
  }
  return transliterate(text)
}

// The only municipality in P0 (PRD): a report outside its boundary is rejected (FR-4)
export const MUNICIPALITY_NAME = "Podgorica"

// a trailing "lat, lng" pair, as formatAddress appends it when there is no street
const TRAILING_COORDINATES = /(?:^|,)\s*-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+\s*$/

// The place for the list and the marker popup: the address without the coordinates formatAddress
// adds when there is no street (they stay on the report page), or the municipality when nothing
// else is left.
export function placeLabel(address: string | null): string {
  const place = address?.replace(TRAILING_COORDINATES, "").trim()
  return place || MUNICIPALITY_NAME
}

// At most one call per interval per key. In memory, so per serverless instance: enough to
// keep one phone from hammering Nominatim in P0.
export function createThrottle(intervalMs: number, now: () => number = Date.now) {
  const last = new Map<string, number>()
  return (key: string): boolean => {
    const t = now()
    const previous = last.get(key)
    if (previous !== undefined && t - previous < intervalMs) return false
    if (last.size > 5000) last.clear()
    last.set(key, t)
    return true
  }
}
