"use client"

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { REPORT_FLOW_TEXT } from "@/lib/constants"

import type { FlowPhoto } from "./flow-state"

// Thumbnails from the local blob (the bucket is never read by the client, DB.md §10),
// with the background upload status.
export function PhotoStrip({ photos, onRetry }: { photos: FlowPhoto[]; onRetry?: (photo: FlowPhoto) => void }) {
  return (
    <ul className="flex gap-2">
      {photos.map((photo, i) => (
        <li key={photo.id} className="flex flex-col items-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
          <img
            src={photo.previewUrl}
            alt={REPORT_FLOW_TEXT.photoAlt(i + 1)}
            className="size-14 rounded-lg object-cover ring-1 ring-foreground/10"
          />
          <UploadState photo={photo} onRetry={onRetry} />
        </li>
      ))}
    </ul>
  )
}

function UploadState({ photo, onRetry }: { photo: FlowPhoto; onRetry?: (photo: FlowPhoto) => void }) {
  if (photo.upload === "done") {
    return (
      <span className="flex items-center">
        <CircleCheck aria-hidden className="size-4 text-status-resolved" />
        <span className="sr-only">{REPORT_FLOW_TEXT.uploaded}</span>
      </span>
    )
  }
  if (photo.upload === "uploading") {
    return (
      <span className="flex items-center" role="status">
        <LoaderCircle aria-hidden className="size-4 animate-spin text-muted-foreground" />
        <span className="sr-only">{REPORT_FLOW_TEXT.uploading}</span>
      </span>
    )
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-11 px-1 text-xs text-destructive"
      onClick={() => onRetry?.(photo)}
      aria-label={`${REPORT_FLOW_TEXT.uploadFailed} ${REPORT_FLOW_TEXT.retryUpload}`}
    >
      <CircleAlert aria-hidden className="size-4" />
      {REPORT_FLOW_TEXT.retryUpload}
    </Button>
  )
}
