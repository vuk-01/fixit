import { HeartHandshake } from "lucide-react"
import Link from "next/link"

import { REPORT_CODE, REPORT_ROW_TINT } from "@/components/report/report-list-styles"
import { StatusBadge } from "@/components/report/status-badge"
import { Badge } from "@/components/ui/badge"
import { CATEGORIES, likeCountText, PANEL_TEXT, type PublicReportStatus, type ReportCategory } from "@/lib/constants"
import { placeLabel } from "@/lib/geo/address"
import { cn } from "@/lib/utils"

export type StackedReport = {
  id: string
  href: string
  code: string
  category: ReportCategory
  address: string | null
  status?: PublicReportStatus
  isDemo: boolean
  isHidden: boolean
  // the page's own line: the routing reason on /admin, the severity in the panel
  detail?: React.ReactNode
  daysText: string | null
  likeCount: number
}

// The phone layout of the report lists in /admin and /panel (UI.md "Report lists in /admin and
// /panel"): below `md` the table becomes this list inside the same card, one report under another,
// each report one link (one tab stop, the whole row a tap target, at least 44 px). Long text wraps;
// the place is the address without coordinates (placeLabel), which stay on the report page.
// No prefetch: opening a report in the panel acknowledges it (FR-22), so only a real tap may load it.
export function ReportStackList({ reports }: { reports: StackedReport[] }) {
  return (
    <ul className="-mx-3 flex flex-col divide-y md:hidden">
      {reports.map((report) => (
        <li key={report.id}>
          <Link
            href={report.href}
            prefetch={false}
            className={cn(
              "flex min-h-11 flex-col gap-1 rounded-xl p-3 wrap-break-word outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              REPORT_ROW_TINT,
            )}
          >
            <span className={REPORT_CODE}>{report.code}</span>
            <span className="font-medium">{CATEGORIES[report.category].label}</span>
            <span className="text-muted-foreground">{placeLabel(report.address)}</span>
            <ReportFlags status={report.status} isDemo={report.isDemo} isHidden={report.isHidden} />
            {report.detail && <span className="mt-1">{report.detail}</span>}
            <span className="flex flex-wrap items-center gap-x-3 text-muted-foreground">
              <span>{report.daysText}</span>
              <span className="inline-flex items-center gap-1">
                <HeartHandshake aria-hidden className="size-3.5 shrink-0" />
                {likeCountText(report.likeCount)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

// status (panel), „Demo prijava" and „Sakrivena sa javne stranice", in the stacked list and in the
// table's category cell
export function ReportFlags({
  status,
  isDemo,
  isHidden,
}: {
  status?: PublicReportStatus
  isDemo: boolean
  isHidden: boolean
}) {
  if (!status && !isDemo && !isHidden) return null
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1">
      {status && <StatusBadge status={status} label="panel" />}
      {isDemo && <Badge variant="outline">{PANEL_TEXT.demo}</Badge>}
      {isHidden && (
        <Badge variant="secondary" className="h-auto min-h-5 whitespace-normal">
          {PANEL_TEXT.hidden}
        </Badge>
      )}
    </span>
  )
}
