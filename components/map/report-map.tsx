"use client"

import "leaflet/dist/leaflet.css"

import { cn } from "cn"
import L from "leaflet"
import { useState } from "react"
import { createPortal } from "react-dom"
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"

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

// Loaded only in the browser through next/dynamic with ssr: false (Tech.md §8).
export function ReportMap({ reports }: { reports: MapReport[] }) {
  return (
    <MapContainer
      center={[PODGORICA_CENTER.lat, PODGORICA_CENTER.lng]}
      zoom={MAP_DEFAULT_ZOOM}
      className="h-full w-full"
    >
      <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} maxZoom={MAP_TILES.maxZoom} />
      {reports.map((report) => (
        <StatusMarker key={report.id} report={report} />
      ))}
    </MapContainer>
  )
}

// divIcon with the status colour and icon (UI.md); the React icon is portalled into the
// element Leaflet places on the map, so lucide icons work without rendering to a string.
function StatusMarker({ report }: { report: MapReport }) {
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
        title={`${CATEGORIES[report.category].label}, ${STATUS_LABELS[report.status].public}`}
      >
        {/* top-left padding keeps the opened popup clear of the zoom control */}
        <Popup minWidth={230} maxWidth={230} autoPanPaddingTopLeft={[56, 16]} autoPanPaddingBottomRight={[16, 32]}>
          <ReportPopupContent report={report} />
        </Popup>
      </Marker>
      {createPortal(
        <span className="flex size-11 items-center justify-center">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full border-2 border-white shadow-md ring-1 ring-black/50",
              colorClass,
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
