"use client"

import { Camera, ImageUp } from "lucide-react"
import Link from "next/link"
import { useRef, useState } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { REPORT_FLOW_TEXT } from "@/lib/constants"

import type { FlowPhoto, PhotoSource } from "./flow-state"
import { preparePhotos } from "./new-photos"

// Step 1 (FR-3): "Fotografiši" (camera) and "Iz galerije"; the button decides the source.
export function PhotoStep({
  existing,
  notice,
  onPick,
  onPhotos,
  onNotice,
}: {
  existing: number
  notice: string | null
  onPick: (source: PhotoSource) => void
  onPhotos: (photos: FlowPhoto[], notice: string | null) => void
  onNotice: (notice: string | null) => void
}) {
  const cameraInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const open = (source: PhotoSource) => {
    onPick(source)
    ;(source === "camera" ? cameraInput : galleryInput).current?.click()
  }

  const handleFiles = async (list: FileList | null, input: HTMLInputElement) => {
    const files = Array.from(list ?? [])
    input.value = "" // the same file can be picked again after an error
    if (files.length === 0) return

    setBusy(true)
    const { photos, notice: message } = await preparePhotos(files, existing, "initial")
    setBusy(false)

    if (photos.length > 0) onPhotos(photos, message)
    else onNotice(message)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="font-heading text-xl">{REPORT_FLOW_TEXT.photoTitle}</h1>
            </CardTitle>
            <CardDescription>{REPORT_FLOW_TEXT.photoDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button size="lg" className="h-12 text-base" disabled={busy} onClick={() => open("camera")}>
              <Camera aria-hidden />
              {REPORT_FLOW_TEXT.takePhoto}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 text-base"
              disabled={busy}
              onClick={() => open("gallery")}
            >
              <ImageUp aria-hidden />
              {REPORT_FLOW_TEXT.fromGallery}
            </Button>
            <p className="text-sm text-muted-foreground">{REPORT_FLOW_TEXT.privacyHint}</p>
            {busy && (
              <p className="text-sm" role="status">
                {REPORT_FLOW_TEXT.preparingPhotos}
              </p>
            )}
            {notice && (
              <p className="text-sm text-destructive" role="alert">
                {notice}
              </p>
            )}
          </CardContent>
        </Card>
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          data-testid="camera-input"
          onChange={(e) => void handleFiles(e.currentTarget.files, e.currentTarget)}
        />
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          data-testid="gallery-input"
          onChange={(e) => void handleFiles(e.currentTarget.files, e.currentTarget)}
        />
      </div>
      <div className="border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link href="/" className={buttonVariants({ variant: "ghost", className: "h-11 w-full" })}>
          {REPORT_FLOW_TEXT.cancel}
        </Link>
      </div>
    </div>
  )
}
