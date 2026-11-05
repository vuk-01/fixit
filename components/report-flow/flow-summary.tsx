"use client"

import { cn } from "cn"
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CATEGORIES, CLASSIFY_TEXT, REPORT_FLOW_TEXT, type ReportCategory } from "@/lib/constants"

import { needsCategoryChoice, type Analysis, type FlowPhoto } from "./flow-state"
import { FLOW_CARD } from "./flow-styles"

// The report being made, shaped like a report in the list (UI.md "Report card", ticket 32 variant B):
// the first photo on the left (80 px, square inner corners, „+n" when there are more), and on the
// right the analysis state, the type of problem and the upload state of the photos. Steps 2 and 3
// show it above their own content. A failed analysis is not here: the step shows `AnalysisBanner`.
export function FlowSummary({
  photos,
  analysis,
  category,
  onRetryUpload,
}: {
  photos: FlowPhoto[]
  analysis: Analysis
  // the chosen type, when there is one (it can differ from the model's after „Promijeni")
  category: ReportCategory | null
  onRetryUpload: (photo: FlowPhoto) => void
}) {
  const first = photos[0]
  const more = photos.length - 1
  const recognized = analysis.status === "done" && !needsCategoryChoice(analysis) ? analysis.result.category : null
  const shown = category ?? recognized

  return (
    <Card className={cn(FLOW_CARD, "min-h-20 flex-row items-stretch gap-0 p-0")} data-testid="flow-summary">
      {first && (
        <div className="relative w-20 shrink-0 self-stretch bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
          <img
            src={first.previewUrl}
            alt={REPORT_FLOW_TEXT.photoAlt(1)}
            className="absolute inset-0 size-full rounded-none! object-cover"
          />
          {more > 0 && (
            <span className="absolute right-1.5 bottom-1.5 rounded-md bg-primary px-1.5 py-0.5 font-mono text-xs leading-none font-semibold text-primary-foreground">
              +{more}
            </span>
          )}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3">
        <AnalysisLine analysis={analysis} recognized={recognized !== null && shown === recognized} />
        {shown && (
          <p className="text-[15.5px] leading-snug font-bold" data-testid="summary-category">
            {CATEGORIES[shown].label}
          </p>
        )}
        <UploadLine photos={photos} onRetry={onRetryUpload} />
      </div>
    </Card>
  )
}

const LINE = "flex items-center gap-1.5 text-[13px] text-muted-foreground"

function AnalysisLine({ analysis, recognized }: { analysis: Analysis; recognized: boolean }) {
  if (analysis.status === "pending") {
    return (
      <p className={LINE} role="status" aria-live="polite" data-testid="analysis-banner">
        <LoaderCircle aria-hidden className="size-4 shrink-0 animate-spin text-primary" />
        {CLASSIFY_TEXT.analyzing}
      </p>
    )
  }
  if (analysis.status === "fallback") {
    return (
      <p className={LINE} role="status" aria-live="polite" data-testid="analysis-banner">
        <CircleAlert aria-hidden className="size-4 shrink-0" />
        {CLASSIFY_TEXT.failed}
      </p>
    )
  }
  if (recognized) {
    return (
      <p className={LINE} role="status" aria-live="polite" data-testid="analysis-banner">
        <CircleCheck aria-hidden className="size-4 shrink-0 text-status-resolved" />
        {CLASSIFY_TEXT.recognizedLabel}
      </p>
    )
  }
  return null
}

// background upload of the photos (DB.md §10): a spinner while any is on its way, a retry button
// for each one that failed, nothing once all are stored
function UploadLine({ photos, onRetry }: { photos: FlowPhoto[]; onRetry: (photo: FlowPhoto) => void }) {
  const failed = photos.filter((p) => p.upload === "failed")
  if (failed.length > 0) {
    return (
      <div className="flex flex-wrap gap-x-3">
        {failed.map((photo) => (
          <Button
            key={photo.id}
            variant="ghost"
            size="sm"
            className="h-11 px-1 text-[13px] text-destructive"
            onClick={() => onRetry(photo)}
            aria-label={`${REPORT_FLOW_TEXT.uploadFailed} ${REPORT_FLOW_TEXT.retryUpload}`}
          >
            <CircleAlert aria-hidden className="size-4" />
            {REPORT_FLOW_TEXT.retryUpload}
          </Button>
        ))}
      </div>
    )
  }
  if (photos.some((p) => p.upload === "uploading")) {
    return (
      <p className={LINE} role="status">
        <LoaderCircle aria-hidden className="size-4 shrink-0 animate-spin" />
        {REPORT_FLOW_TEXT.uploading}
      </p>
    )
  }
  return <span className="sr-only">{REPORT_FLOW_TEXT.uploaded}</span>
}
