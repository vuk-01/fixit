import { EyeOff, ImageOff, Landmark } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LikeButton } from "@/components/report/like-button"
import { REPORT_SUMMARY_TEXT } from "@/components/report/report-summary"
import { ReportTimeline } from "@/components/report/report-timeline"
import { ShareReportButton } from "@/components/report/share-report-button"
import { StatusBadge } from "@/components/report/status-badge"
import { WhyInstitution } from "@/components/report/why-institution"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CATEGORIES,
  dayCounterText,
  PREPARE_TEXT,
  PUBLIC_REPORT_TEXT,
  TIMELINE_TEXT,
  WHY_INSTITUTION_TEXT,
} from "@/lib/constants"
import { getPublicReport, type PublicReport } from "@/lib/reports/public-report"

type Props = { params: Promise<{ code: string }> }

// The page title is the category and the address; the model's title is not public (PRD §8).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const report = await getPublicReport(code)
  if (!report) return { title: PUBLIC_REPORT_TEXT.notFoundTitle }
  const category = CATEGORIES[report.category].label
  return { title: report.address ? `${category}, ${report.address}` : category }
}

// Public report page /p/[code] (PRD §4.1, §8; UI.md v2): stacked cards with the photos, the public
// description, category, status, recipient, day counter, "Podržavam" with the live count, the
// timeline and "Podijeli". The letter and the reporter's identity are never shown (PRD §6).
// The status is read per request; only the support count is live (FR-17, FR-18).
export default async function PublicReportPage({ params }: Props) {
  const { code } = await params
  const report = await getPublicReport(code)
  if (!report) notFound()

  const category = CATEGORIES[report.category].label

  return (
    <div className="min-h-[calc(100svh-4rem-1px)] bg-muted/50">
      {/* the header's container (max-w-5xl px-4); from lg up the photo and description sit
          next to the institution, supports and timeline instead of one stretched column (#32) */}
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] wrap-break-word">
        <div className="flex flex-col gap-2">
          <p
            className="text-sm text-muted-foreground"
            data-testid="report-code"
          >
            {report.code}
          </p>
          <h1 className="font-heading text-2xl leading-tight font-semibold">
            {category}
          </h1>
          {report.address && (
            <p className="text-muted-foreground">{report.address}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} />
            {report.is_demo && (
              <Badge variant="outline" data-testid="demo-badge">
                {REPORT_SUMMARY_TEXT.demo}
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium" data-testid="day-counter">
            {dayCounterText(report)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            <Photos report={report} category={category} />

            <Card size="sm">
              <CardHeader>
                <CardTitle>{PUBLIC_REPORT_TEXT.descriptionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap" data-testid="description">
                  {report.description ?? PUBLIC_REPORT_TEXT.noDescription}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>{PUBLIC_REPORT_TEXT.institutionTitle}</CardTitle>
              </CardHeader>
              <CardContent
                className="flex flex-col gap-1"
                data-testid="institution"
              >
                <Institution report={report} />
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>{PUBLIC_REPORT_TEXT.supportTitle}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <LikeButton
                  reportId={report.id}
                  initialCount={report.like_count}
                  initialState={report.likeState}
                />
                <ShareReportButton code={report.code} />
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>{TIMELINE_TEXT.title}</CardTitle>
              </CardHeader>
              <CardContent data-testid="timeline">
                <ReportTimeline
                  events={report.events}
                  institutionNames={report.institutionNames}
                  view="public"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function Institution({ report }: { report: PublicReport }) {
  if (report.institutionName) {
    return (
      <>
        <p className="font-medium">{report.institutionName}</p>
        {report.ccInstitutionName && (
          <p className="text-muted-foreground">
            {PUBLIC_REPORT_TEXT.cc}: {report.ccInstitutionName}
          </p>
        )}
        {report.ruleId ? (
          <WhyInstitution ruleId={report.ruleId} />
        ) : (
          <p className="text-muted-foreground">{WHY_INSTITUTION_TEXT.manual}</p>
        )}
      </>
    )
  }

  // FR-8: no rule (or no verified email) yet, the administrator assigns the recipient
  const text =
    report.status === "routing"
      ? PREPARE_TEXT.noRecipient
      : PUBLIC_REPORT_TEXT.noInstitution
  return (
    <div className="flex items-start gap-2">
      <Landmark
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <p>{text}</p>
    </div>
  )
}

function Photos({
  report,
  category,
}: {
  report: PublicReport
  category: string
}) {
  if (report.photos.length === 0) {
    return (
      <PhotoNote
        icon="none"
        compact
        text={
          report.is_demo
            ? REPORT_SUMMARY_TEXT.demoNoPhoto
            : REPORT_SUMMARY_TEXT.noPhoto
        }
      />
    )
  }

  return (
    <section
      aria-label={PUBLIC_REPORT_TEXT.photosTitle}
      className="flex flex-col gap-2"
      data-testid="photos"
    >
      {report.photos.map((photo) =>
        photo.hidden ? (
          <PhotoNote
            key={photo.position}
            icon="hidden"
            text={PUBLIC_REPORT_TEXT.photoHidden}
          />
        ) : photo.url ? (
          // signed URLs change per request, so no next/image optimisation (Tech.md §5)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.position}
            src={photo.url}
            alt={PUBLIC_REPORT_TEXT.photoAlt(category, photo.position)}
            className="aspect-[4/3] w-full rounded-2xl bg-muted object-cover"
          />
        ) : (
          <PhotoNote
            key={photo.position}
            icon="none"
            text={PUBLIC_REPORT_TEXT.photoUnavailable}
          />
        )
      )}
    </section>
  )
}

function PhotoNote({
  icon,
  text,
  compact = false,
}: {
  icon: "hidden" | "none"
  text: string
  // a report without any photo gets a short note instead of a photo-sized box
  compact?: boolean
}) {
  const Icon = icon === "hidden" ? EyeOff : ImageOff
  return (
    <div
      className={`flex ${compact ? "min-h-24" : "aspect-[4/3]"} w-full flex-col items-center justify-center gap-2 rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground`}
      data-testid={icon === "hidden" ? "photo-hidden" : "photo-none"}
    >
      <Icon aria-hidden className="size-6" />
      <span>{text}</span>
    </div>
  )
}
