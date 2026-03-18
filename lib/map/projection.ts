import * as d3 from 'd3'

export function createProjection(width: number, height: number) {
  return d3
    .geoNaturalEarth1()
    .fitSize([width, height], { type: 'Sphere' } as d3.GeoPermissibleObjects)
}
