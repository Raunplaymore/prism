'use client'

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { createProjection } from '@/lib/map/projection'
import { createColorScale } from '@/lib/map/colorScale'
import countryCodeMap from '@/lib/map/countryCodeMap'

export interface MapSVGHandle {
  zoomIn: () => void
  zoomOut: () => void
}

interface MapSVGProps {
  onCountrySelect: (alpha2Code: string) => void
  onHover: (name: string | null, x: number, y: number) => void
  heatmapData: Record<string, number>
  selectedCountry: string | null
}

const MapSVG = forwardRef<MapSVGHandle, MapSVGProps>(function MapSVG(
  { onCountrySelect, onHover, heatmapData, selectedCountry },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const topoRef = useRef<Topology | null>(null)

  const render = useCallback(() => {
    const container = containerRef.current
    const svg = svgRef.current
    const topo = topoRef.current
    if (!container || !svg || !topo) return

    const width = container.clientWidth
    const height = container.clientHeight

    const d3svg = d3.select(svg)
    d3svg.attr('width', width).attr('height', height)

    const projection = createProjection(width, height)
    const path = d3.geoPath(projection)

    const countries = topojson.feature(
      topo,
      topo.objects.countries as GeometryCollection
    )

    const maxVal = Math.max(...Object.values(heatmapData), 0)
    const colorScale = createColorScale(maxVal)

    // Reverse lookup: alpha2 → numeric id for selected highlight
    const alpha2ToId: Record<string, string> = {}
    for (const [numId, a2] of Object.entries(countryCodeMap)) {
      alpha2ToId[a2] = numId
    }

    let g = d3svg.select<SVGGElement>('g.map-group')
    if (g.empty()) {
      g = d3svg.append('g').attr('class', 'map-group')
    }

    const paths = g.selectAll<SVGPathElement, d3.GeoPermissibleObjects>('path.country')
      .data(countries.features, (d: any) => d.id)

    paths.exit().remove()

    const enter = paths.enter()
      .append('path')
      .attr('class', 'country')
      .style('cursor', 'pointer')

    enter.merge(paths)
      .attr('d', path as any)
      .attr('fill', (d: any) => {
        const id = String(d.id).padStart(3, '0')
        const alpha2 = countryCodeMap[id]
        if (alpha2 && heatmapData[alpha2]) {
          return colorScale(heatmapData[alpha2])
        }
        return '#1e293b'
      })
      .attr('stroke', (d: any) => {
        const id = String(d.id).padStart(3, '0')
        const alpha2 = countryCodeMap[id]
        if (alpha2 && alpha2 === selectedCountry) {
          return '#facc15'
        }
        return '#334155'
      })
      .attr('stroke-width', (d: any) => {
        const id = String(d.id).padStart(3, '0')
        const alpha2 = countryCodeMap[id]
        return alpha2 && alpha2 === selectedCountry ? 2 : 0.5
      })
      .on('click', (_event: MouseEvent, d: any) => {
        const id = String(d.id).padStart(3, '0')
        const alpha2 = countryCodeMap[id]
        if (alpha2) {
          onCountrySelect(alpha2)
        }
      })
      .on('mousemove', (event: MouseEvent, d: any) => {
        const name = (d.properties && d.properties.name) || 'Unknown'
        onHover(name, event.clientX, event.clientY)
      })
      .on('mouseleave', () => {
        onHover(null, 0, 0)
      })
      .on('touchstart', (event: TouchEvent, d: any) => {
        event.preventDefault()
        const id = String(d.id).padStart(3, '0')
        const alpha2 = countryCodeMap[id]
        if (alpha2) {
          onCountrySelect(alpha2)
        }
      })

    // Draw sphere outline
    let spherePath = d3svg.select<SVGPathElement>('path.sphere')
    if (spherePath.empty()) {
      spherePath = g.insert('path', ':first-child').attr('class', 'sphere')
    }
    spherePath
      .datum({ type: 'Sphere' } as d3.GeoPermissibleObjects)
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#475569')
      .attr('stroke-width', 0.5)
  }, [heatmapData, selectedCountry, onCountrySelect, onHover])

  // Fetch TopoJSON on mount (once)
  useEffect(() => {
    fetch('/data/countries-110m.json')
      .then((res) => res.json())
      .then((data: Topology) => {
        topoRef.current = data
        render()
      })
      .catch((err) => console.error('Failed to load TopoJSON:', err))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Setup zoom
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const d3svg = d3.select(svg)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        d3svg.select('g.map-group').attr('transform', event.transform)
      })

    d3svg.call(zoom)
    zoomRef.current = zoom
  }, [])

  // Re-render on data changes
  useEffect(() => {
    render()
  }, [render])

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      render()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [render])

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const svg = svgRef.current
      const zoom = zoomRef.current
      if (svg && zoom) {
        d3.select(svg).transition().duration(300).call(zoom.scaleBy, 1.5)
      }
    },
    zoomOut: () => {
      const svg = svgRef.current
      const zoom = zoomRef.current
      if (svg && zoom) {
        d3.select(svg).transition().duration(300).call(zoom.scaleBy, 1 / 1.5)
      }
    },
  }))

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
})

export default MapSVG
