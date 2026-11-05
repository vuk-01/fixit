"use client"

import { Camera, List, Map as MapGlyph } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLiveLikeCounts } from "@/components/report/use-live-like-counts"
import {
  HOME_TEXT,
  homeNotice,
  MapLegend,
  MapLoading,
  ReportListCard,
  ReportMap,
  useIsLaptop,
} from "@/components/home/home-parts"
import { LaptopHome } from "@/components/home/laptop-home"
import type { MapReport } from "@/lib/reports/public-map"
import { cn } from "@/lib/utils"

// Home `/` (UI.md "Fixit design", "Home"). Below `lg` the phone layout: the map (default tab) or the
// list between the header and a bottom navigation bar with Mapa and Lista as tabs on either side and
// „Prijavi problem" raised in the middle. From `lg` the list sidebar + map (LaptopHome, ticket 32). Both
// are server-rendered and switched by CSS; the Leaflet map is mounted only in the one that is visible.
export function HomeView({ reports: initialReports, failed }: { reports: MapReport[]; failed: boolean }) {
  const reports = useLiveLikeCounts(initialReports)
  const isLaptop = useIsLaptop()

  return (
    <>
      <PhoneHome reports={reports} failed={failed} showMap={!isLaptop} />
      <LaptopHome reports={reports} failed={failed} showMap={isLaptop} />
    </>
  )
}

// a bottom-bar tab: icon in a pill (navy with an amber icon when active) over its label
const NAV_TAB =
  "h-[3.75rem] flex-col gap-0.5 rounded-xl px-1 text-[13px] font-bold text-muted-foreground data-active:bg-transparent data-active:text-foreground"
const NAV_TAB_ICON =
  "flex h-7 w-15 items-center justify-center rounded-full transition-colors in-data-active:bg-primary in-data-active:text-highlight"

function PhoneHome({ reports, failed, showMap }: { reports: MapReport[]; failed: boolean; showMap: boolean }) {
  const notice = homeNotice(reports, failed)

  return (
    <div className="flex h-[calc(100svh-var(--header-height))] flex-col bg-ground lg:hidden">
      <h1 className="sr-only">{HOME_TEXT.title}</h1>

      <Tabs defaultValue="mapa" className="min-h-0 flex-1 gap-0">
        <TabsContent value="mapa" className="relative isolate min-h-0">
          {/* isolate: Leaflet's panes use z-index 400–1000; keep them below the header menu. The raised
              „Prijavi problem" overlaps the map's bottom edge, so the attribution is lifted above it
              (Leaflet's CSS is unlayered, hence the !) */}
          <div className="absolute inset-0 isolate [&_.leaflet-bottom]:bottom-7!">
            {showMap ? <ReportMap reports={reports} zoomClassName="right-3 bottom-14" /> : <MapLoading />}
          </div>
          <MapLegend />
          {notice && (
            <Card size="sm" className="absolute inset-x-4 bottom-10 z-[600] px-4 text-center">
              <p>{notice}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lista" className="min-h-0 overflow-y-auto">
          {/* one column on a phone, two from a tablet up; grid-cols-1 + min-w-0, or a long address would
              size the column to its full width (UI.md "Page widths") */}
          <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-2.5 p-4 pb-8 md:grid-cols-2 [&>li]:min-w-0">
            {notice && (
              <li className="col-span-full">
                <Card size="sm" className="px-4 text-center">
                  <p>{notice}</p>
                </Card>
              </li>
            )}
            {reports.map((report) => (
              <li key={report.id}>
                <ReportListCard report={report} />
              </li>
            ))}
          </ul>
        </TabsContent>

        <nav className="relative z-10 grid shrink-0 grid-cols-[1fr_auto_1fr] items-end border-t bg-background px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <TabsList className="contents">
            <TabsTrigger value="mapa" className={cn(NAV_TAB, "col-start-1 row-start-1")}>
              <span className={NAV_TAB_ICON}>
                <MapGlyph aria-hidden className="size-6" />
              </span>
              {HOME_TEXT.tabMap}
            </TabsTrigger>
            <TabsTrigger value="lista" className={cn(NAV_TAB, "col-start-3 row-start-1")}>
              <span className={NAV_TAB_ICON}>
                <List aria-hidden className="size-6" />
              </span>
              {HOME_TEXT.tabList}
            </TabsTrigger>
          </TabsList>
          {/* raised 14 px above the bar, with a white ring that separates it from the map */}
          <Link
            href="/prijavi"
            className={cn(
              buttonVariants({ variant: "highlight" }),
              "col-start-2 row-start-1 mb-1.5 h-14 -translate-y-3.5 gap-2.5 px-5 text-[16.5px] shadow-[0_8px_18px_rgb(23_33_47/0.28)] ring-4 ring-white",
            )}
          >
            <Camera aria-hidden className="size-6" strokeWidth={2.5} />
            {HOME_TEXT.report}
          </Link>
        </nav>
      </Tabs>
    </div>
  )
}
