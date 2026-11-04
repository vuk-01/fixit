"use client"

import "leaflet/dist/leaflet.css"

import { useEffect } from "react"
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet"

import { FitToContainer } from "@/components/map/fit-to-container"
import { MAP_TILES } from "@/lib/constants"

export type MapView = { lat: number; lng: number; zoom: number }

// Map under a pin fixed in the centre (FR-3, ticket 15): the citizen moves the map, the
// point is the map centre. Loaded only in the browser through next/dynamic (Tech.md §8).
export function LocationPicker({
  initial,
  target,
  onSettle,
  onUserMove,
}: {
  initial: MapView
  // a new object moves the map there (e.g. the device location arrived)
  target: MapView | null
  onSettle: (center: { lat: number; lng: number }) => void
  onUserMove: () => void
}) {
  return (
    <MapContainer
      center={[initial.lat, initial.lng]}
      zoom={initial.zoom}
      className="h-full w-full"
    >
      <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} maxZoom={MAP_TILES.maxZoom} />
      <FitToContainer />
      <Controller target={target} onSettle={onSettle} onUserMove={onUserMove} />
    </MapContainer>
  )
}

function Controller({
  target,
  onSettle,
  onUserMove,
}: {
  target: MapView | null
  onSettle: (center: { lat: number; lng: number }) => void
  onUserMove: () => void
}) {
  const map = useMap()

  useMapEvents({
    dragstart: onUserMove,
    moveend: () => {
      const c = map.getCenter()
      onSettle({ lat: c.lat, lng: c.lng })
    },
  })

  useEffect(() => {
    if (target) map.setView([target.lat, target.lng], target.zoom)
  }, [map, target])

  // report the starting point once, so the address is looked up without a move
  useEffect(() => {
    const c = map.getCenter()
    onSettle({ lat: c.lat, lng: c.lng })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  return null
}
