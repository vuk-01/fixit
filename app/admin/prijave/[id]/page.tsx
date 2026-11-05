import { ArrowLeft, ArrowRight, ImageOff } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { REPORT_ACCENT_TITLE } from "@/components/report/report-list-styles"
import { AssignForm } from "@/components/admin/assign-form"
import { ReportTimeline } from "@/components/report/report-timeline"
import { StatusBadge } from "@/components/report/status-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminReport, getAssignableInstitutions, requireAdmin, type AdminReport } from "@/lib/admin/reports"
import {
  ADMIN_TEXT,
  CATEGORIES,
  dayCounterText,
  likeCountText,
  PANEL_TEXT,
  TIMELINE_TEXT,
} from "@/lib/constants"
import { formatLetterDate } from "@/lib/email/letter-template"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: ADMIN_TEXT.pageTitle }

// One report on /admin (ticket #15): what the administrator needs to choose the institution
// (photos, description, address, why it waits, the reporter's name), the institution picker, the
// letter preview and "Pošalji dopis" (FR-23 manual assignment). A report that already has a
// recipient shows it and the letter sent. Full details stay on /panel/prijave/[id] (read-only).
export default async function AdminReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdmin(`/admin/prijave/${id}`)
  const [report, institutions] = await Promise.all([getAdminReport(id), getAssignableInstitutions()])
  if (!report) notFound()

  const routing = report.status === "routing"

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 wrap-break-word">
      <Link href="/admin" className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 h-11 self-start px-3")}>
        <ArrowLeft aria-hidden data-icon="inline-start" />
        {ADMIN_TEXT.back}
      </Link>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{report.code}</p>
        <h1 className="font-heading text-2xl font-semibold">{CATEGORIES[report.category].label}</h1>
        {report.address && <p className="text-muted-foreground">{report.address}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={report.status} label="panel" />
          {report.is_demo && <Badge variant="outline">{ADMIN_TEXT.demo}</Badge>}
          {report.is_hidden && <Badge variant="secondary">{ADMIN_TEXT.hidden}</Badge>}
          <span className="text-sm text-muted-foreground">{dayCounterText(report)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          {routing ? (
            <Card>
              <CardHeader>
                <CardTitle className={REPORT_ACCENT_TITLE}>{ADMIN_TEXT.assignTitle}</CardTitle>
                <CardDescription>{ADMIN_TEXT.assignDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <AssignForm
                  reportId={report.id}
                  institutions={institutions}
                  preview={report.preview}
                  canSend={report.photos.length > 0}
                />
              </CardContent>
            </Card>
          ) : (
            <Assigned report={report} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className={REPORT_ACCENT_TITLE}>{PANEL_TEXT.descriptionTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{report.description ?? PANEL_TEXT.noDescription}</p>
            </CardContent>
          </Card>

          <Photos report={report} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Details report={report} />

          <Card>
            <CardHeader>
              <CardTitle className={REPORT_ACCENT_TITLE}>{TIMELINE_TEXT.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportTimeline events={report.events} institutionNames={report.institutionNames} view="panel" />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function Assigned({ report }: { report: AdminReport }) {
  const recipient = report.institutionId ? report.institutionNames.get(report.institutionId) : null
  return (
    <Card>
      <CardHeader>
        <CardTitle className={REPORT_ACCENT_TITLE}>{recipient ? ADMIN_TEXT.assignedTitle : ADMIN_TEXT.sentLetterTitle}</CardTitle>
        {recipient && (
          <CardDescription>
            {ADMIN_TEXT.recipient}: {recipient}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {report.letter ? (
          <>
            <p className="font-medium">{report.letter.subject}</p>
            <p className="text-sm text-muted-foreground">
              {PANEL_TEXT.letterSentAt}: {formatLetterDate(report.letter.sentAt)}
            </p>
            <pre className="max-h-[32rem] overflow-auto rounded-lg bg-muted p-3 font-sans text-sm wrap-anywhere whitespace-pre-wrap">
              {report.letter.body}
            </pre>
          </>
        ) : (
          <p className="text-muted-foreground">{ADMIN_TEXT.noLetter}</p>
        )}
      </CardContent>
    </Card>
  )
}

function Details({ report }: { report: AdminReport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={REPORT_ACCENT_TITLE}>{PANEL_TEXT.detailsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
          {report.routingReason && report.status === "routing" && (
            <>
              <dt className="text-muted-foreground">{ADMIN_TEXT.reasonTitle}</dt>
              <dd>{ADMIN_TEXT.routingReason[report.routingReason]}</dd>
            </>
          )}
          <dt className="text-muted-foreground">{PANEL_TEXT.code}</dt>
          <dd>{report.code}</dd>
          <dt className="text-muted-foreground">{ADMIN_TEXT.submittedAt}</dt>
          <dd>{formatLetterDate(report.submitted_at)}</dd>
          <dt className="text-muted-foreground">{PANEL_TEXT.likes}</dt>
          <dd>{likeCountText(report.like_count)}</dd>
          <dt className="text-muted-foreground">{ADMIN_TEXT.reporter}</dt>
          <dd>
            <p>{report.reporterName ?? "—"}</p>
            <p className="text-muted-foreground">{ADMIN_TEXT.reporterHint}</p>
          </dd>
        </dl>
        <Link
          href={`/panel/prijave/${report.id}`}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 self-start")}
        >
          {ADMIN_TEXT.allDetails}
          <ArrowRight aria-hidden data-icon="inline-end" />
        </Link>
      </CardContent>
    </Card>
  )
}

function Photos({ report }: { report: AdminReport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={REPORT_ACCENT_TITLE}>{PANEL_TEXT.photosTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {report.photos.length === 0 ? (
          <p className="text-muted-foreground">{PANEL_TEXT.noPhotos}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {report.photos.map((photo) => (
              <li key={photo.id} className="flex flex-col gap-2">
                {photo.url ? (
                  <a href={photo.url} target="_blank" rel="noreferrer">
                    {/* signed URLs change per request, so no next/image optimisation (Tech.md §5) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={PANEL_TEXT.photoAlt(photo.position)}
                      className="aspect-[4/3] w-full rounded-lg bg-muted object-cover"
                    />
                  </a>
                ) : (
                  <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg bg-muted text-sm text-muted-foreground">
                    <ImageOff aria-hidden className="size-5" />
                    {PANEL_TEXT.photoUnavailable}
                  </div>
                )}
                {photo.hasPersonalData && <Badge variant="outline">{PANEL_TEXT.photoPersonalData}</Badge>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
