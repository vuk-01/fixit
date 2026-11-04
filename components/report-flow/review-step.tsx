"use client"

import { CircleAlert, FileText, Landmark, MapPin, Send, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import { sendReport, supportExistingReport, type SendReportResult } from "@/app/prijavi/actions"
import { WhyInstitution } from "@/components/report/why-institution"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { DuplicateReport, PrepareErrorCode, PrepareResult } from "@/lib/agent/steps"
import {
  CATEGORIES,
  DESCRIPTION_MAX_LENGTH,
  DUPLICATE_TEXT,
  ERROR_MESSAGES,
  PREPARE_TEXT,
  REVIEW_TEXT,
  SEND_TEXT,
  UNKNOWN_ERROR_MESSAGE,
} from "@/lib/constants"

import { AgentSteps } from "./agent-steps"
import { AnalysisBanner } from "./analysis-banner"
import type { FlowPhoto, FlowState, Prepare, PrepareSteps } from "./flow-state"
import { PhotoStrip } from "./photo-strip"
import { reviewLetter } from "./review-letter"
import { ReviewPhotos } from "./review-photos"

export type ReviewAccount = { firstName: string; lastName: string }

function prepareErrorText(code: PrepareErrorCode): string {
  if (code === "invalid_request" || code === "unknown") return PREPARE_TEXT.failed
  return ERROR_MESSAGES[code]
}

const coordinates = (lat: number, lng: number) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`

// Step 3 (FR-5 steps 3 and 6, FR-11). Until the first prepare is done: the agent's steps live.
// Then "Pregled prijave" on one screen: photos (add / remove), category ("Promijeni" runs
// prepare again, no model call), recipient or the FR-8 message with "Zašto ova institucija?",
// address, the editable public description, "Dostavi moje ime i mejl instituciji" (off), the
// read-only letter, and "Pošalji prijavu" (sendReport, ticket #12; then "Prijava poslata").
export function ReviewStep({
  state,
  account,
  steps,
  prepare,
  duplicate,
  canSend,
  noDraft,
  dispatch,
  onRetryAnalysis,
  onRetryUpload,
  onAddPhotos,
  onSent,
  cancel,
}: {
  state: FlowState
  account: ReviewAccount
  steps: PrepareSteps
  prepare: Exclude<Prepare, { status: "idle" }> | null
  duplicate: DuplicateReport | null
  canSend: boolean
  noDraft: boolean
  dispatch: (action: import("./flow-state").FlowAction) => void
  onRetryAnalysis: () => void
  onRetryUpload: (photo: FlowPhoto) => void
  onAddPhotos: (photos: FlowPhoto[], notice: string | null) => void
  onSent: (result: Extract<SendReportResult, { ok: true }>) => void
  cancel: React.ReactNode
}) {
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  // a second tap before React re-renders the disabled button must not start a second send
  // (the database refuses a second attempt anyway, ticket #12)
  const inFlight = useRef(false)
  const result = prepare?.status === "done" ? prepare.result : null
  const reportId = result?.reportId ?? null
  const point = state.confirmed!

  // until the first prepare is done (or failed), the live steps
  if (!state.reviewOpened) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 *:shrink-0">
          {!state.category && <AnalysisBanner analysis={state.analysis} onRetry={onRetryAnalysis} />}
          <Card>
            <CardHeader>
              <CardTitle>
                <h1 className="font-heading text-xl">{REVIEW_TEXT.title}</h1>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="flex items-start gap-2">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                <span data-testid="confirmed-address">{point.address ?? coordinates(point.lat, point.lng)}</span>
              </p>
              <AgentSteps steps={steps} />
              <PhotoStrip photos={state.photos} onRetry={onRetryUpload} />
            </CardContent>
          </Card>
          {noDraft && <RetryAlert text={PREPARE_TEXT.noDraft} onRetry={onRetryAnalysis} />}
          {prepare?.status === "error" && (
            <RetryAlert text={prepareErrorText(prepare.code)} onRetry={() => dispatch({ type: "prepareRetry" })} />
          )}
        </div>
        <div className="border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{cancel}</div>
      </div>
    )
  }

  // "Pošalji prijavu"; after a failure the same button reads "Pokušaj ponovo" and repeats the whole
  // sequence (the draft keeps its number, FR-24)
  const send = async () => {
    if (!reportId || !state.category || inFlight.current) return
    inFlight.current = true
    setSending(true)
    setSendError(null)
    const sent = await sendReport({
      reportId,
      category: state.category,
      description: state.description,
      shareContact: state.shareContact,
    }).catch(() => null)
    inFlight.current = false
    setSending(false)
    if (!sent || !sent.ok) {
      setSendError(sent ? sent.error : UNKNOWN_ERROR_MESSAGE)
      return
    }
    onSent(sent)
  }

  const danger = state.analysis.status === "done" && state.analysis.result.immediate_danger
  const draft = reportId ?? (state.analysis.status === "done" || state.analysis.status === "fallback" ? state.analysis.reportId : null)
  const address = result ? result.address : point.address
  const fullName = `${account.firstName} ${account.lastName}`

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="review">
      {/* scroll area: min-h-0 so it can shrink, children shrink-0 so cards never clip (#9), and
          relative so absolutely positioned children (sr-only inputs and labels) stay inside it
          instead of making the whole page scroll */}
      <div className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 *:shrink-0">
        <h1 className="font-heading text-xl font-semibold">{REVIEW_TEXT.title}</h1>

        {danger && (
          <Alert variant="destructive" data-testid="danger">
            <TriangleAlert aria-hidden />
            <AlertTitle>{REVIEW_TEXT.danger}</AlertTitle>
          </Alert>
        )}

        <Card data-testid="category-card">
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-muted-foreground">{REVIEW_TEXT.categoryLabel}</span>
                <span className="font-heading text-base font-medium" data-testid="category">
                  {state.category ? CATEGORIES[state.category].label : ""}
                </span>
              </div>
              <Button variant="outline" className="h-11 shrink-0" onClick={() => dispatch({ type: "changeCategory" })}>
                {REVIEW_TEXT.changeCategory}
              </Button>
            </div>
            {result ? (
              <Recipient result={result} />
            ) : prepare?.status === "error" ? (
              <RetryAlert text={prepareErrorText(prepare.code)} onRetry={() => dispatch({ type: "prepareRetry" })} />
            ) : (
              <AgentSteps steps={steps} />
            )}
          </CardContent>
        </Card>

        {duplicate && draft && <DuplicateNotice duplicate={duplicate} draftId={draft} />}

        {draft && (
          <ReviewPhotos
            photos={state.photos}
            flagged={state.flaggedPhotos}
            reportId={draft}
            notice={state.notice}
            onAdd={onAddPhotos}
            onNotice={(notice) => dispatch({ type: "notice", notice })}
            onRemoved={(id) => dispatch({ type: "photoRemoved", id })}
            onRetry={onRetryUpload}
          />
        )}

        <Card>
          <CardContent className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{REVIEW_TEXT.addressLabel}</span>
            <p className="flex items-start gap-2 font-medium">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <span data-testid="review-address">{address ?? coordinates(point.lat, point.lng)}</span>
            </p>
            {result && result.address === null && (
              <p className="text-muted-foreground" data-testid="coordinates-only">
                {PREPARE_TEXT.coordinatesOnly}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Label htmlFor="description" className="text-sm font-medium">
              {REVIEW_TEXT.descriptionLabel}
            </Label>
            <Textarea
              id="description"
              data-testid="description-input"
              rows={4}
              maxLength={DESCRIPTION_MAX_LENGTH}
              value={state.description}
              aria-describedby="description-public"
              onChange={(e) => dispatch({ type: "editDescription", description: e.currentTarget.value })}
            />
            <p id="description-public" className="text-muted-foreground">
              {REVIEW_TEXT.descriptionPublic}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex min-h-11 items-center justify-between gap-3">
              <Label htmlFor="share-contact" className="text-sm font-medium">
                {REVIEW_TEXT.shareContact}
              </Label>
              <Switch
                id="share-contact"
                data-testid="share-contact"
                checked={state.shareContact}
                onCheckedChange={(on) => dispatch({ type: "shareContact", on })}
              />
            </div>
            {state.shareContact && <p className="text-muted-foreground">{REVIEW_TEXT.shareContactOn(fullName)}</p>}
          </CardContent>
        </Card>

        {result?.letter && (
          <LetterPreview
            text={reviewLetter(result.letter, {
              description: state.description,
              photoCount: state.photos.length,
              contact: state.shareContact ? account : null,
            })}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="text-xs text-muted-foreground">{REVIEW_TEXT.confirmNote}</p>
        {sendError && (
          <p className="text-sm text-destructive" role="alert" data-testid="send-error">
            {sendError}
          </p>
        )}
        {result && !canSend && state.photos.some((p) => p.upload !== "done") && (
          <p className="text-sm text-muted-foreground" role="status">
            {REVIEW_TEXT.waitingForPhotos}
          </p>
        )}
        <Button size="lg" className="h-12 w-full text-base" disabled={!canSend || sending} onClick={() => void send()}>
          <Send aria-hidden />
          {sending ? REVIEW_TEXT.sending : sendError ? SEND_TEXT.retry : REVIEW_TEXT.send}
        </Button>
        {cancel}
      </div>
    </div>
  )
}

function RetryAlert({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive" data-testid="prepare-error">
      <CircleAlert aria-hidden />
      <AlertTitle>{text}</AlertTitle>
      <AlertDescription>
        <Button variant="outline" size="sm" className="mt-1 h-11" onClick={onRetry}>
          {PREPARE_TEXT.retry}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// FR-8: the recipient (and cc) from jurisdiction_rules, or the message that the administrator
// will choose one
function Recipient({ result }: { result: PrepareResult }) {
  const { institution, cc, ruleId, outcome } = result.jurisdiction
  if (!institution) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-muted p-3" data-testid="recipient" data-outcome={outcome}>
        <Landmark aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p>{PREPARE_TEXT.noRecipient}</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1" data-testid="recipient" data-outcome={outcome}>
      <span className="text-muted-foreground">{REVIEW_TEXT.recipientLabel}</span>
      <p className="flex items-start gap-2 font-medium">
        <Landmark aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        <span data-testid="recipient-name">{institution.name}</span>
      </p>
      {cc && (
        <p className="text-muted-foreground" data-testid="cc-name">
          {REVIEW_TEXT.ccLabel}: {cc.name}
        </p>
      )}
      <WhyInstitution ruleId={ruleId} />
    </div>
  )
}

// FR-5, FR-9: after a new category on the review, a duplicate is a notice on the same screen;
// supporting it is possible but no tap is required
function DuplicateNotice({ duplicate, draftId }: { duplicate: DuplicateReport; draftId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const support = async () => {
    setPending(true)
    setError(null)
    const result = await supportExistingReport({ draftId, reportId: duplicate.id }).catch(() => null)
    if (!result || !result.ok) {
      setPending(false)
      setError(result ? result.error : UNKNOWN_ERROR_MESSAGE)
      return
    }
    router.push(`/p/${result.code}`)
  }

  return (
    <Alert data-testid="duplicate-notice">
      <CircleAlert aria-hidden className="text-status-in-progress" />
      <AlertTitle>{duplicate.isOwn ? DUPLICATE_TEXT.own : DUPLICATE_TEXT.title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        {!duplicate.isOwn && <p>{DUPLICATE_TEXT.description(duplicate.distanceM)}</p>}
        {duplicate.isOwn ? (
          <Link href={`/p/${duplicate.code}`} className={buttonVariants({ variant: "link", className: "h-11 justify-start px-0" })}>
            {DUPLICATE_TEXT.openOwn(duplicate.code)}
          </Link>
        ) : (
          <Button variant="outline" size="sm" className="h-11 self-start text-foreground" disabled={pending} onClick={() => void support()}>
            {pending ? DUPLICATE_TEXT.supporting : DUPLICATE_TEXT.support}
          </Button>
        )}
        {error && (
          <p className="text-destructive" role="alert">
            {error}
          </p>
        )}
      </AlertDescription>
    </Alert>
  )
}

// "Prikaži cijeli tekst" (FR-11): the rest of the letter is the fixed template, read only
function LetterPreview({ text }: { text: { subject: string; bodyText: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <Card data-testid="letter">
      <CardContent className="flex flex-col gap-2 text-sm">
        <Button
          variant="ghost"
          className="h-11 justify-start gap-2 px-0 font-medium hover:bg-transparent"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <FileText aria-hidden className="text-muted-foreground" />
          {open ? REVIEW_TEXT.hideLetter : REVIEW_TEXT.showLetter}
        </Button>
        {open && (
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3" data-testid="letter-text">
            <p className="font-medium break-words">{text.subject}</p>
            <p className="whitespace-pre-wrap break-words">{text.bodyText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
