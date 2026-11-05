import type { Metadata } from "next"

import { REPORT_ACCENT_TITLE, REPORT_CODE, REPORT_ROW_TINT } from "@/components/report/report-list-styles"
import { ReportFlags, ReportStackList } from "@/components/report/report-stack-list"
import { RowLinkCell } from "@/components/report/row-link-cell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getRoutingReports, requireAdmin, type RoutingListReport } from "@/lib/admin/reports"
import { ADMIN_TEXT, CATEGORIES, dayCounterText, likeCountText } from "@/lib/constants"
import { placeLabel } from "@/lib/geo/address"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: ADMIN_TEXT.pageTitle }

// `/admin` (PRD §4.4, §8 "Administrator", P0): reports in `routing` waiting for the administrator
// to choose the institution (FR-8, FR-23 manual assignment). Moderation and the `not_competent`
// list are P1. Desktop-first, usable on a tablet (PRD §6); below `md` the table becomes a stacked
// list in the same card, so a phone never scrolls sideways (UI.md "Report lists in /admin and
// /panel").
export default async function AdminPage() {
  await requireAdmin("/admin")
  const { reports, failed } = await getRoutingReports()

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{ADMIN_TEXT.pageTitle}</p>
        <h1 className="font-heading text-2xl font-semibold">{ADMIN_TEXT.listTitle}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={REPORT_ACCENT_TITLE}>{ADMIN_TEXT.count(reports.length)}</CardTitle>
          <CardDescription>{ADMIN_TEXT.listDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {failed || reports.length === 0 ? (
            <p className="text-muted-foreground">{failed ? ADMIN_TEXT.failed : ADMIN_TEXT.empty}</p>
          ) : (
            <>
              <ReportStackList
                reports={reports.map((report) => ({
                  id: report.id,
                  href: hrefOf(report),
                  code: report.code,
                  category: report.category,
                  address: report.address,
                  isDemo: report.is_demo,
                  isHidden: report.is_hidden,
                  detail: report.routingReason && (
                    <>
                      <span className="text-muted-foreground">{ADMIN_TEXT.columns.reason}: </span>
                      {ADMIN_TEXT.routingReason[report.routingReason]}
                    </>
                  ),
                  daysText: daysText(report),
                  likeCount: report.like_count,
                }))}
              />
              <ReportTable reports={reports} />
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

function hrefOf(report: RoutingListReport) {
  return `/admin/prijave/${report.id}`
}

function daysText(report: RoutingListReport) {
  return dayCounterText({ ...report, status: "routing", closed_at: null })
}

// From `md`: the table as before; every cell links to the report (RowLinkCell).
function ReportTable({ reports }: { reports: RoutingListReport[] }) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{ADMIN_TEXT.columns.code}</TableHead>
            <TableHead>{ADMIN_TEXT.columns.category}</TableHead>
            <TableHead>{ADMIN_TEXT.columns.reason}</TableHead>
            <TableHead>{ADMIN_TEXT.columns.days}</TableHead>
            <TableHead className="hidden text-right lg:table-cell">{ADMIN_TEXT.columns.likes}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const href = hrefOf(report)
            return (
              <TableRow key={report.id} className={REPORT_ROW_TINT}>
                <RowLinkCell
                  href={href}
                  primary
                  className="font-medium whitespace-nowrap"
                  linkClassName={cn(REPORT_CODE, "underline-offset-4 hover:underline")}
                >
                  {report.code}
                </RowLinkCell>
                <RowLinkCell href={href} className="min-w-56 whitespace-normal">
                  <p className="font-medium">{CATEGORIES[report.category].label}</p>
                  <p className="text-muted-foreground">{placeLabel(report.address)}</p>
                  <ReportFlags isDemo={report.is_demo} isHidden={report.is_hidden} />
                </RowLinkCell>
                <RowLinkCell href={href} className="whitespace-normal">
                  {report.routingReason ? ADMIN_TEXT.routingReason[report.routingReason] : null}
                </RowLinkCell>
                <RowLinkCell href={href} className="whitespace-normal">
                  {daysText(report)}
                </RowLinkCell>
                <RowLinkCell href={href} className="hidden text-right whitespace-nowrap lg:table-cell">
                  {likeCountText(report.like_count)}
                </RowLinkCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
