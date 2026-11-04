// State of the report flow on /prijavi (FR-2, FR-3, FR-5). Kept in the browser for the whole
// wizard; nothing here is written to a table by the client (DB.md §9).
//
// Hand-off to ticket #9 (classify): `photos[].model` are the 1024 px versions for the model,
// `photos[].path` the Storage paths of the 1600 px versions (`<uuid>.jpg`, chosen before the
// upload, so classify can start in parallel), `photos[].upload` their upload status. Ticket
// #10 (prepare) starts from `confirmed` (the pin the citizen confirmed inside Podgorica).
//
// Ticket #9: `analysis` is the classify request (draft + recognition); `category` the category
// the flow continues with (from the model, or picked by the citizen, FR-7) and `description`
// the model's description (empty in the manual flow). #10/#11 continue from these.
//
// Ticket #10: `prepare` is the prepare request (jurisdiction, duplicates, letter) for the
// current draft, point and category; `key` tells which input a state belongs to, so a late
// event of an older request is ignored and a new point or category starts a new request.

import type { ClassificationForClient, ClassifyErrorCode, FallbackReason } from "@/lib/agent/schema"
import type { PrepareErrorCode, PrepareResult, StepStatus } from "@/lib/agent/steps"
import { CONFIDENCE_THRESHOLD, ERROR_MESSAGES, PREPARE_STEPS, type PrepareStep, type ReportCategory } from "@/lib/constants"

export type UploadStatus = "uploading" | "done" | "failed"

export type FlowPhoto = {
  id: string // the uuid of the Storage path
  path: string // `${id}.jpg` in bucket report-photos
  previewUrl: string // object URL of `full`, for thumbnails
  full: Blob // 1600 px JPEG, uploaded
  model: Blob // 1024 px JPEG, only for the model (#9), never stored
  upload: UploadStatus
}

export type PhotoSource = "camera" | "gallery"

export type DeviceLocation =
  | { status: "idle" | "pending" | "unavailable" }
  | { status: "found"; lat: number; lng: number; accuracy: number }

export type ConfirmedPoint = { lat: number; lng: number; address: string | null }

export type FlowStep = "photos" | "location" | "confirmed"

// reason "client_timeout": the client stopped waiting after 15 s (Tech.md §6)
export type Analysis =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "done"; reportId: string; result: ClassificationForClient }
  | { status: "fallback"; reportId: string | null; reason: FallbackReason | "client_timeout" }
  | { status: "error"; code: ClassifyErrorCode } // no draft was made

export type CategorySource = "ai" | "citizen"

export type PrepareStepState = "waiting" | StepStatus
export type PrepareSteps = Record<PrepareStep, PrepareStepState>

export type Prepare =
  | { status: "idle" }
  | { status: "running"; key: string; steps: PrepareSteps }
  | { status: "done"; key: string; steps: PrepareSteps; result: PrepareResult }
  | { status: "error"; key: string; steps: PrepareSteps; code: PrepareErrorCode }

export type PrepareInput = { reportId: string; lat: number; lng: number; category: ReportCategory }

export type FlowState = {
  step: FlowStep
  source: PhotoSource | null // what the first photo came from (FR-3: gallery → check the pin)
  photos: FlowPhoto[]
  notice: string | null
  device: DeviceLocation
  confirmed: ConfirmedPoint | null
  analysis: Analysis
  category: ReportCategory | null
  categorySource: CategorySource | null
  description: string
  prepare: Prepare
  // FR-9: the duplicate the citizen answered with "Ipak pošalji novu"
  dismissedDuplicate: string | null
}

export const initialFlowState: FlowState = {
  step: "photos",
  source: null,
  photos: [],
  notice: null,
  device: { status: "idle" },
  confirmed: null,
  analysis: { status: "idle" },
  category: null,
  categorySource: null,
  description: "",
  prepare: { status: "idle" },
  dismissedDuplicate: null,
}

