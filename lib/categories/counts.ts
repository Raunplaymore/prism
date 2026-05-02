import { redis, redisPipeline } from '@/lib/cache'
import type { NewsItem } from '@/types/news'
import { CATEGORY_KEYS, type CategoryKey, isValidCategory } from '@/lib/categories'

/**
 * Aggregate article counts per category across all live ko feeds.
 *
 * Strategy mirrors lib/keywords/index.ts#getArticlesByKeyword:
 *   1. KEYS feed:*:ko to discover live country feeds
 *   2. one pipeline GET fetches every feed in a single round trip
 *   3. count categories in memory
 *
 * The ko feed is the canonical localized snapshot (ingest writes ko first,
 * en mirrors it). Counting once on ko avoids double-counting and matches
 * how the keyword index discovers articles.
 *
 * Every CategoryKey is initialized to 0 so the UI can show "0 articles" for
 * empty categories without extra null checks.
 */
export async function getCategoryCounts(): Promise<Record<CategoryKey, number>> {
  // Initialize all keys to 0 up-front.
  const counts = {} as Record<CategoryKey, number>
  for (const key of CATEGORY_KEYS) counts[key] = 0

  // 1. Discover live ko feeds.
  let keys: string[] = []
  try {
    keys = ((await redis(['KEYS', 'feed:*:ko'])) as string[]) ?? []
  } catch {
    return counts
  }
  if (keys.length === 0) return counts

  // 2. Pipeline-GET all feeds at once.
  let results: unknown[] = []
  try {
    results = await redisPipeline(keys.map((k) => ['GET', k]))
  } catch {
    return counts
  }

  // 3. Tally categories across every feed item.
  for (const raw of results) {
    if (typeof raw !== 'string' || !raw) continue
    try {
      const feed = JSON.parse(raw) as { items?: NewsItem[] }
      for (const item of feed.items ?? []) {
        const cat = item.category
        if (typeof cat === 'string' && isValidCategory(cat)) {
          counts[cat]++
        }
      }
    } catch {
      // skip malformed feed entries
    }
  }

  return counts
}
