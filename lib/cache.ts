// Upstash Redis REST API — direct fetch (no SDK, edge-compatible)

function getConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN')
  return { url, token }
}

async function redis(command: string[]): Promise<unknown> {
  const { url, token } = getConfig()
  const res = await fetch(`${url}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Redis error')
  return data.result
}

async function redisPipeline(commands: string[][]): Promise<unknown[]> {
  const { url, token } = getConfig()
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })
  const data = await res.json()
  if (!res.ok) throw new Error('Redis pipeline error')
  return data.map((r: { result: unknown }) => r.result)
}

const FEED_TTL = 24 * 60 * 60 // 24 hours
const REFRESH_INTERVAL = 6 * 60 * 60 // 6 hours — minimum between refreshes
const USAGE_TTL = 24 * 60 * 60 // 24 hours
const ARTICLE_MAX_AGE = 24 * 60 * 60 * 1000 // 24h in ms

function feedKey(country: string, lang: string): string {
  return `feed:${country.toUpperCase()}:${lang}`
}

function usageKey(ip: string, date: string): string {
  return `usage:${ip}:${date}`
}

export interface FeedItem {
  id: string
  url: string
  addedAt?: string
}

export interface FeedCache {
  items: FeedItem[]
  lastRefreshed: string
}

/** Read the accumulated feed. Prunes articles >24h automatically. */
export async function getFeed(country: string, lang: string): Promise<FeedCache | null> {
  try {
    const raw = await redis(['GET', feedKey(country, lang)]) as string | null
    if (!raw) return null
    const feed = JSON.parse(raw) as FeedCache
    const now = Date.now()
    feed.items = feed.items.filter((item) => {
      if (!item.addedAt) return true
      return now - new Date(item.addedAt).getTime() < ARTICLE_MAX_AGE
    })
    return feed
  } catch {
    return null
  }
}

/** Check if feed needs a refresh (>4h since last) */
export function needsRefresh(feed: FeedCache | null): boolean {
  if (!feed) return true
  const elapsed = Date.now() - new Date(feed.lastRefreshed).getTime()
  return elapsed > REFRESH_INTERVAL * 1000
}

/** Merge new articles into existing feed. Dedup by URL, new on top. */
export async function mergeFeed(
  country: string,
  lang: string,
  newItems: FeedItem[],
): Promise<FeedItem[]> {
  const existing = await getFeed(country, lang)
  const existingItems = existing?.items ?? []

  // Stamp addedAt on new items
  const now = new Date().toISOString()
  const stamped = newItems.map((i) => ({ ...i, addedAt: i.addedAt || now }))

  // Dedup: keep new articles, skip if URL already exists
  const existingUrls = new Set(existingItems.map((i) => i.url))
  const fresh = stamped.filter((i) => !existingUrls.has(i.url))

  // New on top, old on bottom
  const merged = [...fresh, ...existingItems]

  // Prune >24h
  const nowMs = Date.now()
  const pruned = merged.filter((item) => {
    if (!item.addedAt) return true
    return nowMs - new Date(item.addedAt).getTime() < ARTICLE_MAX_AGE
  })

  const feed: FeedCache = {
    items: pruned,
    lastRefreshed: new Date().toISOString(),
  }

  try {
    await redis(['SET', feedKey(country, lang), JSON.stringify(feed), 'EX', String(FEED_TTL)])
  } catch {
    // non-critical
  }

  return pruned
}

// --- Legacy compat: used by admin cache clear ---
function newsKey(country: string, lang: string): string {
  return `feed:${country.toUpperCase()}:${lang}`
}

export async function getCachedNews(country: string, lang: string) {
  return getFeed(country, lang)
}

export async function setCachedNews(
  country: string,
  lang: string,
  items: unknown[],
): Promise<void> {
  // Wrap items with addedAt for feed format
  const now = new Date().toISOString()
  const feedItems = (items as FeedItem[]).map((item) => ({
    ...item,
    addedAt: item.addedAt || now,
  }))
  await mergeFeed(country, lang, feedItems)
}

export async function deleteCachedNews(country: string, lang: string): Promise<boolean> {
  try {
    const deleted = await redis(['DEL', newsKey(country, lang)]) as number
    return deleted > 0
  } catch {
    return false
  }
}

export async function deleteCachedNewsAllLangs(country: string): Promise<number> {
  let count = 0
  for (const lang of ['en', 'ko']) {
    const deleted = await redis(['DEL', newsKey(country, lang)]) as number
    count += deleted
  }
  return count
}

// --- Token usage tracking ---

export interface TokenStats {
  totalPrompt: number
  totalCompletion: number
  totalCost: number
  calls: number
}

const TOKEN_STATS_KEY = 'stats:tokens'
const TOKEN_LOG_KEY = 'stats:token_log'

// gpt-4o-mini pricing: $0.15/1M input, $0.60/1M output
const INPUT_COST_PER_TOKEN = 0.15 / 1_000_000
const OUTPUT_COST_PER_TOKEN = 0.60 / 1_000_000

export async function recordTokenUsage(
  promptTokens: number,
  completionTokens: number,
  country: string,
  method: 'rss' | 'search' | 'markets',
): Promise<void> {
  const cost = promptTokens * INPUT_COST_PER_TOKEN + completionTokens * OUTPUT_COST_PER_TOKEN
  try {
    await redisPipeline([
      ['HINCRBY', TOKEN_STATS_KEY, 'totalPrompt', String(promptTokens)],
      ['HINCRBY', TOKEN_STATS_KEY, 'totalCompletion', String(completionTokens)],
      ['HINCRBYFLOAT', TOKEN_STATS_KEY, 'totalCost', String(cost)],
      ['HINCRBY', TOKEN_STATS_KEY, 'calls', '1'],
    ])

    const entry = JSON.stringify({
      time: new Date().toISOString(),
      country,
      method,
      prompt: promptTokens,
      completion: completionTokens,
      cost: +cost.toFixed(6),
    })
    await redis(['LPUSH', TOKEN_LOG_KEY, entry])
    await redis(['LTRIM', TOKEN_LOG_KEY, '0', '499'])
  } catch {
    // non-critical
  }
}

export async function getTokenStats(): Promise<TokenStats> {
  try {
    const raw = await redis(['HGETALL', TOKEN_STATS_KEY]) as string[]
    if (!raw || raw.length === 0) return { totalPrompt: 0, totalCompletion: 0, totalCost: 0, calls: 0 }
    const data: Record<string, string> = {}
    for (let i = 0; i < raw.length; i += 2) {
      data[raw[i]] = raw[i + 1]
    }
    return {
      totalPrompt: Number(data.totalPrompt) || 0,
      totalCompletion: Number(data.totalCompletion) || 0,
      totalCost: Number(data.totalCost) || 0,
      calls: Number(data.calls) || 0,
    }
  } catch {
    return { totalPrompt: 0, totalCompletion: 0, totalCost: 0, calls: 0 }
  }
}

export async function getTokenLog(offset = 0, limit = 20): Promise<{ items: unknown[]; total: number; hasMore: boolean }> {
  try {
    const total = await redis(['LLEN', TOKEN_LOG_KEY]) as number
    const log = await redis(['LRANGE', TOKEN_LOG_KEY, String(offset), String(offset + limit - 1)]) as string[]
    const items = log.map((entry) => typeof entry === 'string' ? JSON.parse(entry) : entry)
    return { items, total, hasMore: offset + limit < total }
  } catch {
    return { items: [], total: 0, hasMore: false }
  }
}

export async function getUsageCount(ip: string): Promise<number> {
  const date = new Date().toISOString().split('T')[0]
  try {
    const count = await redis(['GET', usageKey(ip, date)]) as string | null
    return count ? Number(count) : 0
  } catch {
    return 0
  }
}

export async function incrementUsage(ip: string): Promise<number> {
  const date = new Date().toISOString().split('T')[0]
  const key = usageKey(ip, date)
  try {
    const count = await redis(['INCR', key]) as number
    if (count === 1) {
      await redis(['EXPIRE', key, String(USAGE_TTL)])
    }
    return count
  } catch {
    return 0
  }
}
