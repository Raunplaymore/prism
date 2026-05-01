import { redis, redisPipeline, getFeed } from '@/lib/cache'
import type { NewsItem } from '@/types/news'
import { VOCABULARY, type KeywordEntry } from './vocabulary'

const KW_TTL = 24 * 60 * 60 // 24h — match feed TTL

/**
 * Add an article id to each of its keyword Sets, refreshing TTL.
 * Idempotent: SADD on an existing member is a no-op.
 */
export async function indexArticleKeywords(
  articleId: string,
  keywords: string[],
): Promise<void> {
  if (!articleId || !keywords || keywords.length === 0) return
  const cmds: string[][] = []
  for (const slug of keywords) {
    if (!slug) continue
    const key = `kw:${slug}`
    cmds.push(['SADD', key, articleId])
    cmds.push(['EXPIRE', key, String(KW_TTL)])
  }
  if (cmds.length === 0) return
  try {
    await redisPipeline(cmds)
  } catch {
    // non-critical — keyword index is rebuilt on next ingest
  }
}

/**
 * Bulk-index a batch of articles in one round trip.
 * Used by the /api/news/collect summarize step.
 */
export async function indexBatch(items: NewsItem[]): Promise<void> {
  const cmds: string[][] = []
  for (const item of items) {
    if (!item.keywords || item.keywords.length === 0) continue
    for (const slug of item.keywords) {
      if (!slug) continue
      const key = `kw:${slug}`
      cmds.push(['SADD', key, item.id])
      cmds.push(['EXPIRE', key, String(KW_TTL)])
    }
  }
  if (cmds.length === 0) return
  try {
    await redisPipeline(cmds)
  } catch {
    // ignore
  }
}

/** Article ids associated with a slug, or [] when missing. */
export async function getArticleIdsForKeyword(slug: string): Promise<string[]> {
  try {
    const ids = (await redis(['SMEMBERS', `kw:${slug}`])) as string[] | null
    return ids ?? []
  } catch {
    return []
  }
}

/**
 * Fetch all NewsItems matching a keyword, across every cached country.
 * Strategy: read each pinned country's feed, filter to ids in the keyword Set.
 * Cheap because feeds are 12-ish keys and pulled in a single pipeline.
 */
export async function getArticlesByKeyword(slug: string): Promise<NewsItem[]> {
  const ids = await getArticleIdsForKeyword(slug)
  if (ids.length === 0) return []
  const idSet = new Set(ids)

  // Discover which feeds exist
  let keys: string[] = []
  try {
    keys = ((await redis(['KEYS', 'feed:*:ko'])) as string[]) ?? []
  } catch {
    return []
  }
  if (keys.length === 0) return []

  // Pipeline-GET all feeds at once
  const cmds = keys.map((k) => ['GET', k])
  let results: unknown[] = []
  try {
    results = await redisPipeline(cmds)
  } catch {
    return []
  }

  const out: NewsItem[] = []
  for (const raw of results) {
    if (typeof raw !== 'string' || !raw) continue
    try {
      const feed = JSON.parse(raw) as { items?: NewsItem[] }
      for (const item of feed.items ?? []) {
        if (idSet.has(item.id)) out.push(item)
      }
    } catch {
      // skip malformed
    }
  }

  // Sort by pubDate desc
  out.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
    return db - da
  })
  return out
}

/** Look up a vocabulary entry by canonical slug. */
export function findEntry(slug: string): KeywordEntry | null {
  const lo = slug.toLowerCase()
  return VOCABULARY.find((e) => e.slug.toLowerCase() === lo) ?? null
}

export interface KeywordCount {
  entry: KeywordEntry
  count: number
}

/**
 * Snapshot of all live keywords: every kw:{slug} key with its SCARD,
 * resolved to a vocabulary entry. Unknown slugs (not in vocabulary) and
 * zero-count keys are dropped.
 */
export async function getLiveKeywordCounts(): Promise<KeywordCount[]> {
  let keys: string[] = []
  try {
    keys = ((await redis(['KEYS', 'kw:*'])) as string[]) ?? []
  } catch {
    return []
  }
  if (keys.length === 0) return []

  let counts: unknown[] = []
  try {
    counts = await redisPipeline(keys.map((k) => ['SCARD', k]))
  } catch {
    return []
  }

  const out: KeywordCount[] = []
  for (let i = 0; i < keys.length; i++) {
    const slug = keys[i].replace(/^kw:/, '')
    const entry = findEntry(slug)
    if (!entry) continue
    const n = Number(counts[i] ?? 0)
    if (n <= 0) continue
    out.push({ entry, count: n })
  }
  out.sort((a, b) => b.count - a.count)
  return out
}
