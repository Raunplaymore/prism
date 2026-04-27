import type { PolymarketEvent } from './types'
import {
  ALL_CATEGORY_IDS,
  PRISM_CATEGORIES,
  type PrismCategory,
} from './categories'
import { redisGet, redisSetEx } from './redis'

const GAMMA_API = 'https://gamma-api.polymarket.com'
const CACHE_TTL = 300 // 5 min — Polymarket prices update minute-to-minute

export interface ClassifiedEvent {
  event: PolymarketEvent
  category: PrismCategory
}

export interface FetchResult<T> {
  data: T
  cached: boolean
}

function cacheKey(slug: string, limit: number): string {
  return `polymarket:events:${slug}:top:${limit}`
}

// Drop heavy fields (full description, clob token IDs, addresses) before caching.
// The full payload is huge; slimmed it's typically ~10-20KB per category.
function slimEvent(e: PolymarketEvent): PolymarketEvent {
  return {
    id: e.id,
    ticker: e.ticker,
    slug: e.slug,
    title: e.title,
    image: e.image,
    icon: e.icon,
    startDate: e.startDate,
    endDate: e.endDate,
    active: e.active,
    closed: e.closed,
    archived: e.archived,
    liquidity: e.liquidity,
    volume: e.volume,
    volume24hr: e.volume24hr,
    volume1wk: e.volume1wk,
    openInterest: e.openInterest,
    competitive: e.competitive,
    tags: e.tags?.map((t) => ({
      id: t.id,
      label: t.label,
      slug: t.slug,
      forceShow: t.forceShow,
      forceHide: t.forceHide,
    })),
    series: e.series?.map((s) => ({
      id: s.id,
      ticker: s.ticker,
      slug: s.slug,
      title: s.title,
      recurrence: s.recurrence,
    })),
    markets: e.markets?.slice(0, 8).map((m) => ({
      id: m.id,
      question: m.question,
      slug: m.slug,
      outcomes: m.outcomes,
      outcomePrices: m.outcomePrices,
      groupItemTitle: m.groupItemTitle,
      volume24hr: m.volume24hr,
      active: m.active,
      closed: m.closed,
      endDate: m.endDate,
      oneHourPriceChange: m.oneHourPriceChange,
      oneDayPriceChange: m.oneDayPriceChange,
      oneWeekPriceChange: m.oneWeekPriceChange,
      lastTradePrice: m.lastTradePrice,
      bestBid: m.bestBid,
      bestAsk: m.bestAsk,
    })),
    eventMetadata: e.eventMetadata
      ? { context_description: e.eventMetadata.context_description }
      : undefined,
  }
}

async function fetchEventsBySlug(
  slug: string,
  limit: number,
): Promise<FetchResult<PolymarketEvent[]>> {
  const key = cacheKey(slug, limit)
  const cached = await redisGet(key)
  if (cached) {
    try {
      return { data: JSON.parse(cached) as PolymarketEvent[], cached: true }
    } catch {
      // Stale schema — fall through to refetch
    }
  }

  const url = `${GAMMA_API}/events?tag_slug=${encodeURIComponent(slug)}&active=true&closed=false&limit=${limit}&order=volume24hr&ascending=false`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Polymarket gamma-api ${res.status} (slug=${slug})`)
  const raw = (await res.json()) as PolymarketEvent[]
  const events = raw.map(slimEvent)
  await redisSetEx(key, JSON.stringify(events), CACHE_TTL)
  return { data: events, cached: false }
}

/**
 * Fetch the top events per category in parallel (one Polymarket call per slug).
 * Returns a map from PrismCategory id → ClassifiedEvent[]. Failures on individual
 * categories degrade gracefully to an empty list rather than failing the page.
 */
export async function fetchEventsByCategory(
  limitPerCategory = 50,
): Promise<FetchResult<Record<PrismCategory, ClassifiedEvent[]>>> {
  const results = await Promise.all(
    PRISM_CATEGORIES.map(async (cat) => {
      try {
        const r = await fetchEventsBySlug(cat.slug, limitPerCategory)
        return { id: cat.id, events: r.data, cached: r.cached }
      } catch {
        return { id: cat.id, events: [] as PolymarketEvent[], cached: false }
      }
    }),
  )

  const data = {} as Record<PrismCategory, ClassifiedEvent[]>
  for (const id of ALL_CATEGORY_IDS) data[id] = []
  let allCached = true
  for (const r of results) {
    data[r.id] = r.events.map((e) => ({ event: e, category: r.id }))
    if (!r.cached) allCached = false
  }
  return { data, cached: allCached }
}
