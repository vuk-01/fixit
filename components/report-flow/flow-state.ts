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

import type { ClassificationForClient, ClassifyErrorCode, FallbackReason } from "@/lib/agent/schema"
import { CONFIDENCE_THRESHOLD, type ReportCategory } from "@/lib/constants"

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
  }
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
