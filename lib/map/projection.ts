import * as d3 from 'd3'

export function createProjection(width: number, height: number) {
  const scale = Math.min(width, height) / 1.8
  return d3
    .geoOrthographic()
    .scale(scale)
    .translate([width / 2, height / 2])
    .rotate([-127, -36, 0]) // centered on Korea (127°E, 36°N)
    .clipAngle(90)
}
