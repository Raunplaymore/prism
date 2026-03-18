import * as d3 from 'd3'

export function createColorScale(maxValue: number) {
  return d3
    .scaleSequential(d3.interpolateBlues)
    .domain([0, Math.max(maxValue, 1)])
}
