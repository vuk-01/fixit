"use client"

import { useCallback, useEffect, useReducer, useRef } from "react"

import { Progress } from "@/components/ui/progress"
import { GEOLOCATION_OPTIONS, REPORT_FLOW_STEPS, REPORT_FLOW_TEXT } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"

import { flowReducer, initialFlowState, type FlowPhoto, type FlowStep, type PhotoSource } from "./flow-state"
import { ConfirmedStep } from "./confirmed-step"
import { LocationStep } from "./location-step"
import { PhotoStep } from "./photo-step"

const STEP_INDEX: Record<FlowStep, number> = { photos: 0, location: 1, confirmed: 2 }

// The report wizard (UI.md v2): photo → location → (review, #11). One primary button per step.
export function ReportFlow() {
  const [state, dispatch] = useReducer(flowReducer, initialFlowState)
  const geolocationStarted = useRef(false)

  // FR-3: the first tap on "Fotografiši" / "Iz galerije" also asks for the device location
  const startGeolocation = useCallback(() => {
    if (geolocationStarted.current) return
    geolocationStarted.current = true
    if (!("geolocation" in navigator)) {
      dispatch({ type: "device", device: { status: "unavailable" } })
      return
    }
    dispatch({ type: "device", device: { status: "pending" } })
    navigator.geolocation.getCurrentPosition(
      (position) =>
        dispatch({
          type: "device",
          device: {
            status: "found",
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
        }),
      () => dispatch({ type: "device", device: { status: "unavailable" } }),
      GEOLOCATION_OPTIONS,
    )
  }, [])

  // FR-2: the 1600 px version goes straight from the browser to Storage, in the background
  const upload = useCallback(async (photo: FlowPhoto) => {
    dispatch({ type: "upload", id: photo.id, status: "uploading" })
    const { error } = await createClient()
      .storage.from("report-photos")
      .upload(photo.path, photo.full, { contentType: "image/jpeg", upsert: false })
    dispatch({ type: "upload", id: photo.id, status: error ? "failed" : "done" })
  }, [])

  const onPhotos = useCallback(
    (photos: FlowPhoto[], notice: string | null) => {
      dispatch({ type: "photosAdded", photos, notice })
      for (const photo of photos) void upload(photo)
    },
    [upload],
  )

  // thumbnails are object URLs; free them when the flow goes away
  const photosRef = useRef(state.photos)
  useEffect(() => {
    photosRef.current = state.photos
  }, [state.photos])
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), [])

  const index = STEP_INDEX[state.step]

  return (
    <div className="flex h-[calc(100svh-4rem-1px)] flex-col bg-muted/50">
      <div className="border-b bg-background px-4 py-3">
        <Progress value={((index + 1) / REPORT_FLOW_STEPS.length) * 100} aria-label={REPORT_FLOW_TEXT.pageTitle}>
          <div className="flex w-full items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">{REPORT_FLOW_STEPS[index]}</span>
            <span className="text-muted-foreground">
              {REPORT_FLOW_TEXT.stepOf(index + 1, REPORT_FLOW_STEPS.length)}
            </span>
          </div>
        </Progress>
      </div>

      {state.step === "photos" && (
        <PhotoStep
          existing={state.photos.length}
          notice={state.notice}
          onPick={(source: PhotoSource) => {
            dispatch({ type: "pick", source })
            startGeolocation()
          }}
          onPhotos={onPhotos}
          onNotice={(notice) => dispatch({ type: "notice", notice })}
        />
      )}
      {state.step === "location" && (
        <LocationStep
          state={state}
          onRetryUpload={upload}
          onConfirm={(point) => dispatch({ type: "confirm", point })}
        />
      )}
      {state.step === "confirmed" && state.confirmed && (
        <ConfirmedStep
          point={state.confirmed}
          photos={state.photos}
          onEdit={() => dispatch({ type: "editLocation" })}
        />
      )}
    </div>
  )
}
