"use client"

import { MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CATEGORIES, CLASSIFY_TEXT, REPORT_FLOW_TEXT, type ReportCategory } from "@/lib/constants"

import { AnalysisBanner } from "./analysis-banner"
import type { Analysis, ConfirmedPoint, FlowPhoto } from "./flow-state"
import { PhotoStrip } from "./photo-strip"

// After "Potvrdi lokaciju": waits for the analysis if it still runs (FR-5 step 3), then shows
// the category and the model's description. #10 (agent steps) and #11 (review) continue here.
export function ConfirmedStep({
  point,
  photos,
  analysis,
  category,
  description,
  onEdit,
  onChangeCategory,
  onRetry,
  cancel,
}: {
  point: ConfirmedPoint
  photos: FlowPhoto[]
  analysis: Analysis
  category: ReportCategory | null
  description: string
  onEdit: () => void
  onChangeCategory: () => void
  onRetry: () => void
  cancel: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {!category && <AnalysisBanner analysis={analysis} onRetry={onRetry} />}
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="font-heading text-xl">{REPORT_FLOW_TEXT.confirmedTitle}</h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="flex items-start gap-2">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <span data-testid="confirmed-address">
                {point.address ?? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`}
              </span>
            </p>
            <PhotoStrip photos={photos} />
            {category && (
              <dl className="flex flex-col gap-3" data-testid="classification">
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">{CLASSIFY_TEXT.categoryLabel}</dt>
                  <dd className="flex flex-wrap items-center justify-between gap-2 font-medium">
                    <span data-testid="category">{CATEGORIES[category].label}</span>
                    <Button variant="link" className="h-11 px-0" onClick={onChangeCategory}>
                      {CLASSIFY_TEXT.changeCategory}
                    </Button>
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">{CLASSIFY_TEXT.descriptionLabel}</dt>
                  <dd data-testid="description">{description || CLASSIFY_TEXT.noDescription}</dd>
                </div>
              </dl>
            )}
            <p className="text-muted-foreground">{REPORT_FLOW_TEXT.confirmedNext}</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button size="lg" variant="outline" className="h-12 w-full text-base" onClick={onEdit}>
          {REPORT_FLOW_TEXT.changeLocation}
        </Button>
        {cancel}
      </div>
    </div>
  )
}
