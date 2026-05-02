import type { NewsItem } from '@/types/news'

/**
 * Group NewsItem[] by country code.
 *
 * - Outer order: groups sorted by article count descending (most-covered country first).
 * - Inner order: each group's articles sorted by pubDate descending (newest first).
 *
 * Returns a tuple array (not a Map) so callers can rely on iteration order
 * without converting back and forth.
 */
export function groupByCountry(items: NewsItem[]): Array<[string, NewsItem[]]> {
  if (!items || items.length === 0) return []

  const buckets = new Map<string, NewsItem[]>()
  for (const item of items) {
    const code = (item.country || '').toUpperCase()
    if (!code) continue
    const list = buckets.get(code)
    if (list) list.push(item)
    else buckets.set(code, [item])
  }

  const pubMs = (s?: string): number => {
    if (!s) return 0
    const t = new Date(s).getTime()
    return isNaN(t) ? 0 : t
  }

  // Inner sort: pubDate desc.
  const lists = Array.from(buckets.values())
  for (const list of lists) {
    list.sort((a, b) => pubMs(b.pubDate) - pubMs(a.pubDate))
  }

  // Outer sort: article count desc; ties broken by country code asc for stability.
  const entries: Array<[string, NewsItem[]]> = Array.from(buckets.entries())
  entries.sort((a, b) => {
    const diff = b[1].length - a[1].length
    if (diff !== 0) return diff
    return a[0].localeCompare(b[0])
  })

  return entries
}
