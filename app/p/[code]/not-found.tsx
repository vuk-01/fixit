import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PUBLIC_REPORT_TEXT } from "@/lib/constants"
import { cn } from "@/lib/utils"

// An unknown code, a draft and a hidden report give this same page (ticket #13).
export default function PublicReportNotFound() {
  return (
    <div className="min-h-[calc(100svh-4rem-1px)] bg-muted/50">
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>{PUBLIC_REPORT_TEXT.notFoundTitle}</h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p>{PUBLIC_REPORT_TEXT.notFound}</p>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 self-start"
              )}
            >
              {PUBLIC_REPORT_TEXT.backToMap}
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
