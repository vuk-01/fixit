"use client"

import { useCallback, useEffect, useReducer, useRef } from "react"

import { Progress } from "@/components/ui/progress"
import { GEOLOCATION_OPTIONS, REPORT_FLOW_STEPS, REPORT_FLOW_TEXT } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"

import {
  currentPrepare,
  draftId,
  flowReducer,
  initialFlowState,
  inputFromKey,
  locationError,
  prepareDue,
  prepareInput,
  prepareKey,
  showCategoryPicker,
  shownDuplicate,
  visibleSteps,
  type FlowPhoto,
  type FlowStep,
  type PhotoSource,
} from "./flow-state"
import { CancelButton } from "./cancel-button"
import { CategoryStep } from "./category-step"
import { runClassification } from "./classify-client"
import { ConfirmedStep } from "./confirmed-step"
import { DuplicateStep } from "./duplicate-step"
import { LocationStep } from "./location-step"
import { PhotoStep } from "./photo-step"
import { runPrepare } from "./prepare-client"

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

  // Ticket #9: classify starts as soon as the first photos are back, in parallel with the
  // upload and the pin; only these photos go to the model (FR-5, one call per report).
  // `analysis` resolves with the draft id once the flow knows how to go on ("Odustani" waits).
  const analysis = useRef<Promise<string | null> | null>(null)
  const modelPhotos = useRef<FlowPhoto[]>([])
  const classify = useCallback(() => {
    analysis.current = runClassification(modelPhotos.current, dispatch)
  }, [])

  const onPhotos = useCallback(
    (photos: FlowPhoto[], notice: string | null) => {
      dispatch({ type: "photosAdded", photos, notice })
      for (const photo of photos) void upload(photo)
      if (!analysis.current && photos.length > 0) {
        modelPhotos.current = photos
        classify()
      }
    },
    [upload, classify],
  )

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  const draft = useCallback(async () => {
    const known = draftId(stateRef.current.analysis)
    if (known || !analysis.current) return known
    return analysis.current
  }, [])
  const cancel = <CancelButton draft={draft} photoPaths={state.photos.map((p) => p.path)} />

  const showCategories = showCategoryPicker(state)

  // Ticket #10: prepare starts once the pin is confirmed, the category is known and the draft
  // id is there (it waits for classify, at most until its 15 s limit), and again for a new
  // point or category. An older request is aborted; its late events are ignored by key.
  const input = prepareInput(state)
  const key = input ? prepareKey(input) : null
  const due = prepareDue(state, input)
  const running = useRef<AbortController | null>(null)
  useEffect(() => {
    if (!key || !due) return
    running.current?.abort()
    const controller = new AbortController()
    running.current = controller
    void runPrepare(inputFromKey(key), key, dispatch, controller.signal)
  }, [key, due])
  useEffect(() => () => running.current?.abort(), [])

  const prepare = currentPrepare(state)
  const duplicate = shownDuplicate(state)
  const reportId = draftId(state.analysis)
  // the category is known but the draft never came back (classify gave up and none was found)
  const noDraft =
    state.step === "confirmed" && !!state.category && !reportId && state.analysis.status !== "pending"

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
          onRetryAnalysis={classify}
          onConfirm={(point) => dispatch({ type: "confirm", point })}
          initialError={locationError(state)}
          cancel={cancel}
        />
      )}
      {showCategories && (
        <CategoryStep
          analysis={state.analysis}
          onChoose={(category) => dispatch({ type: "chooseCategory", category })}
          cancel={cancel}
        />
      )}
      {state.step === "confirmed" && !showCategories && duplicate && reportId && (
        <DuplicateStep
          duplicate={duplicate}
          draftId={reportId}
          onSendNew={() => dispatch({ type: "dismissDuplicate", id: duplicate.id })}
          cancel={cancel}
        />
      )}
      {state.step === "confirmed" && state.confirmed && !showCategories && !duplicate && (
        <ConfirmedStep
          point={state.confirmed}
          photos={state.photos}
          analysis={state.analysis}
          category={state.category}
          description={state.description}
          steps={visibleSteps(state)}
          prepare={prepare}
          noDraft={noDraft}
          onEdit={() => dispatch({ type: "editLocation" })}
          onChangeCategory={() => dispatch({ type: "changeCategory" })}
          onRetry={classify}
          onRetryPrepare={() => dispatch({ type: "prepareRetry" })}
          cancel={cancel}
        />
      )}
    </div>
  )
}
