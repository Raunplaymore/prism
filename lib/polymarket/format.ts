// Helpers for rendering Polymarket data in the UI.

export function parseStringArray(s: string | undefined): string[] {
  if (!s) return []
  try {
    const arr = JSON.parse(s)
    return Array.isArray(arr) ? arr.map((x) => String(x)) : []
  } catch {
    return []
  }
}

export function parseNumberArray(s: string | undefined): number[] {
  if (!s) return []
  try {
    const arr = JSON.parse(s)
    return Array.isArray(arr) ? arr.map((x) => Number(x)) : []
  } catch {
    return []
  }
}

export function formatPercent(p: number | undefined): string {
  if (p === undefined || !Number.isFinite(p)) return '—'
  if (p < 0.005) return '<1%'
  if (p > 0.995) return '>99%'
  return `${Math.round(p * 100)}%`
}

export function formatVolume(v: number | undefined): string {
  if (!v || v <= 0) return '—'
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}k`
  return `$${v.toFixed(0)}`
}
