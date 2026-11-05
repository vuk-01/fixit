import type { Metadata } from "next"

import { REPORT_ACCENT_TITLE, REPORT_CODE, REPORT_ROW_TINT } from "@/components/report/report-list-styles"
import { ReportFlags, ReportStackList } from "@/components/report/report-stack-list"
import { RowLinkCell } from "@/components/report/row-link-cell"
import { StatusBadge } from "@/components/report/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CATEGORIES, dayCounterText, likeCountText, PANEL_TEXT, SEVERITY_LABELS } from "@/lib/constants"
import { placeLabel } from "@/lib/geo/address"
import { getInstitutionReports, requirePanelAccess, type PanelListReport } from "@/lib/panel/reports"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: PANEL_TEXT.pageTitle }

// Institution panel `/panel` (PRD §4.3, FR-20): the reports whose current recipient is the
// official's institution, newest first. Filters and sorting are P1. Desktop-first, usable on a
// tablet (PRD §6); below `md` the table becomes a stacked list in the same card, so a phone never
// scrolls sideways (UI.md "Report lists in /admin and /panel").
export default async function PanelPage() {
  const access = await requirePanelAccess("/panel", "list")
  // the list is for officials only; requirePanelAccess sends everyone else away
  if (access.kind !== "official") return null

  const { institutionName, reports, failed } = await getInstitutionReports(access.institutionId)

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
      <div className="flex flex-col gap-1">
        {institutionName && <p className="text-sm text-muted-foreground">{institutionName}</p>}
        <h1 className="font-heading text-2xl font-semibold">{PANEL_TEXT.listTitle}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={REPORT_ACCENT_TITLE}>{PANEL_TEXT.count(reports.length)}</CardTitle>
          <CardDescription>{PANEL_TEXT.listDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {failed || reports.length === 0 ? (
            <p className="text-muted-foreground">{failed ? PANEL_TEXT.failed : PANEL_TEXT.empty}</p>
          ) : (
            <>
              <ReportStackList
                reports={reports.map((report) => ({
                  id: report.id,
                  href: hrefOf(report),
                  code: report.code,
                  category: report.category,
                  address: report.address,
                  status: report.status,
                  isDemo: report.is_demo,
                  isHidden: report.is_hidden,
                  detail: (
                    <>
                      <span className="text-muted-foreground">{PANEL_TEXT.columns.severity}: </span>
                      {severityText(report)}
                    </>
                  ),
                  daysText: dayCounterText(report),
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

function hrefOf(report: PanelListReport) {
  return `/panel/prijave/${report.id}`
}

function severityText(report: PanelListReport) {
  return report.severity ? SEVERITY_LABELS[report.severity].label : PANEL_TEXT.severityUnknown
}

// From `md`: the table as before; every cell links to the report (RowLinkCell).
function ReportTable({ reports }: { reports: PanelListReport[] }) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{PANEL_TEXT.columns.code}</TableHead>
            <TableHead>{PANEL_TEXT.columns.category}</TableHead>
            <TableHead>{PANEL_TEXT.columns.status}</TableHead>
            <TableHead>{PANEL_TEXT.columns.severity}</TableHead>
            <TableHead>{PANEL_TEXT.columns.days}</TableHead>
            <TableHead className="hidden text-right lg:table-cell">{PANEL_TEXT.columns.likes}</TableHead>
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
                <RowLinkCell href={href} linkClassName="items-start">
                  <StatusBadge status={report.status} label="panel" />
                </RowLinkCell>
                <RowLinkCell href={href}>{severityText(report)}</RowLinkCell>
                <RowLinkCell href={href} className="whitespace-normal">
                  {dayCounterText(report)}
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
