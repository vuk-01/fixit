"use client"

import { Camera } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  HOME_TEXT,
  homeNotice,
  MapLoading,
  ReportListCard,
  ReportMap,
  reportStats,
  StatTiles,
  statsLine,
  StatusLegend,
} from "@/components/home/home-parts"
import type { MapReport } from "@/lib/reports/public-map"
import { cn } from "@/lib/utils"

// Three candidate laptop layouts for `/` (ticket 32), chosen with `?izgled=a|b|c` so Ivana can compare
// them on the preview. Only one stays; the other two are deleted before merge.
export type LaptopLayout = "a" | "b" | "c"

type LayoutProps = { reports: MapReport[]; failed: boolean; showMap: boolean }

// Full-height layouts (a, c) widen the header to the screen edges from `lg` (SiteHeader reads
// `data-header="wide"`), so the logo lines up with the sidebar or the floating panel.
const FULL_HEIGHT = "h-[calc(100svh-4rem-1px)]"

export function LaptopHome({ layout, ...props }: LayoutProps & { layout: LaptopLayout }) {
  // never shown below lg: the phone layout in HomeView is unchanged
  return (
    <div className="hidden lg:block">
      {layout === "b" ? <ContainedLayout {...props} /> : layout === "c" ? <FloatingLayout {...props} /> : <SidebarLayout {...props} />}
    </div>
  )
}

function ReportButton({ className }: { className?: string }) {
  return (
    <Link href="/prijavi" className={buttonVariants({ className: cn("h-11 gap-2 text-base", className) })}>
      <Camera aria-hidden data-icon="inline-start" />
      {HOME_TEXT.report}
    </Link>
  )
}

function Notice({ text }: { text: string }) {
  return (
    <Card size="sm" className="px-4 text-center">
      <p>{text}</p>
    </Card>
  )
}

// a) Map with a list sidebar: no tabs; cards on the left, hovering a card highlights its marker.
function SidebarLayout({ reports, failed, showMap }: LayoutProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const stats = useMemo(() => reportStats(reports), [reports])
  const notice = homeNotice(reports, failed)

  return (
    <div data-header="wide" className={cn("flex", FULL_HEIGHT)}>
      <aside className="flex w-100 shrink-0 flex-col border-r bg-background xl:w-105">
        <div className="flex flex-col gap-4 border-b p-4">
          <h1 className="font-heading text-xl leading-tight font-semibold">{HOME_TEXT.heading}</h1>
          <StatTiles stats={stats} />
          <ReportButton className="w-full" />
        </div>
        <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-muted/50 p-4">
          {notice && (
            <li>
              <Notice text={notice} />
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
        {showMap ? <ReportMap reports={reports} activeId={activeId} /> : <MapLoading />}
      </div>
    </div>
  )
}

// b) Contained: the header's container (max-w-5xl), a heading row with counts, Mapa | Lista and the
// button, the map in a rounded card with a fixed height and a status legend under it.
function ContainedLayout({ reports, failed, showMap }: LayoutProps) {
  const stats = useMemo(() => reportStats(reports), [reports])
  const notice = homeNotice(reports, failed)

  return (
    <div className="min-h-[calc(100svh-4rem-1px)] bg-muted/50">
      <Tabs defaultValue="mapa" className="mx-auto max-w-5xl gap-4 px-4 py-6">
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl leading-tight font-semibold">{HOME_TEXT.heading}</h1>
            <p className="mt-1 text-muted-foreground">{statsLine(stats)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <TabsList className="w-52 bg-background ring-1 ring-foreground/10 group-data-horizontal/tabs:h-11">
              <TabsTrigger value="mapa" className="data-active:bg-muted">
                {HOME_TEXT.tabMap}
              </TabsTrigger>
              <TabsTrigger value="lista" className="data-active:bg-muted">
                {HOME_TEXT.tabList}
              </TabsTrigger>
            </TabsList>
            <ReportButton className="px-5" />
          </div>
        </div>

        <TabsContent value="mapa" className="flex flex-col gap-3">
          {/* fills the screen under the heading row and above the legend (about 224 px together) */}
          <Card className="relative isolate h-[calc(100svh-14rem)] min-h-96 p-0 shadow-sm">
            {showMap ? <ReportMap reports={reports} /> : <MapLoading />}
            {notice && (
              <div className="absolute inset-x-4 bottom-8 z-1000">
                <Notice text={notice} />
              </div>
            )}
          </Card>
          <StatusLegend stats={stats} className="flex flex-wrap gap-x-5 gap-y-2 [&>li]:justify-start [&>li]:gap-1.5" />
        </TabsContent>

        <TabsContent value="lista">
          <ul className="grid grid-cols-3 gap-3">
            {notice && (
              <li className="col-span-full">
                <Notice text={notice} />
              </li>
            )}
            {reports.map((report) => (
              <li key={report.id}>
                <ReportListCard report={report} />
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// c) Full-height map with a floating panel on the left: Mapa shows the summary and the status
// legend, Lista opens the cards inside the panel; the map stays behind it.
const PANEL_WIDTH = 360
const PANEL_GAP = 16

function FloatingLayout({ reports, failed, showMap }: LayoutProps) {
  const [tab, setTab] = useState<"mapa" | "lista">("mapa")
  const [activeId, setActiveId] = useState<string | null>(null)
  const stats = useMemo(() => reportStats(reports), [reports])
  const notice = homeNotice(reports, failed)

  return (
    <div data-header="wide" className={cn("relative isolate", FULL_HEIGHT)}>
      <div className="absolute inset-0 isolate">
        {showMap ? (
          <ReportMap reports={reports} activeId={activeId} zoomRight insetLeft={PANEL_WIDTH + 2 * PANEL_GAP} />
        ) : (
          <MapLoading />
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as "mapa" | "lista")}
        className="pointer-events-none absolute inset-y-4 left-4 z-10 gap-0"
        style={{ width: PANEL_WIDTH }}
      >
        <Card
          className={cn(
            "pointer-events-auto max-h-full gap-0 py-0 shadow-xl ring-foreground/10",
            tab === "lista" && "h-full",
          )}
        >
          <div className="flex flex-col gap-4 p-4">
            <h1 className="font-heading text-xl leading-tight font-semibold">{HOME_TEXT.heading}</h1>
            <TabsList className="w-full group-data-horizontal/tabs:h-11">
              <TabsTrigger value="mapa">{HOME_TEXT.tabMap}</TabsTrigger>
              <TabsTrigger value="lista">{HOME_TEXT.tabList}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="mapa" className="flex flex-col gap-4 px-4 pb-4">
            {notice && <p className="text-center text-muted-foreground">{notice}</p>}
            <StatTiles stats={stats} />
            {stats.byStatus.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">{HOME_TEXT.legend}</h2>
                <StatusLegend stats={stats} className="flex flex-col gap-2" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="lista" className="min-h-0 overflow-y-auto border-t bg-muted/50">
            <ul className="flex flex-col gap-3 p-3">
              {notice && (
                <li>
                  <Notice text={notice} />
                </li>
              )}
              {reports.map((report) => (
                <li key={report.id}>
                  <ReportListCard report={report} onActiveChange={setActiveId} />
                </li>
              ))}
            </ul>
          </TabsContent>

          <div className="border-t p-4">
            <ReportButton className="w-full" />
          </div>
        </Card>
      </Tabs>
    </div>
  )
}
