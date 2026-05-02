import type { NewsItem } from '@/types/news'

/**
 * Group NewsItem[] by country code.
 *
 * - Outer order: groups sorted by latest article pubDate descending — the
 *   country whose freshest article is newest comes first ("what's hot now").
 *   Falls back to country code asc for ties (e.g. all groups missing pubDate).
 * - Inner order: each group's articles sorted by pubDate descending.
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

  // Inner sort: pubDate desc — the freshest article ends up at index 0.
  const lists = Array.from(buckets.values())
  for (const list of lists) {
    list.sort((a, b) => pubMs(b.pubDate) - pubMs(a.pubDate))
  }

  // Outer sort: latest pubDate desc (group's index-0 article); tie → country code asc.
  const entries: Array<[string, NewsItem[]]> = Array.from(buckets.entries())
  entries.sort((a, b) => {
    const ta = pubMs(a[1][0]?.pubDate)
    const tb = pubMs(b[1][0]?.pubDate)
    if (tb !== ta) return tb - ta
    return a[0].localeCompare(b[0])
  })

  return entries
}
