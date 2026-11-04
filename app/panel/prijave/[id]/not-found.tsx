import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PANEL_TEXT } from "@/lib/constants"
import { cn } from "@/lib/utils"

// A report that does not exist, is a draft, or is not addressed to the official's institution.
export default function PanelReportNotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>{PANEL_TEXT.notFoundTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>{PANEL_TEXT.notFound}</p>
          <Link href="/panel" className={cn(buttonVariants({ variant: "outline" }), "h-11 self-start")}>
            {PANEL_TEXT.back}
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
