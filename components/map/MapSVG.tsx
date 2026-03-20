'use client'

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { createProjection } from '@/lib/map/projection'
import { createColorScale } from '@/lib/map/colorScale'
import countryCodeMap from '@/lib/map/countryCodeMap'
import { SUPPORTED_COUNTRIES } from '@/lib/rss'

export interface MapSVGHandle {
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  rotateTo: (lon: number, lat: number) => void
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
  const rotationRef = useRef<[number, number, number]>([-127, -36, 0])

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
    projection.rotate(rotationRef.current)
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
      .style('cursor', (d: any) => {
        const id = String(d.id).padStart(3, '0')
        const alpha2 = countryCodeMap[id]
        return alpha2 && SUPPORTED_COUNTRIES.has(alpha2) ? 'pointer' : 'default'
      })

    const merged = enter.merge(paths)
    merged.attr('d', path as any)
    merged.transition().duration(300)
      .attr('fill', (d: any) => {
        const id = String(d.id).padStart(3, '0')
        const alpha2 = countryCodeMap[id]
        if (alpha2 && heatmapData[alpha2]) {
          return colorScale(heatmapData[alpha2])
        }
        // Supported = brighter, unsupported = dim
        if (alpha2 && SUPPORTED_COUNTRIES.has(alpha2)) {
          return '#1e3a5f'
        }
        return '#111827'
      })

    merged
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
      .attr('fill', '#0a1628')
      .attr('stroke', '#334155')
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

  // Setup drag rotation for orthographic globe
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const d3svg = d3.select(svg)
    let dragStartRotation: [number, number, number] = [0, 0, 0]

    const drag = d3.drag<SVGSVGElement, unknown>()
      .on('drag', (event) => {
        const sensitivity = 0.4
        const [lam, phi, gamma] = rotationRef.current
        rotationRef.current = [
          lam + event.dx * sensitivity,
          Math.max(-60, Math.min(60, phi - event.dy * sensitivity)),
          gamma,
        ]
        render()
      })

    d3svg.call(drag as unknown as (selection: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void)

    // Zoom for scale — keep globe centered
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 4])
      .filter((event) => event.type === 'wheel' || event.type === 'dblclick')
      .on('zoom', (event) => {
        const container = containerRef.current
        if (!container) return
        const cx = container.clientWidth / 2
        const cy = container.clientHeight / 2
        d3svg.select('g.map-group')
          .attr('transform', `translate(${cx},${cy}) scale(${event.transform.k}) translate(${-cx},${-cy})`)
      })

    d3svg.call(zoom)
    zoomRef.current = zoom
  }, [render])

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
    resetZoom: () => {
      const svg = svgRef.current
      const zoom = zoomRef.current
      rotationRef.current = [-127, -36, 0]
      render()
      if (svg && zoom) {
        d3.select(svg).transition().duration(400).call(zoom.transform, d3.zoomIdentity)
      }
    },
    rotateTo: (lon: number, lat: number) => {
      const target: [number, number, number] = [-lon, -lat, 0]
      const start = [...rotationRef.current] as [number, number, number]
      const steps = 30
      let step = 0
      const animate = () => {
        step++
        const t = step / steps
        const ease = t * (2 - t) // ease-out quad
        rotationRef.current = [
          start[0] + (target[0] - start[0]) * ease,
          start[1] + (target[1] - start[1]) * ease,
          0,
        ]
        render()
        if (step < steps) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    },
  }))

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
})

export default MapSVG
