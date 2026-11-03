"use client"

import Link from "next/link"
import dynamic from "next/dynamic"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportCounters, ReportPhoto, REPORT_SUMMARY_TEXT } from "@/components/report/report-summary"
import { StatusBadge } from "@/components/report/status-badge"
import { useLiveLikeCounts } from "@/components/report/use-live-like-counts"
import { APP_NAME, CATEGORIES } from "@/lib/constants"
import type { MapReport } from "@/lib/reports/public-map"

const HOME_TEXT = {
  subtitle: "Prijave u Podgorici",
  tabMap: "Mapa",
  tabList: "Lista",
  report: "Prijavi problem",
  signIn: "Uloguj se",
  mapLoading: "Učitavam mapu…",
  empty: "Još nema prijava. Budite prvi koji će prijaviti problem.",
  failed: "Prijave trenutno nije moguće učitati. Pokušajte ponovo za nekoliko minuta.",
} as const

const ReportMap = dynamic(() => import("@/components/map/report-map").then((m) => m.ReportMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
      {HOME_TEXT.mapLoading}
    </div>
  ),
})

// Home `/` (UI.md, prototype v2): header, Mapa | Lista with Mapa as default, „Prijavi problem".
export function HomeView({ reports: initialReports, failed }: { reports: MapReport[]; failed: boolean }) {
  const reports = useLiveLikeCounts(initialReports)
  const notice = failed ? HOME_TEXT.failed : reports.length === 0 ? HOME_TEXT.empty : null

  return (
    <div className="flex h-svh flex-col bg-muted/50">
      <header className="flex items-center justify-between gap-3 border-b bg-background px-4 py-2">
        <div>
          <h1 className="font-heading text-xl leading-tight font-semibold">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">{HOME_TEXT.subtitle}</p>
        </div>
        <Link href="/uloguj-se" className={buttonVariants({ variant: "ghost", className: "h-11 px-3" })}>
          {HOME_TEXT.signIn}
        </Link>
      </header>

      <Tabs defaultValue="mapa" className="min-h-0 flex-1 gap-0">
        <div className="border-b bg-background px-4 py-2">
          <TabsList className="w-full group-data-horizontal/tabs:h-11">
            <TabsTrigger value="mapa">{HOME_TEXT.tabMap}</TabsTrigger>
            <TabsTrigger value="lista">{HOME_TEXT.tabList}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="mapa" className="relative min-h-0">
          <div className="absolute inset-0">
            <ReportMap reports={reports} />
          </div>
          {notice && (
            <Card size="sm" className="absolute inset-x-4 bottom-8 z-[1000] px-4 text-center">
              <p>{notice}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lista" className="min-h-0 overflow-y-auto">
          <ul className="flex flex-col gap-3 p-4">
            {notice && (
              <li>
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

      <div className="border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link href="/prijavi" className={buttonVariants({ className: "h-12 w-full text-base" })}>
          {HOME_TEXT.report}
        </Link>
      </div>
    </div>
  )
}

function ReportListCard({ report }: { report: MapReport }) {
  return (
    <Link
      href={`/p/${report.code}`}
      className="block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Card size="sm" className="flex-row gap-3 px-3">
        <ReportPhoto report={report} className="size-20 shrink-0 rounded-lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-heading leading-snug font-medium">{CATEGORIES[report.category].label}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={report.status} />
            {report.is_demo && <Badge variant="outline">{REPORT_SUMMARY_TEXT.demo}</Badge>}
          </div>
          <ReportCounters report={report} />
        </div>
      </Card>
    </Link>
  )
}
