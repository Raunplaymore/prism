import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const NEWS_TTL = 4 * 60 * 60 // 4 hours
const USAGE_TTL = 24 * 60 * 60 // 24 hours

function newsKey(country: string, lang: string): string {
  return `news:${country.toUpperCase()}:${lang}`
}

function usageKey(ip: string, date: string): string {
  return `usage:${ip}:${date}`
}

export async function getCachedNews(country: string, lang: string) {
  try {
    const data = await redis.get<{ items: unknown[]; cachedAt: string }>(newsKey(country, lang))
    return data
  } catch {
    return null
  }
}

export async function setCachedNews(
  country: string,
  lang: string,
  items: unknown[],
): Promise<void> {
  const cachedAt = new Date().toISOString()
  try {
    await redis.set(newsKey(country, lang), { items, cachedAt }, { ex: NEWS_TTL })
  } catch {
    // cache write failure is non-critical
  }
}

export async function deleteCachedNews(country: string, lang: string): Promise<boolean> {
  try {
    const deleted = await redis.del(newsKey(country, lang))
    return deleted > 0
  } catch {
    return false
  }
}

export async function deleteCachedNewsAllLangs(country: string): Promise<number> {
  let count = 0
  for (const lang of ['en', 'ko']) {
    const deleted = await redis.del(newsKey(country, lang))
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
  method: 'rss' | 'search',
): Promise<void> {
  const cost = promptTokens * INPUT_COST_PER_TOKEN + completionTokens * OUTPUT_COST_PER_TOKEN
  try {
    // Increment totals
    const pipeline = redis.pipeline()
    pipeline.hincrby(TOKEN_STATS_KEY, 'totalPrompt', promptTokens)
    pipeline.hincrby(TOKEN_STATS_KEY, 'totalCompletion', completionTokens)
    pipeline.hincrbyfloat(TOKEN_STATS_KEY, 'totalCost', cost)
    pipeline.hincrby(TOKEN_STATS_KEY, 'calls', 1)
    await pipeline.exec()

    // Append to log (keep last 100)
    const entry = JSON.stringify({
      time: new Date().toISOString(),
      country,
      method,
      prompt: promptTokens,
      completion: completionTokens,
      cost: +cost.toFixed(6),
    })
    await redis.lpush(TOKEN_LOG_KEY, entry)
    await redis.ltrim(TOKEN_LOG_KEY, 0, 99)
  } catch {
    // non-critical
  }
}

export async function getTokenStats(): Promise<TokenStats> {
  try {
    const data = await redis.hgetall<Record<string, string>>(TOKEN_STATS_KEY)
    if (!data) return { totalPrompt: 0, totalCompletion: 0, totalCost: 0, calls: 0 }
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

export async function getTokenLog(): Promise<unknown[]> {
  try {
    const log = await redis.lrange(TOKEN_LOG_KEY, 0, 49)
    return log.map((entry) => typeof entry === 'string' ? JSON.parse(entry) : entry)
  } catch {
    return []
  }
}

export async function getUsageCount(ip: string): Promise<number> {
  const date = new Date().toISOString().split('T')[0]
  try {
    const count = await redis.get<number>(usageKey(ip, date))
    return count ?? 0
  } catch {
    return 0
  }
}

export async function incrementUsage(ip: string): Promise<number> {
  const date = new Date().toISOString().split('T')[0]
  const key = usageKey(ip, date)
  try {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, USAGE_TTL)
    }
    return count
  } catch {
    return 0
  }
}
