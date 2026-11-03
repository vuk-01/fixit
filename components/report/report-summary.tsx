import { ImageOff } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/report/status-badge"
import { CATEGORIES, dayCounterText, likeCountText } from "@/lib/constants"
import type { MapReport } from "@/lib/reports/public-map"

export const REPORT_SUMMARY_TEXT = {
  demo: "Demo prijava",
  demoNoPhoto: "Demo prijava nema fotografiju.",
  noPhoto: "Fotografija nije dostupna.",
  open: "Otvori prijavu",
  photoAlt: "Fotografija problema",
} as const

// Content of a map marker popup (FR-14): category, status in text, day counter, supports,
// photo or the demo note, demo badge and a link to the public page.
export function ReportPopupContent({ report }: { report: MapReport }) {
  return (
    // [&_p]:m-0! undoes Leaflet's unlayered `.leaflet-popup-content p` margins
    <div className="flex w-full flex-col gap-2 font-sans text-sm text-foreground [&_p]:m-0!">
      <ReportPhoto report={report} className="aspect-video w-full rounded-lg" />
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={report.status} />
        {report.is_demo && <Badge variant="outline">{REPORT_SUMMARY_TEXT.demo}</Badge>}
      </div>
      <p className="font-heading text-base leading-snug font-medium">{CATEGORIES[report.category].label}</p>
      {report.address && <p className="text-muted-foreground">{report.address}</p>}
      <ReportCounters report={report} />
      <Link
        href={`/p/${report.code}`}
        className={buttonVariants({ className: "h-11 w-full !text-primary-foreground" })}
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

  const text = report.is_demo ? REPORT_SUMMARY_TEXT.demoNoPhoto : REPORT_SUMMARY_TEXT.noPhoto
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 bg-muted p-2 text-center text-xs text-muted-foreground ${className ?? ""}`}
    >
      <ImageOff aria-hidden className="size-5" />
      <span>{text}</span>
    </div>
  )
}
