"use client"

import { Camera, CircleAlert, ImageUp, LoaderCircle, Plus, X } from "lucide-react"
import { useRef, useState } from "react"

import { removeReportPhoto } from "@/app/prijavi/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MAX_PHOTOS_PER_REPORT, REPORT_FLOW_TEXT, REVIEW_TEXT, UNKNOWN_ERROR_MESSAGE } from "@/lib/constants"

import type { FlowPhoto } from "./flow-state"
import { preparePhotos } from "./new-photos"

// Photos on the review (FR-2, FR-11): "Dodaj fotografiju" ("Fotografiši" / "Iz galerije", the
// same compression and upload as on the first step) while there are fewer than 3, and "Ukloni"
// on every photo but the last one. A photo the model marked gets the §6 note, without a tap.
export function ReviewPhotos({
  photos,
  flagged,
  reportId,
  notice,
  onAdd,
  onNotice,
  onRemoved,
  onRetry,
}: {
  photos: FlowPhoto[]
  flagged: string[]
  reportId: string
  notice: string | null
  onAdd: (photos: FlowPhoto[], notice: string | null) => void
  onNotice: (notice: string | null) => void
  onRemoved: (id: string) => void
  onRetry: (photo: FlowPhoto) => void
}) {
  const cameraInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)
  const [choosing, setChoosing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canAdd = photos.length < MAX_PHOTOS_PER_REPORT
  const canRemove = photos.length > 1

  const handleFiles = async (input: HTMLInputElement) => {
    const files = Array.from(input.files ?? [])
    input.value = ""
    if (files.length === 0) return
    setChoosing(false)
    setBusy(true)
    const prepared = await preparePhotos(files, photos.length, "added")
    setBusy(false)
    if (prepared.photos.length > 0) onAdd(prepared.photos, prepared.notice)
    else onNotice(prepared.notice)
  }

  const remove = async (photo: FlowPhoto) => {
    setRemoving(photo.id)
    setError(null)
    const result = await removeReportPhoto({ reportId, path: photo.path }).catch(() => null)
    setRemoving(null)
    if (!result || !result.ok) {
      setError(result ? result.error : UNKNOWN_ERROR_MESSAGE)
      return
    }
    URL.revokeObjectURL(photo.previewUrl)
    onRemoved(photo.id)
  }

  const flaggedShown = photos.some((p) => flagged.includes(p.id))

  return (
    <Card data-testid="review-photos">
      <CardContent className="flex flex-col gap-3 text-sm">
        <h2 className="font-medium">{REVIEW_TEXT.photosTitle(photos.length)}</h2>
        <ul className="flex flex-wrap gap-3">
          {photos.map((photo, i) => (
            <li key={photo.id} className="relative flex flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
              <img
                src={photo.previewUrl}
                alt={REPORT_FLOW_TEXT.photoAlt(i + 1)}
                className={`size-20 rounded-xl object-cover ring-1 ${flagged.includes(photo.id) ? "ring-2 ring-status-in-progress" : "ring-foreground/10"}`}
              />
              {canRemove && photo.upload === "done" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-3 -right-3 size-11 rounded-full"
                  aria-label={REVIEW_TEXT.removePhoto(i + 1)}
                  disabled={removing !== null}
                  onClick={() => void remove(photo)}
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-background shadow ring-1 ring-foreground/20">
                    {removing === photo.id ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : <X aria-hidden className="size-4" />}
                  </span>
                </Button>
              )}
              {photo.upload === "uploading" && (
                <span className="flex items-center" role="status">
                  <LoaderCircle aria-hidden className="size-4 animate-spin text-muted-foreground" />
                  <span className="sr-only">{REPORT_FLOW_TEXT.uploading}</span>
                </span>
              )}
              {photo.upload === "failed" && (
                <Button variant="ghost" size="sm" className="h-11 px-1 text-xs text-destructive" onClick={() => onRetry(photo)}>
                  <CircleAlert aria-hidden className="size-4" />
                  {REPORT_FLOW_TEXT.retryUpload}
                </Button>
              )}
            </li>
          ))}
          {canAdd && (
            <li>
              <Button
                variant="outline"
                className="size-20 flex-col gap-1 rounded-xl px-1 text-xs whitespace-normal"
                aria-expanded={choosing}
                disabled={busy}
                onClick={() => setChoosing((v) => !v)}
              >
                {busy ? <LoaderCircle aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
                {REVIEW_TEXT.addPhoto}
              </Button>
            </li>
          )}
        </ul>
        {choosing && canAdd && (
          <div className="grid grid-cols-2 gap-2">
            <Button className="h-11" onClick={() => cameraInput.current?.click()}>
              <Camera aria-hidden />
              {REPORT_FLOW_TEXT.takePhoto}
            </Button>
            <Button variant="outline" className="h-11" onClick={() => galleryInput.current?.click()}>
              <ImageUp aria-hidden />
              {REPORT_FLOW_TEXT.fromGallery}
            </Button>
          </div>
        )}
        {flaggedShown && (
          <p className="flex items-start gap-2" data-testid="flagged-note">
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-status-in-progress" />
            {REVIEW_TEXT.flaggedPhoto}
          </p>
        )}
        {(notice || error) && (
          <p className="text-destructive" role="alert">
            {error ?? notice}
          </p>
        )}
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          data-testid="review-camera-input"
          onChange={(e) => void handleFiles(e.currentTarget)}
        />
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          data-testid="review-gallery-input"
          onChange={(e) => void handleFiles(e.currentTarget)}
        />
      </CardContent>
    </Card>
  )
}
