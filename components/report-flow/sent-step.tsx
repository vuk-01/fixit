"use client"

import { CircleCheck, ExternalLink, Landmark, Plus, Share2 } from "lucide-react"
import Link from "next/link"

import type { SendReportResult } from "@/app/prijavi/actions"
import { useShareLink } from "@/components/report/use-share-link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PREPARE_TEXT, SENT_TEXT } from "@/lib/constants"

type Sent = Extract<SendReportResult, { ok: true }>

// "Prijava poslata" (FR-5 step 7): the report number, the public page /p/[code], "Podijeli" and
// "Nova prijava". The title is the same for `routing`, with the FR-8 message under it (ticket 19 Q8).
export function SentStep({ sent, onNewReport }: { sent: Sent; onNewReport: () => void }) {
  const path = `/p/${sent.code}`
  const { share, note: shareNote } = useShareLink(path, SENT_TEXT.shareTitle(sent.code))

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="sent" data-outcome={sent.outcome}>
      <div className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 *:shrink-0">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-2 text-center">
            <CircleCheck aria-hidden className="size-12 text-status-resolved" />
            <h1 className="font-heading text-2xl font-semibold">{SENT_TEXT.title}</h1>
            {sent.outcome === "routing" && (
              <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-left text-sm" data-testid="routing-note">
                <Landmark aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p>{PREPARE_TEXT.noRecipient}</p>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-muted-foreground">{SENT_TEXT.codeLabel}</span>
              <span className="font-heading text-xl font-semibold tracking-wide" data-testid="sent-code">
                {sent.code}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{SENT_TEXT.publicNote}</p>
            <Link href={path} className={buttonVariants({ variant: "link", className: "h-11" })} data-testid="sent-link">
              <ExternalLink aria-hidden />
              {SENT_TEXT.openReport}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {shareNote && (
          <p className="text-sm break-all text-muted-foreground" role="status">
            {shareNote}
          </p>
        )}
        <Button size="lg" className="h-12 w-full text-base" onClick={() => void share()}>
          <Share2 aria-hidden />
          {SENT_TEXT.share}
        </Button>
        <Button variant="outline" className="h-11 w-full" onClick={onNewReport}>
          <Plus aria-hidden />
          {SENT_TEXT.newReport}
        </Button>
      </div>
    </div>
  )
}
