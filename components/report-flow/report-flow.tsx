"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"

import { addReportPhoto, type SendReportResult } from "@/app/prijavi/actions"

import { GEOLOCATION_OPTIONS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"

import {
  canSend,
  currentPrepare,
  draftId,
  duplicateNotice,
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
import { DuplicateStep } from "./duplicate-step"
import { FlowSteps } from "./flow-steps"
import { LocationStep } from "./location-step"
import { PhotoStep } from "./photo-step"
import { runPrepare } from "./prepare-client"
import { ReviewStep, type ReviewAccount } from "./review-step"
import { SentStep } from "./sent-step"
import { createStepPacer } from "./step-pacer"

const STEP_INDEX: Record<FlowStep, number> = { photos: 0, location: 1, confirmed: 2 }

// The report wizard (UI.md v2): photo → location → "Pregled prijave" → "Prijava poslata". One
// primary button per step. `account` is the signed-in citizen's name, for "Dostavi moje ime i mejl
// instituciji" (never the email: the account's email is not shown in the UI, ticket #11).
// "Nova prijava" starts a fresh flow by mounting it again (all state, refs and photos reset).
export function ReportFlow({ account }: { account: ReviewAccount }) {
  const [run, setRun] = useState(0)
  return <Flow key={run} account={account} onNewReport={() => setRun((n) => n + 1)} />
}

function Flow({ account, onNewReport }: { account: ReviewAccount; onNewReport: () => void }) {
  const [state, dispatch] = useReducer(flowReducer, initialFlowState)
  const [sent, setSent] = useState<Extract<SendReportResult, { ok: true }> | null>(null)
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

  // FR-2: the 1600 px version goes straight from the browser to Storage, in the background.
  // A photo added on the review (#11) is then saved to the draft with add_report_photo; a retry
  // skips the upload that already worked (the bucket refuses the same path twice).
  const stored = useRef(new Set<string>())
  const stateForUpload = useRef(state)
  useEffect(() => {
    stateForUpload.current = state
  }, [state])
  const upload = useCallback(async (photo: FlowPhoto) => {
    dispatch({ type: "upload", id: photo.id, status: "uploading" })
    if (!stored.current.has(photo.path)) {
      const { error } = await createClient()
        .storage.from("report-photos")
        .upload(photo.path, photo.full, { contentType: "image/jpeg", upsert: false })
      if (error) {
        dispatch({ type: "upload", id: photo.id, status: "failed" })
        return
      }
      stored.current.add(photo.path)
    }
    if (photo.origin === "added") {
      const reportId = draftId(stateForUpload.current.analysis)
      const saved = reportId ? await addReportPhoto({ reportId, path: photo.path }).catch(() => null) : null
      if (!saved?.ok) {
        dispatch({ type: "upload", id: photo.id, status: "failed" })
        if (saved) dispatch({ type: "notice", notice: saved.error })
        return
      }
    }
    dispatch({ type: "upload", id: photo.id, status: "done" })
  }, [])

  // "Dodaj fotografiju" on the review: no new model call (FR-5), only the attachment and the page
  const onAddPhotos = useCallback(
    (photos: FlowPhoto[], notice: string | null) => {
      dispatch({ type: "photosAdded", photos, notice })
      for (const photo of photos) void upload(photo)
    },
    [upload],
  )

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
    // the first prepare shows its steps one by one (ticket #32); a new category on the review
    // has no steps on the screen, so its result is not held back
    const pacer = stateRef.current.reviewOpened ? null : createStepPacer(dispatch)
    controller.signal.addEventListener("abort", () => pacer?.cancel(), { once: true })
    void runPrepare(inputFromKey(key), key, pacer?.dispatch ?? dispatch, controller.signal)
  }, [key, due])
  useEffect(() => () => running.current?.abort(), [])

  const prepare = currentPrepare(state)
  const duplicate = shownDuplicate(state)
  const notice = duplicateNotice(state)
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
    // one centred column (max-w-2xl) with side borders on a tablet or laptop instead of a
    // stretched phone screen; on a phone it is the full width as before (#32)
    <div className="mx-auto flex h-[calc(100svh-var(--header-height))] w-full max-w-2xl flex-col bg-ground md:border-x">
      <FlowSteps index={index} />

      {sent && <SentStep sent={sent} onNewReport={onNewReport} />}
      {!sent && state.step === "photos" && (
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
      {!sent && state.step === "location" && (
        <LocationStep
          state={state}
          onRetryUpload={upload}
          onRetryAnalysis={classify}
          onConfirm={(point) => dispatch({ type: "confirm", point })}
          initialError={locationError(state)}
          cancel={cancel}
        />
      )}
      {!sent && showCategories && (
        <CategoryStep
          analysis={state.analysis}
          changing={state.reviewOpened}
          onChoose={(category) => dispatch({ type: "chooseCategory", category })}
          cancel={cancel}
        />
      )}
      {!sent && state.step === "confirmed" && !showCategories && duplicate && reportId && (
        <DuplicateStep
          duplicate={duplicate}
          draftId={reportId}
          onSendNew={() => dispatch({ type: "dismissDuplicate", id: duplicate.id })}
          cancel={cancel}
        />
      )}
      {!sent && state.step === "confirmed" && state.confirmed && !showCategories && !duplicate && (
        <ReviewStep
          state={state}
          account={account}
          steps={visibleSteps(state)}
          prepare={prepare}
          duplicate={notice}
          canSend={canSend(state)}
          noDraft={noDraft}
          dispatch={dispatch}
          onRetryAnalysis={classify}
          onRetryUpload={upload}
          onAddPhotos={onAddPhotos}
          onSent={setSent}
          cancel={cancel}
        />
      )}
    </div>
  )
}
