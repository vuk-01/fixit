"use client"

import { CircleAlert, FileText, Landmark, MapPin } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PrepareErrorCode, PrepareResult } from "@/lib/agent/steps"
import {
  CATEGORIES,
  CLASSIFY_TEXT,
  ERROR_MESSAGES,
  PREPARE_TEXT,
  REPORT_FLOW_TEXT,
  type ReportCategory,
} from "@/lib/constants"

import { AgentSteps } from "./agent-steps"
import { AnalysisBanner } from "./analysis-banner"
import type { Analysis, ConfirmedPoint, FlowPhoto, Prepare, PrepareSteps } from "./flow-state"
import { PhotoStrip } from "./photo-strip"

function prepareErrorText(code: PrepareErrorCode): string {
  if (code === "invalid_request" || code === "unknown") return PREPARE_TEXT.failed
  return ERROR_MESSAGES[code]
}

// After "Potvrdi lokaciju" (FR-5 step 3): the agent's steps live (while the analysis still
// runs, the first one already shows), then the recipient from the rules or the FR-8 message,
// and the letter ready for the review. The real review screen ("Pregled prijave") is #11.
export function ConfirmedStep({
  point,
  photos,
  analysis,
  category,
  description,
  steps,
  prepare,
  noDraft,
  onEdit,
  onChangeCategory,
  onRetry,
  onRetryPrepare,
  cancel,
}: {
  point: ConfirmedPoint
  photos: FlowPhoto[]
  analysis: Analysis
  category: ReportCategory | null
  description: string
  steps: PrepareSteps
  prepare: Exclude<Prepare, { status: "idle" }> | null
  noDraft: boolean
  onEdit: () => void
  onChangeCategory: () => void
  onRetry: () => void
  onRetryPrepare: () => void
  cancel: React.ReactNode
}) {
  const result = prepare?.status === "done" ? prepare.result : null
  const coordinates = `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
  const address = result ? (result.address ?? coordinates) : (point.address ?? coordinates)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* scroll area: its children must not shrink (Card has overflow-hidden and would clip
          its own text instead of letting this area scroll) */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 *:shrink-0">
        {!category && <AnalysisBanner analysis={analysis} onRetry={onRetry} />}
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="font-heading text-xl">{REPORT_FLOW_TEXT.confirmedTitle}</h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <p className="flex items-start gap-2">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                <span data-testid="confirmed-address">{address}</span>
              </p>
              {result && result.address === null && (
                <p className="text-muted-foreground" data-testid="coordinates-only">
                  {PREPARE_TEXT.coordinatesOnly}
                </p>
              )}
            </div>
            <AgentSteps steps={steps} />
            <PhotoStrip photos={photos} />
          </CardContent>
        </Card>

        {noDraft && (
          <Alert variant="destructive" data-testid="prepare-error">
            <CircleAlert aria-hidden />
            <AlertTitle>{PREPARE_TEXT.noDraft}</AlertTitle>
            <AlertDescription>
              <Button variant="outline" size="sm" className="mt-1 h-11" onClick={onRetry}>
                {PREPARE_TEXT.retry}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {prepare?.status === "error" && (
          <Alert variant="destructive" data-testid="prepare-error">
            <CircleAlert aria-hidden />
            <AlertTitle>{prepareErrorText(prepare.code)}</AlertTitle>
            <AlertDescription>
              <Button variant="outline" size="sm" className="mt-1 h-11" onClick={onRetryPrepare}>
                {PREPARE_TEXT.retry}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {category && (
          <Card>
            <CardContent className="text-sm">
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
            </CardContent>
          </Card>
        )}

        {result && <Recipient result={result} />}
        {result?.letter && <LetterPreview letter={result.letter} />}

        <p className="text-sm text-muted-foreground">{REPORT_FLOW_TEXT.confirmedNext}</p>
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

// FR-8: the recipient (and cc) from jurisdiction_rules, or the message that the administrator
// will choose one
function Recipient({ result }: { result: PrepareResult }) {
  const { institution, cc } = result.jurisdiction
  if (!institution) {
    return (
      <Alert data-testid="recipient" data-outcome={result.jurisdiction.outcome}>
        <Landmark aria-hidden className="text-muted-foreground" />
        <AlertDescription className="text-foreground">{PREPARE_TEXT.noRecipient}</AlertDescription>
      </Alert>
    )
  }
  return (
    <Card data-testid="recipient" data-outcome={result.jurisdiction.outcome}>
      <CardContent className="text-sm">
        <dl className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">{PREPARE_TEXT.recipientLabel}</dt>
            <dd className="flex items-start gap-2 font-medium">
              <Landmark aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <span data-testid="recipient-name">{institution.name}</span>
            </dd>
          </div>
          {cc && (
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{PREPARE_TEXT.ccLabel}</dt>
              <dd data-testid="cc-name">{cc.name}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}

function LetterPreview({ letter }: { letter: { subject: string; body: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <Card data-testid="letter">
      <CardContent className="flex flex-col gap-2 text-sm">
        <p className="flex items-start gap-2 font-medium">
          <FileText aria-hidden className="mt-0.5 size-4 shrink-0 text-status-resolved" />
          {PREPARE_TEXT.letterReady}
        </p>
        <Button
          variant="link"
          className="h-11 justify-start px-0"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? PREPARE_TEXT.hideLetter : PREPARE_TEXT.showLetter}
        </Button>
        {open && (
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3" data-testid="letter-text">
            <p className="font-medium">{letter.subject}</p>
            <p className="whitespace-pre-wrap break-words">{letter.body}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
