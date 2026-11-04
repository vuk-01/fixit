"use client"

import { Share2 } from "lucide-react"

import { useShareLink } from "@/components/report/use-share-link"
import { Button } from "@/components/ui/button"
import { SENT_TEXT } from "@/lib/constants"

// "Podijeli" on /p/[code] (PRD §8): the link of this public page.
export function ShareReportButton({ code }: { code: string }) {
  const { share, note } = useShareLink(`/p/${code}`, SENT_TEXT.shareTitle(code))
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="h-11 w-full"
        onClick={() => void share()}
      >
        <Share2 aria-hidden />
        {SENT_TEXT.share}
      </Button>
      {note && (
        <p className="text-sm break-all text-muted-foreground" role="status">
          {note}
        </p>
      )}
    </div>
  )
}
