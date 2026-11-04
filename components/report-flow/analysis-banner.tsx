"use client"

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CATEGORIES, CLASSIFY_TEXT, ERROR_MESSAGES, UNKNOWN_ERROR_MESSAGE } from "@/lib/constants"

import { needsCategoryChoice, type Analysis } from "./flow-state"

// The band on the location screen (FR-5 step 2, FR-7): the analysis runs while the citizen
// checks the pin. Not shown before it starts or when the model was not sure (the category
// picker after "Potvrdi lokaciju" says that itself).
export function AnalysisBanner({ analysis, onRetry }: { analysis: Analysis; onRetry?: () => void }) {
  if (analysis.status === "pending") {
    return (
      <Alert role="status" aria-live="polite" data-testid="analysis-banner">
        <LoaderCircle aria-hidden className="animate-spin text-primary" />
        <AlertTitle>{CLASSIFY_TEXT.analyzing}</AlertTitle>
      </Alert>
    )
  }

  if (analysis.status === "fallback") {
    return (
      <Alert role="status" aria-live="polite" data-testid="analysis-banner">
        <CircleAlert aria-hidden className="text-muted-foreground" />
        <AlertTitle>{CLASSIFY_TEXT.failed}</AlertTitle>
      </Alert>
    )
  }

  if (analysis.status === "done" && !needsCategoryChoice(analysis)) {
    return (
      <Alert role="status" aria-live="polite" data-testid="analysis-banner">
        <CircleCheck aria-hidden className="text-status-resolved" />
        <AlertTitle>{CLASSIFY_TEXT.recognized(CATEGORIES[analysis.result.category].label)}</AlertTitle>
      </Alert>
    )
  }

  if (analysis.status === "error") {
    const blocking = analysis.code !== "unknown" && analysis.code !== "invalid_request"
    return (
      <Alert variant="destructive" data-testid="analysis-banner">
        <CircleAlert aria-hidden />
        <AlertTitle>
          {analysis.code === "invalid_request" || analysis.code === "unknown"
            ? UNKNOWN_ERROR_MESSAGE
            : ERROR_MESSAGES[analysis.code]}
        </AlertTitle>
        {!blocking && onRetry && (
          <AlertDescription>
            <Button variant="outline" size="sm" className="mt-1 h-11" onClick={onRetry}>
              {CLASSIFY_TEXT.retry}
            </Button>
          </AlertDescription>
        )}
      </Alert>
    )
  }

  return null
}

// a draft cannot be made (daily limit, not a citizen, signed out): the flow cannot go on
export function analysisBlocksFlow(analysis: Analysis): boolean {
  return analysis.status === "error"
}
