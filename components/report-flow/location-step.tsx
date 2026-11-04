"use client"

import { MapPin } from "lucide-react"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"

import type { MapView } from "@/components/map/location-picker"
import { Button } from "@/components/ui/button"
import {
  ERROR_MESSAGES,
  LOCATION_FALLBACK_ZOOM,
  LOCATION_ZOOM,
  LOW_ACCURACY_M,
  PODGORICA_CENTER,
  REPORT_FLOW_TEXT,
  REVERSE_GEOCODE_DEBOUNCE_MS,
  REVERSE_GEOCODE_MIN_INTERVAL_MS,
} from "@/lib/constants"
import { roundCoordinate } from "@/lib/geo/address"
import { createClient } from "@/lib/supabase/client"

import { AnalysisBanner, analysisBlocksFlow } from "./analysis-banner"
import { locationHint, type ConfirmedPoint, type FlowPhoto, type FlowState } from "./flow-state"
import { PhotoStrip } from "./photo-strip"

const LocationPicker = dynamic(() => import("@/components/map/location-picker").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => <div className="h-full bg-muted" />,
})

type Address = { status: "loading" } | { status: "ready"; text: string | null }

// Step 2 (FR-3, FR-4): pin fixed in the centre, the citizen moves the map, address under it,
// "Potvrdi lokaciju" checks the municipality right away (Tech.md §6).
export function LocationStep({
  state,
  onRetryUpload,
  onRetryAnalysis,
  onConfirm,
  initialError = null,
  cancel,
}: {
  state: FlowState
  onRetryUpload: (photo: FlowPhoto) => void
  onRetryAnalysis: () => void
  onConfirm: (point: ConfirmedPoint) => void
  // ticket #10: the FR-4 message when prepare refused the confirmed point
  initialError?: string | null
  cancel: React.ReactNode
}) {
  const device = state.device
  const [initial] = useState<MapView>(() =>
    state.confirmed
      ? { lat: state.confirmed.lat, lng: state.confirmed.lng, zoom: LOCATION_ZOOM }
      : device.status === "found"
        ? { lat: device.lat, lng: device.lng, zoom: LOCATION_ZOOM }
        : { ...PODGORICA_CENTER, zoom: LOCATION_FALLBACK_ZOOM },
  )
  const [center, setCenter] = useState({ lat: roundCoordinate(initial.lat), lng: roundCoordinate(initial.lng) })
  const centerRef = useRef(center)
  const [target, setTarget] = useState<MapView | null>(null)
  const userMoved = useRef(state.confirmed !== null || device.status === "found")
  const [address, setAddress] = useState<Address>({ status: "loading" })
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(initialError)

  // the device location arrived after the screen opened: go there unless the citizen moved
  useEffect(() => {
    if (device.status === "found" && !userMoved.current) {
      userMoved.current = true
      setTarget({ lat: device.lat, lng: device.lng, zoom: LOCATION_ZOOM })
    }
  }, [device])

  // address under the pin once the map has settled (Tech.md §8): debounced, rounded to
  // 5 decimals, at most one request per second, stale answers ignored
  const request = useRef(0)
  const lastSent = useRef(0)
  useEffect(() => {
    const id = ++request.current
    const lat = roundCoordinate(center.lat)
    const lng = roundCoordinate(center.lng)

    const run = async (attempt: number) => {
      const wait = lastSent.current + REVERSE_GEOCODE_MIN_INTERVAL_MS - Date.now()
      if (wait > 0) await new Promise((r) => setTimeout(r, wait))
      if (id !== request.current) return
      lastSent.current = Date.now()
      try {
        const response = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`)
        if (id !== request.current) return
        if (response.status === 429 && attempt === 0) return run(1)
        const body = response.ok ? ((await response.json()) as { address: string | null }) : null
        if (id === request.current) setAddress({ status: "ready", text: body?.address ?? null })
      } catch {
        if (id === request.current) setAddress({ status: "ready", text: null })
      }
    }

    const timer = setTimeout(() => void run(0), REVERSE_GEOCODE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [center])

  const onSettle = useCallback((settled: { lat: number; lng: number }) => {
    // compare at 5 decimals: re-measuring the map (e.g. when the error line appears) also
    // fires moveend, and must not clear the error or look up the address again
    const c = { lat: roundCoordinate(settled.lat), lng: roundCoordinate(settled.lng) }
    const prev = centerRef.current
    if (prev.lat === c.lat && prev.lng === c.lng) return
    setError(null)
    centerRef.current = c
    setAddress({ status: "loading" })
    setCenter(c)
  }, [])
  const onUserMove = useCallback(() => {
    userMoved.current = true
  }, [])

  const confirm = async () => {
    setConfirming(true)
    setError(null)
    const lat = roundCoordinate(center.lat)
    const lng = roundCoordinate(center.lng)
    // FR-4 right away; on a network error the flow goes on and prepare decides (Tech.md §6)
    const { data, error: rpcError } = await createClient().rpc("resolve_municipality", { p_lat: lat, p_lng: lng })
    setConfirming(false)
    if (!rpcError && data === null) {
      setError(ERROR_MESSAGES.outside_area)
      return
    }
    onConfirm({ lat, lng, address: address.status === "ready" ? address.text : null })
  }

  const hint = locationHint(state, LOW_ACCURACY_M)
  const hintText =
    hint === "unavailable"
      ? REPORT_FLOW_TEXT.locationUnavailable
      : hint === "checkPin"
        ? REPORT_FLOW_TEXT.checkPin
        : device.status === "pending"
          ? REPORT_FLOW_TEXT.locating
          : REPORT_FLOW_TEXT.locationDescription

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-2 border-b bg-background px-4 py-3">
        <h1 className="font-heading text-xl font-semibold">{REPORT_FLOW_TEXT.locationTitle}</h1>
        <p className="text-sm text-muted-foreground" role={hint ? "status" : undefined}>
          {hintText}
        </p>
        <PhotoStrip photos={state.photos} onRetry={onRetryUpload} />
        <AnalysisBanner analysis={state.analysis} onRetry={onRetryAnalysis} />
        {state.notice && (
          <p className="text-sm text-destructive" role="alert">
            {state.notice}
          </p>
        )}
      </div>

      <div className="relative min-h-0 flex-1" role="region" aria-label={REPORT_FLOW_TEXT.mapLabel}>
        {/* isolate: Leaflet's panes use z-index 400–1000; keep them below the header menu */}
        <div className="absolute inset-0 isolate">
          <LocationPicker initial={initial} target={target} onSettle={onSettle} onUserMove={onUserMove} />
        </div>
        {/* the pin's tip marks the map centre */}
        <MapPin
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 z-10 size-11 -translate-x-1/2 -translate-y-full fill-primary text-primary-foreground drop-shadow-md"
          strokeWidth={1.5}
        />
      </div>

      <div className="flex flex-col gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="min-h-5 text-sm" aria-live="polite" data-testid="address">
          {address.status === "loading"
            ? REPORT_FLOW_TEXT.addressLoading
            : (address.text ?? REPORT_FLOW_TEXT.addressUnavailable)}
        </p>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button
          size="lg"
          className="h-12 w-full text-base"
          disabled={confirming || analysisBlocksFlow(state.analysis)}
          onClick={() => void confirm()}
        >
          {confirming ? REPORT_FLOW_TEXT.confirming : REPORT_FLOW_TEXT.confirmLocation}
        </Button>
        {cancel}
      </div>
    </div>
  )
}
