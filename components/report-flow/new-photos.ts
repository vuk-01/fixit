// Picked files → flow photos (FR-2, Tech.md §5): compressed on the client into the 1600 px
// version (stored) and the 1024 px one (model), each with a fresh `<uuid>.jpg` path. Shared by
// the photo step and "Dodaj fotografiju" on the review.

import { MAX_PHOTOS_PER_REPORT, REPORT_FLOW_TEXT } from "@/lib/constants"
import { compressPhoto, UnsupportedPhotoError } from "@/lib/photos/compress"

import type { FlowPhoto } from "./flow-state"

export async function preparePhotos(
  files: File[],
  existing: number,
  origin: FlowPhoto["origin"],
): Promise<{ photos: FlowPhoto[]; notice: string | null }> {
  const room = Math.max(0, MAX_PHOTOS_PER_REPORT - existing)
  let notice: string | null = files.length > room ? REPORT_FLOW_TEXT.tooManyPhotos : null
  const photos: FlowPhoto[] = []
  for (const file of files.slice(0, room)) {
    try {
      const { full, model } = await compressPhoto(file)
      const id = crypto.randomUUID()
      photos.push({ id, path: `${id}.jpg`, previewUrl: URL.createObjectURL(full), full, model, upload: "uploading", origin })
    } catch (error) {
      if (!(error instanceof UnsupportedPhotoError)) throw error
      notice = REPORT_FLOW_TEXT.unsupportedPhoto
    }
  }
  return { photos, notice }
}
