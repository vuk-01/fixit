import { ArrowLeft, ExternalLink, ImageOff, TriangleAlert } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { StatusForm } from "@/components/panel/status-form"
import { ReportTimeline } from "@/components/report/report-timeline"
import { StatusBadge } from "@/components/report/status-badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CATEGORIES,
  dayCounterText,
  likeCountText,
  PANEL_TEXT,
  SEVERITY_LABELS,
  TIMELINE_TEXT,
} from "@/lib/constants"
import { formatLetterDate } from "@/lib/email/letter-template"
import { getPanelReport, requirePanelAccess, type PanelReport } from "@/lib/panel/reports"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: PANEL_TEXT.pageTitle }

function mapLink(lat: number, lng: number): string {
  const la = lat.toFixed(5)
  const lo = lng.toFixed(5)
  return `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=18/${la}/${lo}`
}

// Report detail in the panel (PRD §8 "Institucija", FR-6, FR-21, FR-22): severity, all photos
// (hidden ones too), description, address, the letter addressed to the institution, the timeline
// and the status change. The first opening by the recipient's official acknowledges a `sent`
// report; the admin may open it read-only, which never changes the status.
export default async function PanelReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const access = await requirePanelAccess(`/panel/prijave/${id}`, "detail")
  const report = await getPanelReport(id, access)
  if (!report) notFound()

  const isOfficial = access.kind === "official"

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
      {isOfficial && (
        <Link href="/panel" className={cn(buttonVariants({ variant: "ghost" }), "h-11 self-start px-3")}>
          <ArrowLeft aria-hidden data-icon="inline-start" />
          {PANEL_TEXT.back}
        </Link>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{report.code}</p>
        <h1 className="font-heading text-2xl font-semibold">{CATEGORIES[report.category].label}</h1>
        {report.address && <p className="text-muted-foreground">{report.address}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={report.status} label="panel" />
          {report.is_demo && <Badge variant="outline">{PANEL_TEXT.demo}</Badge>}
          {report.is_hidden && <Badge variant="secondary">{PANEL_TEXT.hidden}</Badge>}
          <span className="text-sm text-muted-foreground">{dayCounterText(report)}</span>
        </div>
      </div>

      {!isOfficial && (
        <Alert>
          <AlertDescription>{PANEL_TEXT.adminReadOnly}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Photos report={report} />

          <Card>
            <CardHeader>
              <CardTitle>{PANEL_TEXT.descriptionTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{report.description ?? PANEL_TEXT.noDescription}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{PANEL_TEXT.locationTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p>{report.address ?? PANEL_TEXT.noAddress}</p>
              {report.lat !== null && report.lng !== null && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
                  </p>
                  <a
                    href={mapLink(report.lat, report.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline" }), "h-11 self-start")}
                  >
                    {PANEL_TEXT.openMap}
                    <ExternalLink aria-hidden data-icon="inline-end" />
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{PANEL_TEXT.letterTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {report.letter ? (
                <>
                  <p className="font-medium">{report.letter.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {PANEL_TEXT.letterSentAt}: {formatLetterDate(report.letter.sentAt)}
                  </p>
                  <pre className="max-h-[32rem] overflow-auto rounded-lg bg-muted p-3 font-sans text-sm whitespace-pre-wrap">
                    {report.letter.body}
                  </pre>
                </>
              ) : (
                <p className="text-muted-foreground">{PANEL_TEXT.noLetter}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 max-lg:-order-1">
          {isOfficial && (
            <Card>
              <CardHeader>
                <CardTitle>{PANEL_TEXT.statusTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* key: a new status gives a fresh form with the newly allowed transitions */}
                <StatusForm key={report.status} reportId={report.id} status={report.status} />
              </CardContent>
            </Card>
          )}

          <Details report={report} />

          <Card>
            <CardHeader>
              <CardTitle>{TIMELINE_TEXT.title}</CardTitle>
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

function Details({ report }: { report: PanelReport }) {
  const severity = report.severity ? SEVERITY_LABELS[report.severity] : null
  const cc = report.ccInstitutionId ? report.institutionNames.get(report.ccInstitutionId) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{PANEL_TEXT.detailsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {report.immediateDanger && (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden />
            <AlertDescription>{PANEL_TEXT.immediateDanger}</AlertDescription>
          </Alert>
        )}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="text-muted-foreground">{PANEL_TEXT.severity}</dt>
          <dd>
            <p className="font-medium">{severity?.label ?? PANEL_TEXT.severityUnknown}</p>
            <p className="text-muted-foreground">{severity?.description ?? PANEL_TEXT.severityUnknownHint}</p>
          </dd>
          <dt className="text-muted-foreground">{PANEL_TEXT.code}</dt>
          <dd>{report.code}</dd>
          <dt className="text-muted-foreground">{PANEL_TEXT.submittedAt}</dt>
          <dd>{formatLetterDate(report.submitted_at)}</dd>
          {report.closed_at && (
            <>
              <dt className="text-muted-foreground">{PANEL_TEXT.closedAt}</dt>
              <dd>{formatLetterDate(report.closed_at)}</dd>
            </>
          )}
          {cc && (
            <>
              <dt className="text-muted-foreground">{PANEL_TEXT.cc}</dt>
              <dd>{cc}</dd>
            </>
          )}
          <dt className="text-muted-foreground">{PANEL_TEXT.likes}</dt>
          <dd>{likeCountText(report.like_count)}</dd>
        </dl>
      </CardContent>
    </Card>
  )
}

function Photos({ report }: { report: PanelReport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{PANEL_TEXT.photosTitle}</CardTitle>
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
                {(photo.hidden || photo.hasPersonalData) && (
                  <div className="flex flex-wrap gap-1">
                    {photo.hidden && <Badge variant="secondary">{PANEL_TEXT.photoHidden}</Badge>}
                    {photo.hasPersonalData && <Badge variant="outline">{PANEL_TEXT.photoPersonalData}</Badge>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
