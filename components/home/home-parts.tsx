"use client"

import { HeartHandshake } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useSyncExternalStore } from "react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ReportPhoto, REPORT_SUMMARY_TEXT } from "@/components/report/report-summary"
import { StatusBadge } from "@/components/report/status-badge"
import {
  calendarDaysBetween,
  CATEGORIES,
  dayCounterText,
  dayWord,
  likeCountText,
  OPEN_STATUSES,
} from "@/lib/constants"
import { placeLabel } from "@/lib/geo/address"
import type { MapReport } from "@/lib/reports/public-map"
import { cn } from "@/lib/utils"

export const HOME_TEXT = {
  title: "Prijave u Podgorici",
  tabMap: "Mapa",
  tabList: "Lista",
  report: "Prijavi problem",
  mapLoading: "Učitavam mapu…",
  empty: "Još nema prijava. Budite prvi koji će prijaviti problem.",
  failed: "Prijave trenutno nije moguće učitati. Pokušajte ponovo za nekoliko minuta.",
  // the number on a map marker (Vuk, 5. 11. 2026)
  legend: "Broj na oznaci: dani od prijave",
  legendSample: "14",
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

// What the number on a marker means; top-left over the map (UI.md "Map")
export function MapLegend() {
  return (
    <p className="pointer-events-none absolute top-3 left-3 z-[600] flex items-center gap-2 rounded-full bg-white/95 py-1 pr-3 pl-1 text-[12.5px] font-semibold shadow-[0_2px_8px_rgb(23_33_47/0.18)]">
      <span
        aria-hidden
        className="rounded-[5px] bg-primary px-1.5 py-0.5 font-mono text-[12px] leading-none text-primary-foreground"
      >
        {HOME_TEXT.legendSample}
      </span>
      {HOME_TEXT.legend}
    </p>
  )
}

// A report in the list (UI.md "Report card"): the day count leads like a departure time (blue
// `report-day` with off-white figures for every report but a resolved one, which is light green as a
// whole card with dark figures), then category, address, status and supports, and the photo on the
// right with a straight inner edge. The status badge keeps its own colour, icon and text.
export function ReportListCard({
  report,
  onActiveChange,
}: {
  report: MapReport
  // laptop sidebar: hovering or focusing a card highlights its marker
  onActiveChange?: (id: string | null) => void
}) {
  const days = calendarDaysBetween(
    new Date(report.submitted_at),
    report.closed_at ? new Date(report.closed_at) : new Date(),
  )
  const resolved = report.status === "resolved"

  return (
    <Link
      href={`/p/${report.code}`}
      className="group/report relative block h-full rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
      onMouseEnter={onActiveChange && (() => onActiveChange(report.id))}
      onMouseLeave={onActiveChange && (() => onActiveChange(null))}
      onFocus={onActiveChange && (() => onActiveChange(report.id))}
      onBlur={onActiveChange && (() => onActiveChange(null))}
    >
      <Card
        className={cn(
          "h-full flex-row items-stretch gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_1px_2px_rgb(23_33_47/0.08)] ring-border lg:transition-shadow lg:group-hover/report:ring-2 lg:group-hover/report:ring-highlight",
          resolved && "bg-report-resolved",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "flex w-18 shrink-0 flex-col items-center justify-center gap-1",
            resolved ? "bg-report-resolved-day text-foreground" : "bg-report-day text-report-day-foreground",
          )}
        >
          <span className="font-mono text-[30px] leading-none font-semibold tabular-nums">
            {days}
          </span>
          <span className="text-[11px] leading-none font-bold tracking-[0.08em] uppercase">
            {dayWord(days)}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
          <p className="line-clamp-2 text-[15.5px] leading-snug font-bold">{CATEGORIES[report.category].label}</p>
          <p className="truncate text-[13px] text-muted-foreground">{placeLabel(report.address)}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={report.status} />
            {report.is_demo && <Badge variant="outline">{REPORT_SUMMARY_TEXT.demo}</Badge>}
          </div>
          <p className="flex flex-wrap items-center gap-x-1 text-[13px] text-muted-foreground">
            <span className="sr-only">{dayCounterText(report)}, </span>
            <HeartHandshake aria-hidden className="size-3.5" />
            <span className="whitespace-nowrap">{likeCountText(report.like_count)}</span>
          </p>
        </div>
        {/* straight inner edge like the day column: Card rounds a last-child <img> at the bottom
            (*:[img:last-child]:rounded-b-xl), so the photo opts out and the card's own clip rounds only
            its outer corners. Only size and corners go here: the same classes land on the <img>,
            where padding would show the muted background as strips beside the photo. Without a
            photo the column holds NoPhoto, whose label is set smaller through its span. */}
        <ReportPhoto report={report} className="w-20 shrink-0 self-stretch rounded-none! [&>span]:text-[11px]" />
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
        <div key={tile.label} className="flex flex-col-reverse gap-1 rounded-xl bg-ground px-3 py-2.5">
          <dt className="text-xs font-semibold text-muted-foreground">{tile.label}</dt>
          <dd className="font-mono text-2xl leading-none font-semibold tabular-nums">{tile.value}</dd>
        </div>
      ))}
    </dl>
  )
}
