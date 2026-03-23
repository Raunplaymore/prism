export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, getSessionFromCookie } from '@/lib/auth'

async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = getSessionFromCookie(request.headers.get('cookie'))
  if (token) {
    const user = await verifySessionToken(token)
    if (user?.isAdmin) return true
  }
  const secret = process.env.ADMIN_SECRET
  if (secret && request.headers.get('x-admin-secret') === secret) return true
  return false
}

async function redisSet(key: string, value: string, ttl: number): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', key, value, 'EX', String(ttl)]),
  })
}

interface RssArticle {
  title: string
  link: string
  description: string
  pubDate: string
  source: string
}

function extractTag(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i')
  const cdataMatch = xml.match(cdataRegex)
  if (cdataMatch) return cdataMatch[1].trim()

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : ''
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function parseRss(xml: string): RssArticle[] {
  const articles: RssArticle[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]
    const titleRaw = extractTag(item, 'title')
    const link = extractTag(item, 'link')
    const description = extractTag(item, 'description')
    const pubDate = extractTag(item, 'pubDate')

    if (!titleRaw || !link) continue

    const dashIdx = titleRaw.lastIndexOf(' - ')
    const title = dashIdx > 0 ? titleRaw.slice(0, dashIdx).trim() : titleRaw
    const source = dashIdx > 0 ? titleRaw.slice(dashIdx + 3).trim() : 'Google News'

    articles.push({
      title: stripHtml(title),
      link,
      description: stripHtml(description),
      pubDate: pubDate || '',
      source,
    })
  }

  return articles
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const queryParam = request.nextUrl.searchParams.get('query') || 'global economy stock market'
    // Support multi-query: split by newline or pipe
    const queries = queryParam.split(/[\n|]/).map(q => q.trim()).filter(Boolean)

    let articles: RssArticle[] = []

    // Fetch all queries in parallel
    const results = await Promise.all(
      queries.map(async (query) => {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=US&ceid=US:en`
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        try {
          const res = await fetch(rssUrl, {
            signal: controller.signal,
            redirect: 'follow',
            headers: { 'User-Agent': 'PrismNewsBot/1.0' },
          })
          if (res.ok) {
            const xml = await res.text()
            return parseRss(xml)
          }
          return []
        } catch {
          return []
        } finally {
          clearTimeout(timeout)
        }
      })
    )
    articles = results.flat()

    // Dedup by link + title similarity
    const seenLinks = new Set<string>()
    const seenTitles = new Set<string>()
    articles = articles.filter((a) => {
      if (seenLinks.has(a.link)) return false
      // Normalize title for dedup (lowercase, strip punctuation)
      const norm = a.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
      if (seenTitles.has(norm)) return false
      seenLinks.add(a.link)
      seenTitles.add(norm)
      return true
    })

    // Sort newest first, limit to 50
    articles = articles
      .sort((a, b) => {
        const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
        const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
        return db - da
      })
      .slice(0, 50)

    // Store in Redis with 10min TTL
    await redisSet('lab:raw', JSON.stringify(articles), 600)

    return NextResponse.json({
      articlesCollected: articles.length,
      articles,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
