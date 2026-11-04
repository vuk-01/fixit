"use client"

import "leaflet/dist/leaflet.css"

import { cn } from "cn"
import L from "leaflet"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { MapContainer, Marker, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet"

import { FitToContainer } from "@/components/map/fit-to-container"
import { ReportPopupContent } from "@/components/report/report-summary"
import {
  CATEGORIES,
  MAP_DEFAULT_ZOOM,
  MAP_TILES,
  PODGORICA_CENTER,
  STATUS_LABELS,
  STATUS_STYLE,
} from "@/lib/constants"
import type { MapReport } from "@/lib/reports/public-map"

const DEFAULT_INSET_LEFT = 56

// Loaded only in the browser through next/dynamic with ssr: false (Tech.md §8).
// Laptop layouts (ticket 32) may highlight one marker (`activeId`), move the zoom control to the
// right (`zoomRight`) and keep the centre and popups clear of a floating panel on the left
// (`insetLeft`, px; the default only clears the zoom control).
export function ReportMap({
  reports,
  activeId = null,
  zoomRight = false,
  insetLeft = DEFAULT_INSET_LEFT,
}: {
  reports: MapReport[]
  activeId?: string | null
  zoomRight?: boolean
  insetLeft?: number
}) {
  return (
    <MapContainer
      center={[PODGORICA_CENTER.lat, PODGORICA_CENTER.lng]}
      zoom={MAP_DEFAULT_ZOOM}
      zoomControl={!zoomRight}
      className="h-full w-full"
    >
      <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} maxZoom={MAP_TILES.maxZoom} />
      {zoomRight && <ZoomControl position="topright" />}
      <FitToContainer />
      {insetLeft > DEFAULT_INSET_LEFT && <ShiftCentre x={insetLeft / 2} />}
      {reports.map((report) => (
        <StatusMarker key={report.id} report={report} active={report.id === activeId} insetLeft={insetLeft} />
      ))}
    </MapContainer>
  )
}

// Puts Podgorica's centre `x` px right of the middle, into the part of the map a floating panel does
// not cover. Computed from the fixed centre, so running the effect twice (Strict Mode) is harmless.
function ShiftCentre({ x }: { x: number }) {
  const map = useMap()
  useEffect(() => {
    const zoom = map.getZoom()
    const point = map.project([PODGORICA_CENTER.lat, PODGORICA_CENTER.lng], zoom).subtract([x, 0])
    map.setView(map.unproject(point, zoom), zoom, { animate: false })
  }, [map, x])
  return null
}

// divIcon with the status colour and icon (UI.md); the React icon is portalled into the
// element Leaflet places on the map, so lucide icons work without rendering to a string.
function StatusMarker({ report, active, insetLeft }: { report: MapReport; active: boolean; insetLeft: number }) {
  const [container] = useState(() => document.createElement("div"))
  const [icon] = useState(() =>
    L.divIcon({
      html: container,
      className: "",
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -16],
    }),
  )
  const { colorClass, icon: Icon } = STATUS_STYLE[report.status]

  return (
    <>
      <Marker
        position={[report.lat, report.lng]}
        icon={icon}
        zIndexOffset={active ? 1000 : 0}
        title={`${CATEGORIES[report.category].label}, ${STATUS_LABELS[report.status].public}`}
      >
        {/* top-left padding keeps the opened popup clear of the zoom control */}
        <Popup minWidth={230} maxWidth={230} autoPanPaddingTopLeft={[insetLeft, 16]} autoPanPaddingBottomRight={[16, 32]}>
          <ReportPopupContent report={report} />
        </Popup>
      </Marker>
      {createPortal(
        <span className="flex size-11 items-center justify-center">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full border-2 border-white shadow-md ring-1 ring-black/50",
              colorClass,
              active && "scale-125 shadow-lg ring-4 ring-primary/60",
            )}
          >
            <Icon aria-hidden className="size-4" strokeWidth={2.5} />
          </span>
        </span>,
        container,
      )}
    </>
  )
}
