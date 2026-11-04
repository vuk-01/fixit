import type { Metadata } from "next"

import { RowLinkCell } from "@/components/report/row-link-cell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getRoutingReports, requireAdmin } from "@/lib/admin/reports"
import { ADMIN_TEXT, CATEGORIES, dayCounterText, likeCountText } from "@/lib/constants"

export const metadata: Metadata = { title: ADMIN_TEXT.pageTitle }

// `/admin` (PRD §4.4, §8 "Administrator", P0): reports in `routing` waiting for the administrator
// to choose the institution (FR-8, FR-23 manual assignment). Moderation and the `not_competent`
// list are P1. Desktop-first, usable on a tablet (PRD §6).
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
          <CardTitle>{ADMIN_TEXT.count(reports.length)}</CardTitle>
          <CardDescription>{ADMIN_TEXT.listDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {failed || reports.length === 0 ? (
            <p className="text-muted-foreground">{failed ? ADMIN_TEXT.failed : ADMIN_TEXT.empty}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ADMIN_TEXT.columns.code}</TableHead>
                  <TableHead>{ADMIN_TEXT.columns.category}</TableHead>
                  <TableHead className="hidden md:table-cell">{ADMIN_TEXT.columns.reason}</TableHead>
                  <TableHead>{ADMIN_TEXT.columns.days}</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">{ADMIN_TEXT.columns.likes}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const href = `/admin/prijave/${report.id}`
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
                            {report.is_demo && <Badge variant="outline">{ADMIN_TEXT.demo}</Badge>}
                            {report.is_hidden && <Badge variant="secondary">{ADMIN_TEXT.hidden}</Badge>}
                          </div>
                        )}
                      </RowLinkCell>
                      <RowLinkCell href={href} className="hidden whitespace-normal md:table-cell">
                        {report.routingReason ? ADMIN_TEXT.routingReason[report.routingReason] : null}
                      </RowLinkCell>
                      <RowLinkCell href={href} className="whitespace-normal">
                        {dayCounterText({ ...report, status: "routing", closed_at: null })}
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
