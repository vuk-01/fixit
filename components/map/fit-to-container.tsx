"use client"

import { useEffect } from "react"
import { useMap } from "react-leaflet"

// Leaflet measures its container once; on a phone the panel settles its height after the map
// mounts (and changes on rotation or when the address bar hides), which leaves grey,
// half-loaded tiles. Re-measure whenever the container's size changes.
export function FitToContainer() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}
