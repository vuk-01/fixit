"use client"

import { cn } from "cn"
import type L from "leaflet"
import { Minus, Plus } from "lucide-react"

export const ZOOM_TEXT = {
  zoomIn: "Uvećaj mapu",
  zoomOut: "Umanji mapu",
} as const

// UI.md "Map": our own zoom buttons, two navy 44 px squares, 4 px apart, above the map panes
// (Leaflet uses z-index 400–1000). Leaflet's zoom control is off wherever these are used.
export function ZoomButtons({ map, className }: { map: L.Map; className: string }) {
  const button =
    "flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_2px_8px_rgb(0_0_0/0.25)] outline-none focus-visible:ring-[3px] focus-visible:ring-highlight active:bg-primary/90"
  return (
    <div className={cn("absolute z-[500] flex flex-col gap-1", className)}>
      <button type="button" aria-label={ZOOM_TEXT.zoomIn} className={button} onClick={() => map.zoomIn()}>
        <Plus aria-hidden className="size-5" strokeWidth={2.25} />
      </button>
      <button type="button" aria-label={ZOOM_TEXT.zoomOut} className={button} onClick={() => map.zoomOut()}>
        <Minus aria-hidden className="size-5" strokeWidth={2.25} />
      </button>
    </div>
  )
}
