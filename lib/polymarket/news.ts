import { fetchOneRss } from '@/lib/rss'
import type { NewsItem } from '@/types/news'
import { googleNewsRssUrl } from './queries'
import { redisGet, redisSetEx } from './redis'
import { summarizeArticlesKo, suggestNewsQueryFallback } from './summarize'

const NEWS_TTL = 24 * 60 * 60 // 24h — fresh article fetch + translation per topic per day
const MAX_ARTICLES = 3

/** Alias kept for clarity in this module; renders directly into <NewsCard>. */
export type NewsArticle = NewsItem

function articleId(eventId: string, source: string, index: number): string {
  const sourceSlug = source.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24)
  return `${eventId}-${sourceSlug || 'src'}-${index}`
}

export interface NewsFetchResult {
  articles: NewsArticle[]
  cached: boolean
  /** True if the heuristic query returned 0 and an LLM-suggested query was used. */
  usedFallback?: boolean
}

export interface FetchRelatedNewsArgs {
  query: string
  eventTitle: string
  category: string
  eventId: string
}

function newsCacheKey(query: string): string {
  // Bound key length while keeping it readable in the Redis browser.
  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return `polymarket:news:${slug.slice(0, 80)}`
}

export async function fetchRelatedNews(args: FetchRelatedNewsArgs): Promise<NewsFetchResult> {
  const { query, eventTitle, category, eventId } = args
  const key = newsCacheKey(query)
  const cached = await redisGet(key)
  if (cached) {
    try {
      return { articles: JSON.parse(cached) as NewsArticle[], cached: true }
    } catch {
      // Fall through to fresh fetch on parse error (e.g. stale schema)
    }
  }

  let all = await fetchOneRss(googleNewsRssUrl(query))
  let usedFallback = false

  // Hybrid: only when the heuristic query yields nothing, ask the LLM for a
  // better query and retry once.
  if (all.length === 0) {
    const better = await suggestNewsQueryFallback({
      eventTitle,
      category,
      failedQuery: query,
    })
    if (better && better !== query) {
      const retried = await fetchOneRss(googleNewsRssUrl(better))
      if (retried.length > 0) {
        all = retried
        usedFallback = true
      }
    }
  }

  const top = all.slice(0, MAX_ARTICLES)

  const translated = await summarizeArticlesKo(
    top.map((a) => ({ title: a.title, description: a.description })),
    query.slice(0, 60),
  )

  const now = new Date().toISOString()
  const articles: NewsArticle[] = top.map((a, i) => {
    const t = translated[i]
    return {
      id: articleId(eventId, a.source, i),
      country: '',
      category: t?.category ?? 'Politics',
      title: t?.titleKo || a.title,
      summary: t?.summaryKo || a.description.slice(0, 120),
      detail: t?.detailKo || '',
      sentiment: t?.sentiment ?? 'neutral',
      source: a.source,
      url: a.link,
      pubDate: a.pubDate || now,
      cachedAt: now,
      isRealtime: true,
    }
  })

  await redisSetEx(key, JSON.stringify(articles), NEWS_TTL)
  return { articles, cached: false, usedFallback }
}