export type FlowAction =
  | { type: "pick"; source: PhotoSource }
  | { type: "photosAdded"; photos: FlowPhoto[]; notice: string | null }
  | { type: "notice"; notice: string | null }
  | { type: "upload"; id: string; status: UploadStatus }
  | { type: "device"; device: DeviceLocation }
  | { type: "confirm"; point: ConfirmedPoint }
  | { type: "editLocation" }
  | { type: "analysisStarted" }
  | { type: "analysisDone"; reportId: string; result: ClassificationForClient }
  | { type: "analysisFallback"; reportId: string | null; reason: FallbackReason | "client_timeout" }
  | { type: "analysisError"; code: ClassifyErrorCode }
  | { type: "draftFound"; reportId: string }
  | { type: "chooseCategory"; category: ReportCategory }
  | { type: "changeCategory" }
  | { type: "prepareStarted"; key: string }
  | { type: "prepareStep"; key: string; step: PrepareStep; status: StepStatus }
  | { type: "prepareDone"; key: string; result: PrepareResult }
  | { type: "prepareError"; key: string; code: PrepareErrorCode }
  | { type: "prepareRetry" }
  | { type: "dismissDuplicate"; id: string }

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "pick":
      return { ...state, source: state.source ?? action.source, notice: null }
    case "photosAdded":
      return {
        ...state,
        photos: [...state.photos, ...action.photos],
        notice: action.notice,
        // FR-2: no separate photo screen; straight to the location once a photo is in
        step: state.step === "photos" && action.photos.length > 0 ? "location" : state.step,
      }
    case "notice":
      return { ...state, notice: action.notice }
    case "upload":
      return {
        ...state,
        photos: state.photos.map((p) => (p.id === action.id ? { ...p, upload: action.status } : p)),
      }
    case "device":
      // a late "unavailable" never overwrites a position that already arrived
      if (state.device.status === "found" && action.device.status !== "found") return state
      return { ...state, device: action.device }
    case "confirm":
      return { ...state, confirmed: action.point, step: "confirmed", notice: null }
    case "editLocation":
      return { ...state, step: "location" }
    case "analysisStarted":
      return { ...state, analysis: { status: "pending" } }
    case "analysisDone": {
      // a late answer never replaces the manual flow (FR-7)
      if (state.analysis.status !== "pending") return state
      const analysis: Analysis = { status: "done", reportId: action.reportId, result: action.result }
      const confident = !needsCategoryChoice(analysis)
      return {
        ...state,
        analysis,
        // FR-7: the model's description stays even when the citizen picks the category
        description: action.result.description,
        category: confident ? action.result.category : state.category,
        categorySource: confident ? "ai" : state.categorySource,
      }
    }
    case "analysisFallback":
      if (state.analysis.status !== "pending") return state
      return { ...state, analysis: { status: "fallback", reportId: action.reportId, reason: action.reason } }
    case "analysisError":
      if (state.analysis.status !== "pending") return state
      return { ...state, analysis: { status: "error", code: action.code } }
    case "draftFound":
      if (state.analysis.status !== "fallback" || state.analysis.reportId) return state
      return { ...state, analysis: { ...state.analysis, reportId: action.reportId } }
    case "chooseCategory":
      return { ...state, category: action.category, categorySource: "citizen" }
    case "changeCategory":
      return { ...state, category: null, categorySource: null }
    case "prepareStarted":
      return { ...state, prepare: { status: "running", key: action.key, steps: waitingSteps() } }
    case "prepareStep":
      if (state.prepare.status !== "running" || state.prepare.key !== action.key) return state
      return {
        ...state,
        prepare: { ...state.prepare, steps: { ...state.prepare.steps, [action.step]: action.status } },
      }
    case "prepareDone":
      if (state.prepare.status !== "running" || state.prepare.key !== action.key) return state
      return { ...state, prepare: { status: "done", key: action.key, steps: state.prepare.steps, result: action.result } }
    case "prepareError": {
      if (state.prepare.status !== "running" || state.prepare.key !== action.key) return state
      const prepare: Prepare = { status: "error", key: action.key, steps: state.prepare.steps, code: action.code }
      // FR-4: outside Podgorica the citizen goes back to the map, which shows the message
      // (locationError) under the pin until the map moves
      if (action.code === "outside_area") return { ...state, prepare, step: "location" }
      return { ...state, prepare }
    }
    case "prepareRetry":
      return { ...state, prepare: { status: "idle" } }
    case "dismissDuplicate":
      return { ...state, dismissedDuplicate: action.id }
  }
}

