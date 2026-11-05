"use client"

import "leaflet/dist/leaflet.css"

import { cn } from "cn"
import L from "leaflet"
import { Minus, Plus } from "lucide-react"
import { useState } from "react"
import { createPortal } from "react-dom"
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"

import { FitToContainer } from "@/components/map/fit-to-container"
import { ReportPopupContent } from "@/components/report/report-summary"
import {
  calendarDaysBetween,
  CATEGORIES,
  MAP_DEFAULT_ZOOM,
  MAP_TILES,
  PODGORICA_CENTER,
  STATUS_LABELS,
  STATUS_STYLE,
} from "@/lib/constants"
import type { MapReport } from "@/lib/reports/public-map"

export const MAP_TEXT = {
  zoomIn: "Uvećaj mapu",
  zoomOut: "Umanji mapu",
  // Leaflet's own label on the popup's close button is English ("Close popup")
  closePopup: "Zatvori pregled prijave",
} as const

// Loaded only in the browser through next/dynamic with ssr: false (Tech.md §8). UI.md "Map": the
// zoom buttons are ours (navy squares), the markers are status chips stuck into the map on a needle,
// and the popup is `.report-popup` (globals.css). On a laptop the list sidebar highlights the marker of
// the hovered card (`activeId`, ticket 32).
export function ReportMap({
  reports,
  activeId = null,
  zoomClassName,
}: {
  reports: MapReport[]
  activeId?: string | null
  // where the zoom buttons sit; each layout has its own overlays
  zoomClassName: string
}) {
  const [map, setMap] = useState<L.Map | null>(null)

  return (
    <div className="relative size-full">
      <MapContainer
        ref={setMap}
        center={[PODGORICA_CENTER.lat, PODGORICA_CENTER.lng]}
        zoom={MAP_DEFAULT_ZOOM}
        zoomControl={false}
        className="size-full"
      >
        <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} maxZoom={MAP_TILES.maxZoom} />
        <FitToContainer />
        {reports.map((report) => (
          <StatusMarker key={report.id} report={report} active={report.id === activeId} />
        ))}
      </MapContainer>
      {map && <ZoomButtons map={map} className={zoomClassName} />}
    </div>
  )
}

// two navy 44 px squares, 4 px apart, above the map panes (Leaflet uses z-index 400–1000)
function ZoomButtons({ map, className }: { map: L.Map; className: string }) {
  const button =
    "flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_2px_8px_rgb(0_0_0/0.25)] outline-none focus-visible:ring-[3px] focus-visible:ring-highlight active:bg-primary/90"
  return (
    <div className={cn("absolute z-[500] flex flex-col gap-1", className)}>
      <button type="button" aria-label={MAP_TEXT.zoomIn} className={button} onClick={() => map.zoomIn()}>
        <Plus aria-hidden className="size-5" strokeWidth={2.25} />
      </button>
      <button type="button" aria-label={MAP_TEXT.zoomOut} className={button} onClick={() => map.zoomOut()}>
        <Minus aria-hidden className="size-5" strokeWidth={2.25} />
      </button>
    </div>
  )
}

// divIcon with the status colour and icon (UI.md); the React content is portalled into the element
// Leaflet places on the map, so lucide icons work without rendering to a string. The icon box is
// 72 × 46 px and its anchor is the needle's point (36, 42): the chip (status square + days since the
// report) on top, a 3 × 14 px navy needle, and a soft shadow where it enters the map.
function StatusMarker({ report, active }: { report: MapReport; active: boolean }) {
  const [container] = useState(() => document.createElement("div"))
  const [icon] = useState(() =>
    L.divIcon({
      html: container,
      className: "",
      iconSize: [72, 46],
      iconAnchor: [36, 42],
      popupAnchor: [0, -40],
    }),
  )
  const { colorClass, icon: Icon } = STATUS_STYLE[report.status]
  const days = calendarDaysBetween(
    new Date(report.submitted_at),
    report.closed_at ? new Date(report.closed_at) : new Date(),
  )

  return (
    <>
      <Marker
        position={[report.lat, report.lng]}
        icon={icon}
        zIndexOffset={active ? 1000 : 0}
        title={`${CATEGORIES[report.category].label}, ${STATUS_LABELS[report.status].public}`}
      >
        <Popup
          minWidth={240}
          maxWidth={240}
          className="report-popup"
          autoPanPaddingTopLeft={[16, 72]}
          autoPanPaddingBottomRight={[64, 120]}
          eventHandlers={{
            add: (event) => {
              const close = (event.target as L.Popup).getElement()?.querySelector(".leaflet-popup-close-button")
              close?.setAttribute("aria-label", MAP_TEXT.closePopup)
            },
          }}
        >
          <ReportPopupContent report={report} />
        </Popup>
      </Marker>
      {createPortal(
        <span
          className={cn(
            "flex h-[46px] w-[72px] origin-[50%_91%] flex-col items-center transition-transform duration-150",
            active && "scale-115",
          )}
        >
          <span
            className={cn(
              "flex items-stretch overflow-hidden rounded-lg shadow-[0_3px_8px_rgb(23_33_47/0.35)] ring-2 ring-white",
              active && "ring-highlight",
            )}
          >
            <span className={cn("flex size-7 items-center justify-center", colorClass)}>
              <Icon aria-hidden className="size-4" strokeWidth={2.5} />
            </span>
            <span className="flex min-w-7 items-center justify-center bg-primary px-1.5 font-mono text-[13px] leading-none font-semibold text-primary-foreground tabular-nums">
              {days}
            </span>
          </span>
          <span className="h-3.5 w-[3px] rounded-b-full bg-primary" />
          <span className="-mt-[3px] h-[5px] w-3 rounded-[50%] bg-black/35 blur-[1px]" />
        </span>,
        container,
      )}
    </>
  )
}
