"use client"

import { MapPin } from "lucide-react"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { REPORT_FLOW_TEXT } from "@/lib/constants"

import type { ConfirmedPoint, FlowPhoto } from "./flow-state"
import { PhotoStrip } from "./photo-strip"

// End of #8: the confirmed point inside Podgorica. #9/#10 continue from here (agent steps,
// category picker, review).
export function ConfirmedStep({
  point,
  photos,
  onEdit,
}: {
  point: ConfirmedPoint
  photos: FlowPhoto[]
  onEdit: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="font-heading text-xl">{REPORT_FLOW_TEXT.confirmedTitle}</h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="flex items-start gap-2">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <span data-testid="confirmed-address">
                {point.address ?? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`}
              </span>
            </p>
            <PhotoStrip photos={photos} />
            <p className="text-muted-foreground">{REPORT_FLOW_TEXT.confirmedNext}</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button size="lg" variant="outline" className="h-12 w-full text-base" onClick={onEdit}>
          {REPORT_FLOW_TEXT.changeLocation}
        </Button>
        <Link href="/" className={buttonVariants({ variant: "ghost", className: "h-11 w-full" })}>
          {REPORT_FLOW_TEXT.cancel}
        </Link>
      </div>
    </div>
  )
}
