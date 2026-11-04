"use client"

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLiveLikeCounts } from "@/components/report/use-live-like-counts"
import {
  HOME_TEXT,
  homeNotice,
  MapLoading,
  ReportListCard,
  ReportMap,
  useIsLaptop,
} from "@/components/home/home-parts"
import { LaptopHome, type LaptopLayout } from "@/components/home/laptop-layouts"
import type { MapReport } from "@/lib/reports/public-map"

// Home `/` (UI.md, prototype v2): Mapa | Lista with Mapa as default, „Prijavi problem".
// The header („Fixit" / „Prijave u Podgorici", sign-in or the account menu) is SiteHeader in the layout.
// Below `lg` the phone layout; from `lg` one of three laptop layouts (`?izgled=a|b|c`, ticket 32)
// until Ivana picks one. Both are server-rendered and switched by CSS; the Leaflet map is mounted
// only in the one that is visible.
export function HomeView({
  reports: initialReports,
  failed,
  layout,
}: {
  reports: MapReport[]
  failed: boolean
  layout: LaptopLayout
}) {
  const reports = useLiveLikeCounts(initialReports)
  const isLaptop = useIsLaptop()

  return (
    <>
      <PhoneHome reports={reports} failed={failed} showMap={!isLaptop} />
      <LaptopHome layout={layout} reports={reports} failed={failed} showMap={isLaptop} />
    </>
  )
}

function PhoneHome({ reports, failed, showMap }: { reports: MapReport[]; failed: boolean; showMap: boolean }) {
  const notice = homeNotice(reports, failed)

  return (
    <div className="flex h-[calc(100svh-4rem-1px)] flex-col bg-muted/50 lg:hidden">
      <h1 className="sr-only">{HOME_TEXT.title}</h1>

      <Tabs defaultValue="mapa" className="min-h-0 flex-1 gap-0">
        {/* bars use the header's container (max-w-5xl px-4) so they line up with it on a tablet;
            the map itself stays full width */}
        <div className="border-b bg-background py-2">
          <div className="mx-auto max-w-5xl px-4">
            <TabsList className="w-full group-data-horizontal/tabs:h-11">
              <TabsTrigger value="mapa">{HOME_TEXT.tabMap}</TabsTrigger>
              <TabsTrigger value="lista">{HOME_TEXT.tabList}</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="mapa" className="relative min-h-0">
          {/* isolate: Leaflet's panes use z-index 400–1000; keep them below the header menu */}
          <div className="absolute inset-0 isolate">{showMap ? <ReportMap reports={reports} /> : <MapLoading />}</div>
          {notice && (
            <Card size="sm" className="absolute inset-x-4 bottom-8 z-10 px-4 text-center">
              <p>{notice}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lista" className="min-h-0 overflow-y-auto">
          {/* one column on a phone, cards side by side from a tablet up */}
          <ul className="mx-auto grid max-w-5xl gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
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
      </Tabs>

      {/* full width on a phone; from a tablet a fixed-width button on the right (Ivana, ticket 32) */}
      <div className="border-t bg-background pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-5xl px-4 md:flex md:justify-end">
          <Link href="/prijavi" className={buttonVariants({ className: "h-12 w-full text-base md:w-80" })}>
            {HOME_TEXT.report}
          </Link>
        </div>
      </div>
    </div>
  )
}
