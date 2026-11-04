"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useSyncExternalStore } from "react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ReportCounters, ReportPhoto, REPORT_SUMMARY_TEXT } from "@/components/report/report-summary"
import { StatusBadge } from "@/components/report/status-badge"
import { CATEGORIES, OPEN_STATUSES } from "@/lib/constants"
import type { MapReport } from "@/lib/reports/public-map"

export const HOME_TEXT = {
  title: "Prijave u Podgorici",
  tabMap: "Mapa",
  tabList: "Lista",
  report: "Prijavi problem",
  mapLoading: "Učitavam mapu…",
  empty: "Još nema prijava. Budite prvi koji će prijaviti problem.",
  failed: "Prijave trenutno nije moguće učitati. Pokušajte ponovo za nekoliko minuta.",
  // laptop sidebar (ticket 32)
  heading: "Sve prijave",
  statTotal: "Ukupno",
  statOpen: "Otvorene",
  statResolved: "Riješene",
  stats: "Pregled prijava",
} as const

export function homeNotice(reports: MapReport[], failed: boolean): string | null {
  return failed ? HOME_TEXT.failed : reports.length === 0 ? HOME_TEXT.empty : null
}

export type ReportStats = {
  total: number
  open: number
  resolved: number
}

// counts from the reports already on the page (no extra query)
export function reportStats(reports: MapReport[]): ReportStats {
  return {
    total: reports.length,
    open: reports.filter((r) => OPEN_STATUSES.includes(r.status)).length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  }
}

// Tailwind `lg` (64rem). The server renders the phone layout's map; a laptop swaps after hydration,
// so only one Leaflet map is ever mounted.
const LAPTOP_QUERY = "(min-width: 64rem)"

export function useIsLaptop(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(LAPTOP_QUERY)
      query.addEventListener("change", onChange)
      return () => query.removeEventListener("change", onChange)
    },
    () => window.matchMedia(LAPTOP_QUERY).matches,
    () => false,
  )
}

export function MapLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
      {HOME_TEXT.mapLoading}
    </div>
  )
}

export const ReportMap = dynamic(() => import("@/components/map/report-map").then((m) => m.ReportMap), {
  ssr: false,
  loading: () => <MapLoading />,
})

export function ReportListCard({
  report,
  onActiveChange,
}: {
  report: MapReport
  // laptop sidebar: hovering or focusing a card highlights its marker
  onActiveChange?: (id: string | null) => void
}) {
  return (
    <Link
      href={`/p/${report.code}`}
      className="block h-full rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      onMouseEnter={onActiveChange && (() => onActiveChange(report.id))}
      onMouseLeave={onActiveChange && (() => onActiveChange(null))}
      onFocus={onActiveChange && (() => onActiveChange(report.id))}
      onBlur={onActiveChange && (() => onActiveChange(null))}
    >
      {/* Equal padding on all sides: Card drops its top padding when an <img> is the first
          child (has-[>img:first-child]:pt-0), which pushed the thumbnail to the top edge.
          Fixed square thumbnail, text column centred next to it (prototype v2). */}
      <Card
        size="sm"
        className="h-full flex-row items-center gap-3 p-3 has-[>img:first-child]:pt-3 lg:transition-shadow lg:hover:ring-primary/40"
      >
        <ReportPhoto report={report} className="size-22 shrink-0 rounded-xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="line-clamp-2 font-heading leading-snug font-medium">
            {CATEGORIES[report.category].label}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={report.status} />
            {report.is_demo && <Badge variant="outline">{REPORT_SUMMARY_TEXT.demo}</Badge>}
          </div>
          {/* keep "Riješeno za 6 dana" and "7 podrški" whole; a narrow card wraps at the " · " */}
          <div className="[&_span:not([aria-hidden])]:whitespace-nowrap">
            <ReportCounters report={report} />
          </div>
        </div>
      </Card>
    </Link>
  )
}

// Three numbers: total, open, resolved (laptop sidebar)
export function StatTiles({ stats }: { stats: ReportStats }) {
  const tiles = [
    { label: HOME_TEXT.statTotal, value: stats.total },
    { label: HOME_TEXT.statOpen, value: stats.open },
    { label: HOME_TEXT.statResolved, value: stats.resolved },
  ]
  return (
    <dl aria-label={HOME_TEXT.stats} className="grid grid-cols-3 gap-2">
      {tiles.map((tile) => (
        <div key={tile.label} className="flex flex-col-reverse rounded-xl bg-muted/70 px-3 py-2">
          <dt className="text-xs text-muted-foreground">{tile.label}</dt>
          <dd className="font-heading text-xl leading-tight font-semibold tabular-nums">{tile.value}</dd>
        </div>
      ))}
    </dl>
  )
}
