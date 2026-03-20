'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import MapSVG, { type MapSVGHandle } from './MapSVG'
import CountryTooltip from './CountryTooltip'
import MapControls from './MapControls'

export interface WorldMapHandle {
  rotateTo: (lon: number, lat: number) => void
}

interface WorldMapProps {
  onCountrySelect: (alpha2Code: string) => void
  heatmapData: Record<string, number>
  selectedCountry: string | null
  rotateTarget?: [number, number] | null
}

export default function WorldMap({
  onCountrySelect,
  heatmapData,
  selectedCountry,
  rotateTarget,
}: WorldMapProps) {
  const mapRef = useRef<MapSVGHandle>(null)
  const [tooltip, setTooltip] = useState<{
    name: string | null
    x: number
    y: number
  }>({ name: null, x: 0, y: 0 })

  const handleHover = useCallback((name: string | null, x: number, y: number) => {
    setTooltip({ name, x, y })
  }, [])

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut()
  }, [])

  const handleResetZoom = useCallback(() => {
    if (rotateTarget) {
      mapRef.current?.rotateTo(rotateTarget[0], rotateTarget[1])
    } else {
      mapRef.current?.resetZoom()
    }
  }, [rotateTarget])

  // Rotate globe when rotateTarget changes
  useEffect(() => {
    if (rotateTarget) {
      mapRef.current?.rotateTo(rotateTarget[0], rotateTarget[1])
    }
  }, [rotateTarget])

  return (
    <div className="relative h-full w-full">
      <MapSVG
        ref={mapRef}
        onCountrySelect={onCountrySelect}
        onHover={handleHover}
        heatmapData={heatmapData}
        selectedCountry={selectedCountry}
      />
      <CountryTooltip name={tooltip.name} x={tooltip.x} y={tooltip.y} />
      <MapControls zoomIn={handleZoomIn} zoomOut={handleZoomOut} resetZoom={handleResetZoom} />
    </div>
  )
}
