// State of the report flow on /prijavi (FR-2, FR-3, FR-5). Kept in the browser for the whole
// wizard; nothing here is written to a table by the client (DB.md §9).
//
// Hand-off to ticket #9 (classify): `photos[].model` are the 1024 px versions for the model,
// `photos[].path` the Storage paths of the 1600 px versions (`<uuid>.jpg`, chosen before the
// upload, so classify can start in parallel), `photos[].upload` their upload status. Ticket
// #10 (prepare) starts from `confirmed` (the pin the citizen confirmed inside Podgorica).

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

export type FlowState = {
  step: FlowStep
  source: PhotoSource | null // what the first photo came from (FR-3: gallery → check the pin)
  photos: FlowPhoto[]
  notice: string | null
  device: DeviceLocation
  confirmed: ConfirmedPoint | null
}

export const initialFlowState: FlowState = {
  step: "photos",
  source: null,
  photos: [],
  notice: null,
  device: { status: "idle" },
  confirmed: null,
}

export type FlowAction =
  | { type: "pick"; source: PhotoSource }
  | { type: "photosAdded"; photos: FlowPhoto[]; notice: string | null }
  | { type: "notice"; notice: string | null }
  | { type: "upload"; id: string; status: UploadStatus }
  | { type: "device"; device: DeviceLocation }
  | { type: "confirm"; point: ConfirmedPoint }
  | { type: "editLocation" }

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
  }
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
