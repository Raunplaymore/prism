import { getCountryName } from '@/lib/countries'

export interface RssArticle {
  title: string
  link: string
  description: string
  pubDate: string
  source: string
}

/**
 * Google News RSS — 모든 국가 지원, 무료, API 키 불필요
 * URL: https://news.google.com/rss/search?q={query}&hl=en&gl=US&ceid=US:en
 */
function buildGoogleNewsUrl(countryCode: string): string {
  const countryName = getCountryName(countryCode)
  const query = encodeURIComponent(`${countryName} news`)
  return `https://news.google.com/rss/search?q=${query}&hl=en&gl=US&ceid=US:en`
}

/** Parse RSS XML into articles */
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

    // Google News title format: "Headline - Source Name"
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

function extractTag(xml: string, tag: string): string {
  // Handle CDATA
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

/** Fetch articles from Google News RSS for any country */
export async function fetchRssArticles(countryCode: string): Promise<RssArticle[]> {
  const url = buildGoogleNewsUrl(countryCode)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'PrismNewsBot/1.0' },
    })

    if (!res.ok) return []

    const xml = await res.text()
    const articles = parseRss(xml)

    // Sort by date (newest first) and limit
    return articles
      .sort((a, b) => {
        const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
        const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
        return db - da
      })
      .slice(0, 20)
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}
