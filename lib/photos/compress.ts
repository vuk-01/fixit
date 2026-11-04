// Client-side compression (Tech.md §5, FR-2): one decoded bitmap, two JPEG versions, no EXIF.
// createImageBitmap applies the EXIF orientation, so the pixels are upright; drawing to a
// canvas and re-encoding drops every metadata block (GPS, camera model).
import { PHOTO_FULL_MAX_PX, PHOTO_JPEG_QUALITY, PHOTO_MODEL_MAX_PX } from "@/lib/constants"

export class UnsupportedPhotoError extends Error {
  constructor() {
    super("unsupported_photo")
  }
}

// size that fits within max px on the longer side, never upscaled
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

async function encode(bitmap: ImageBitmap, max: number): Promise<Blob> {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, max)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new UnsupportedPhotoError()
  context.drawImage(bitmap, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", PHOTO_JPEG_QUALITY),
  )
  if (!blob) throw new UnsupportedPhotoError()
  return blob
}

export type CompressedPhoto = {
  full: Blob // 1600 px: Storage, letter attachment, public page
  model: Blob // 1024 px: only for the model, never stored
}

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    // e.g. HEIC on Android: the browser cannot decode it
    throw new UnsupportedPhotoError()
  }
  try {
    return {
      full: await encode(bitmap, PHOTO_FULL_MAX_PX),
      model: await encode(bitmap, PHOTO_MODEL_MAX_PX),
    }
  } finally {
    bitmap.close()
  }
}
