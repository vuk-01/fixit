import { CalendarClock, HeartHandshake, Image as ImageIcon, MapPin } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/report/status-badge"
import { CATEGORIES, dayCounterText, likeCountText } from "@/lib/constants"
import { placeLabel } from "@/lib/geo/address"
import type { MapReport } from "@/lib/reports/public-map"
import { cn } from "@/lib/utils"

export const REPORT_SUMMARY_TEXT = {
  demo: "Demo prijava",
  withoutPhoto: "Bez fotografije",
  open: "Otvori prijavu",
  photoAlt: "Fotografija problema",
} as const

// Content of a map marker popup (FR-14, UI.md "Map"): photo, status in text, demo badge, category,
// address, day counter, supports and a link to the public page. A fixed 240 px column (the
// `.report-popup` CSS in globals.css matches it), with the photo in a fixed 240 × 180 frame that clips
// it, so no browser can size the photo wider than the column.
export function ReportPopupContent({ report }: { report: MapReport }) {
  return (
    // [&_p]:m-0! undoes Leaflet's unlayered `.leaflet-popup-content p` margins
    <div className="flex w-[240px] min-w-0 flex-col gap-2.5 font-sans text-sm text-foreground [&_p]:m-0!">
      <div className="relative h-[180px] w-[240px] shrink-0 overflow-hidden rounded-xl bg-muted">
        <ReportPhoto report={report} className="absolute inset-0 size-full max-w-none" />
      </div>
      <div className="flex flex-col gap-2 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={report.status} />
          {report.is_demo && <Badge variant="outline">{REPORT_SUMMARY_TEXT.demo}</Badge>}
        </div>
        <p className="text-[17px] leading-snug font-bold">{CATEGORIES[report.category].label}</p>
        <p className="flex items-start gap-1.5 text-[13px] leading-snug text-muted-foreground">
          <MapPin aria-hidden className="mt-px size-3.5 shrink-0" />
          {placeLabel(report.address)}
        </p>
        <div className="flex flex-col gap-1 text-[13px] font-semibold">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock aria-hidden className="size-3.5 shrink-0" />
            {dayCounterText(report)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <HeartHandshake aria-hidden className="size-3.5 shrink-0" />
            {likeCountText(report.like_count)}
          </span>
        </div>
      </div>
      {/* !text-…: Leaflet colours every link inside the map (.leaflet-container a) */}
      <Link
        href={`/p/${report.code}`}
        className={cn(
          buttonVariants({ variant: "highlight" }),
          "h-11 w-full rounded-xl text-[15px] !text-highlight-foreground",
        )}
      >
        {REPORT_SUMMARY_TEXT.open}
      </Link>
    </div>
  )
}

export function ReportCounters({ report }: { report: MapReport }) {
  return (
    <p className="text-muted-foreground">
      <span>{dayCounterText(report)}</span>
      <span aria-hidden> · </span>
      <span>{likeCountText(report.like_count)}</span>
    </p>
  )
}

export function ReportPhoto({
  report,
  className,
}: {
  report: MapReport
  className?: string
}) {
  if (report.photoUrl) {
    return (
      // signed URLs change per request, so no next/image optimisation (Tech.md §5)
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={report.photoUrl}
        alt={`${REPORT_SUMMARY_TEXT.photoAlt}: ${CATEGORIES[report.category].label}`}
        loading="lazy"
        className={`bg-muted object-cover ${className ?? ""}`}
      />
    )
  }

  // no photo to show: a demo report without one (DB.md §12.4), or none visible
  return <NoPhoto className={className} />
}

// The one stand-in for a missing photo in the list, the popup and on the report page: a neutral
// surface with a plain image icon and „Bez fotografije", the same for every category; never a
// crossed-out image, which reads as a broken one (UI.md "Report card").
export function NoPhoto({ className }: { className?: string }) {
  return (
    <div
      data-testid="photo-none"
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 bg-muted px-1.5 py-2 text-center text-xs leading-tight font-medium text-muted-foreground",
        className,
      )}
    >
      <ImageIcon aria-hidden className="size-6 shrink-0" />
      <span>{REPORT_SUMMARY_TEXT.withoutPhoto}</span>
    </div>
  )
}
