import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ADMIN_TEXT } from "@/lib/constants"
import { cn } from "@/lib/utils"

// A report that does not exist or is still a draft.
export default function AdminReportNotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>{ADMIN_TEXT.notFoundTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>{ADMIN_TEXT.notFound}</p>
          <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }), "h-11 self-start")}>
            {ADMIN_TEXT.back}
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
