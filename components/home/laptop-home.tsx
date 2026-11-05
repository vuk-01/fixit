"use client"

import { Camera } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  HOME_TEXT,
  homeNotice,
  MapLegend,
  MapLoading,
  ReportListCard,
  ReportMap,
  reportStats,
  StatTiles,
} from "@/components/home/home-parts"
import type { MapReport } from "@/lib/reports/public-map"
import { cn } from "@/lib/utils"

// Home `/` from `lg` (ticket 32, Ivana's pick; UI.md "Home"): no tabs; a white list sidebar on the left
// (heading, counts, „Prijavi problem", the report cards on the ground colour) and the map filling the rest
// of the screen. Hovering or focusing a card highlights its marker. `data-header="wide"` makes SiteHeader
// span the screen, so the logo lines up with the sidebar. Never shown below `lg`.
export function LaptopHome({ reports, failed, showMap }: { reports: MapReport[]; failed: boolean; showMap: boolean }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const stats = useMemo(() => reportStats(reports), [reports])
  const notice = homeNotice(reports, failed)

  return (
    <div data-header="wide" className="hidden h-[calc(100svh-var(--header-height))] lg:flex">
      <aside className="flex w-100 shrink-0 flex-col border-r bg-background xl:w-105">
        <div className="flex flex-col gap-4 border-b p-4">
          <h1 className="text-[22px] leading-tight font-extrabold tracking-[-0.01em]">{HOME_TEXT.heading}</h1>
          <StatTiles stats={stats} />
          <Link
            href="/prijavi"
            className={cn(
              buttonVariants({ variant: "highlight" }),
              "h-12 w-full gap-2.5 text-[16px] shadow-[0_4px_12px_rgb(23_33_47/0.18)]",
            )}
          >
            <Camera aria-hidden className="size-[22px]" strokeWidth={2.5} />
            {HOME_TEXT.report}
          </Link>
        </div>
        <ul className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-ground p-4">
          {notice && (
            <li>
              <Card size="sm" className="px-4 text-center">
                <p>{notice}</p>
              </Card>
            </li>
          )}
          {reports.map((report) => (
            <li key={report.id}>
              <ReportListCard report={report} onActiveChange={setActiveId} />
            </li>
          ))}
        </ul>
      </aside>
      {/* isolate: Leaflet's panes use z-index 400–1000; keep them below the header menu */}
      <div className="relative isolate min-w-0 flex-1">
        {showMap ? (
          <ReportMap reports={reports} activeId={activeId} zoomClassName="right-4 bottom-8" />
        ) : (
          <MapLoading />
        )}
        <MapLegend />
      </div>
    </div>
  )
}