// the FR-4 message on the map after prepare refused the point (the second lock, Tech.md §6)
export function locationError(state: Pick<FlowState, "step" | "prepare">): string | null {
  if (state.step !== "location" || state.prepare.status !== "error") return null
  return state.prepare.code === "outside_area" ? ERROR_MESSAGES.outside_area : null
}

export function waitingSteps(): PrepareSteps {
  return Object.fromEntries(PREPARE_STEPS.map((step) => [step, "waiting"])) as PrepareSteps
}

// The prepare input once the pin is confirmed, the category is known and the draft id is
// known (Tech.md §6, point 2); null while one of them is missing.
export function prepareInput(
  state: Pick<FlowState, "step" | "confirmed" | "category" | "analysis">,
): PrepareInput | null {
  const reportId = draftId(state.analysis)
  if (state.step !== "confirmed" || !state.confirmed || !state.category || !reportId) return null
  return { reportId, lat: state.confirmed.lat, lng: state.confirmed.lng, category: state.category }
}

// the key is the input itself, so an effect can depend on a string and still get the input back
export function prepareKey(input: PrepareInput): string {
  const { reportId, lat, lng, category } = input
  return JSON.stringify({ reportId, lat, lng, category })
}

export function inputFromKey(key: string): PrepareInput {
  return JSON.parse(key) as PrepareInput
}

// a request is due when there is an input and no request (or only an older one) for it
export function prepareDue(state: Pick<FlowState, "prepare">, input: PrepareInput | null): boolean {
  if (!input) return false
  return state.prepare.status === "idle" || state.prepare.key !== prepareKey(input)
}

// The steps on the screen (FR-5 step 3): while the analysis still runs, or the request is about
// to start, the first step already shows as running.
export function visibleSteps(
  state: Pick<FlowState, "step" | "confirmed" | "category" | "analysis" | "prepare">,
): PrepareSteps {
  const input = prepareInput(state)
  if (input && state.prepare.status !== "idle" && state.prepare.key === prepareKey(input)) return state.prepare.steps
  const steps = waitingSteps()
  if (input || state.analysis.status === "pending") steps.jurisdiction = "started"
  return steps
}

// the result for the current input, if it has arrived
export function currentPrepare(state: Pick<FlowState, "step" | "confirmed" | "category" | "analysis" | "prepare">) {
  const input = prepareInput(state)
  if (!input || state.prepare.status === "idle" || state.prepare.key !== prepareKey(input)) return null
  return state.prepare
}

// FR-9: the duplicate screen shows until the citizen answers it
export function shownDuplicate(state: Pick<FlowState, "step" | "confirmed" | "category" | "analysis" | "prepare" | "dismissedDuplicate">) {
  const prepare = currentPrepare(state)
  if (prepare?.status !== "done" || !prepare.result.duplicate) return null
  return prepare.result.duplicate.id === state.dismissedDuplicate ? null : prepare.result.duplicate
}

// FR-7: manual category choice when the model failed or timed out, is not sure (below 0.6) or
// says it is not a municipal problem
export function needsCategoryChoice(analysis: Analysis): boolean {
  if (analysis.status === "fallback") return true
  if (analysis.status !== "done") return false
  return !analysis.result.is_municipal_problem || analysis.result.confidence < CONFIDENCE_THRESHOLD
}

// After the pin is confirmed: the picker shows when the analysis ended without a usable
// category (FR-7) or the citizen tapped "Promijeni vrstu"; while it still runs, the flow waits.
export function showCategoryPicker(state: Pick<FlowState, "step" | "category" | "analysis">): boolean {
  if (state.step !== "confirmed" || state.category !== null) return false
  return state.analysis.status === "done" || state.analysis.status === "fallback"
}

export function draftId(analysis: Analysis): string | null {
  return analysis.status === "done" || analysis.status === "fallback" ? analysis.reportId : null
}

// FR-3: the citizen is asked to check the pin when the fix is coarse or the photo is from the
// gallery (it may have been taken elsewhere); without any fix, the map starts in Podgorica.
export function locationHint(
  state: Pick<FlowState, "device" | "source">,
  lowAccuracyM: number,
): "unavailable" | "checkPin" | null {
  if (state.device.status === "unavailable") return "unavailable"
  if (state.device.status !== "found") return null
  if (state.source === "gallery" || state.device.accuracy > lowAccuracyM) return "checkPin"
  return null
}
