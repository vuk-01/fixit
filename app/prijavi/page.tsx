import type { Metadata } from "next"

import { ReportFlow } from "@/components/report-flow/report-flow"
import { Card, CardContent } from "@/components/ui/card"
import { requireAccount } from "@/lib/auth"
import { REPORT_FLOW_TEXT } from "@/lib/constants"

export const metadata: Metadata = { title: REPORT_FLOW_TEXT.pageTitle }

// Report flow (FR-1…FR-5). Guests and anonymous sessions go to /uloguj-se and come back here;
// officials and admins cannot make reports (create_draft and the upload policy are for citizens).
export default async function ReportPage() {
  const account = await requireAccount("/prijavi")

  if (account.role !== "citizen") {
    return (
      <main className="mx-auto w-full max-w-md p-4">
        <Card>
          <CardContent>
            <p>{REPORT_FLOW_TEXT.citizensOnly}</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main>
      <ReportFlow />
    </main>
  )
}
