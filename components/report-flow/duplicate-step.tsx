"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { supportExistingReport } from "@/app/prijavi/actions"
import { ReportCounters, ReportPhoto } from "@/components/report/report-summary"
import { StatusBadge } from "@/components/report/status-badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { DuplicateReport } from "@/lib/agent/steps"
import { CATEGORIES, DUPLICATE_TEXT, UNKNOWN_ERROR_MESSAGE } from "@/lib/constants"

// FR-9: an open report of the same category within 50 m. "Podrži postojeću" likes it, deletes
// the draft with its photos and goes to its public page; "Ipak pošalji novu" goes on. When the
// nearest report is the citizen's own, a link to it replaces "Podrži postojeću".
export function DuplicateStep({
  duplicate,
  draftId,
  onSendNew,
  cancel,
}: {
  duplicate: DuplicateReport
  draftId: string
  onSendNew: () => void
  cancel: React.ReactNode
}) {
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
    <div className="flex min-h-0 flex-1 flex-col" data-testid="duplicate">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 *:shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold">{DUPLICATE_TEXT.title}</h1>
          <p className="text-sm text-muted-foreground">{DUPLICATE_TEXT.description(duplicate.distanceM)}</p>
        </div>
        <Card>
          <CardContent className="flex flex-col gap-2 text-sm">
            <ReportPhoto report={duplicate} className="aspect-video w-full rounded-lg" />
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={duplicate.status} />
            </div>
            <p className="font-heading text-base leading-snug font-medium">{CATEGORIES[duplicate.category].label}</p>
            {duplicate.address && <p className="text-muted-foreground">{duplicate.address}</p>}
            <ReportCounters report={duplicate} />
          </CardContent>
        </Card>
        {duplicate.isOwn && (
          <div className="flex flex-col gap-1 text-sm" data-testid="duplicate-own">
            <p className="font-medium">{DUPLICATE_TEXT.own}</p>
            <Link href={`/p/${duplicate.code}`} className={buttonVariants({ variant: "link", className: "h-11 justify-start px-0" })}>
              {DUPLICATE_TEXT.openOwn(duplicate.code)}
            </Link>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {!duplicate.isOwn && (
          <Button size="lg" className="h-12 w-full text-base" disabled={pending} onClick={() => void support()}>
            {pending ? DUPLICATE_TEXT.supporting : DUPLICATE_TEXT.support}
          </Button>
        )}
        <Button
          size="lg"
          variant={duplicate.isOwn ? "default" : "outline"}
          className="h-12 w-full text-base"
          disabled={pending}
          onClick={onSendNew}
        >
          {DUPLICATE_TEXT.sendNew}
        </Button>
        {cancel}
      </div>
    </div>
  )
}
