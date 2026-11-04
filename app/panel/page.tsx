import type { Metadata } from "next"

import { RowLinkCell } from "@/components/report/row-link-cell"
import { StatusBadge } from "@/components/report/status-badge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CATEGORIES, dayCounterText, likeCountText, PANEL_TEXT, SEVERITY_LABELS } from "@/lib/constants"
import { getInstitutionReports, requirePanelAccess } from "@/lib/panel/reports"

export const metadata: Metadata = { title: PANEL_TEXT.pageTitle }

// Institution panel `/panel` (PRD §4.3, FR-20): the reports whose current recipient is the
// official's institution, newest first. Filters and sorting are P1. Desktop-first, usable on a
// tablet (PRD §6).
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
          <CardTitle>{PANEL_TEXT.count(reports.length)}</CardTitle>
          <CardDescription>{PANEL_TEXT.listDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {failed || reports.length === 0 ? (
            <p className="text-muted-foreground">{failed ? PANEL_TEXT.failed : PANEL_TEXT.empty}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{PANEL_TEXT.columns.code}</TableHead>
                  <TableHead>{PANEL_TEXT.columns.category}</TableHead>
                  <TableHead>{PANEL_TEXT.columns.status}</TableHead>
                  <TableHead className="hidden md:table-cell">{PANEL_TEXT.columns.severity}</TableHead>
                  <TableHead>{PANEL_TEXT.columns.days}</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">{PANEL_TEXT.columns.likes}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const href = `/panel/prijave/${report.id}`
                  return (
                    <TableRow key={report.id}>
                      <RowLinkCell
                        href={href}
                        primary
                        className="font-medium whitespace-nowrap"
                        linkClassName="text-primary underline-offset-4 hover:underline"
                      >
                        {report.code}
                      </RowLinkCell>
                      <RowLinkCell href={href} className="min-w-56 whitespace-normal">
                        <p className="font-medium">{CATEGORIES[report.category].label}</p>
                        {report.address && <p className="text-muted-foreground">{report.address}</p>}
                        {(report.is_demo || report.is_hidden) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {report.is_demo && <Badge variant="outline">{PANEL_TEXT.demo}</Badge>}
                            {report.is_hidden && <Badge variant="secondary">{PANEL_TEXT.hidden}</Badge>}
                          </div>
                        )}
                      </RowLinkCell>
                      <RowLinkCell href={href} linkClassName="items-start">
                        <StatusBadge status={report.status} label="panel" />
                      </RowLinkCell>
                      <RowLinkCell href={href} className="hidden md:table-cell">
                        {report.severity ? SEVERITY_LABELS[report.severity].label : PANEL_TEXT.severityUnknown}
                      </RowLinkCell>
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
          )}
        </CardContent>
      </Card>
    </main>
  )
}
