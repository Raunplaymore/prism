export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { mergeFeed, getTokenStats } from '@/lib/cache'
import { getCountryName } from '@/lib/countries'
import { isSupported } from '@/lib/rss'
import { checkCostAlert, notifyNewsCached, notifyError } from '@/lib/telegram'
import { fetchNewsFromArticles } from '@/lib/news'

/** Step 2: Read raw articles from Redis, summarize with OpenAI, save feed */

async function redisGet(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['GET', key]),
  })
  const data = await res.json()
  return data.result
}

async function redisExec(cmd: string[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    })
    const data = await res.json()
    return data.result
  } catch { return null }
}

export async function POST(request: NextRequest) {
  try {
    const country = request.nextUrl.searchParams.get('country')
    if (!country || !isSupported(country.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid country' }, { status: 400 })
    }

    const code = country.toUpperCase()
    const lang = request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ko'

    // Read raw articles from Redis
    const raw = await redisGet(`raw:${code}`)
    if (!raw) {
      return NextResponse.json({ error: 'No raw articles. Run collect first.' }, { status: 404 })
    }

    const articles = JSON.parse(raw)
    const items = await fetchNewsFromArticles(code, lang, articles)
    const merged = await mergeFeed(code, lang, items as unknown as import('@/lib/cache').FeedItem[])

    const countryName = getCountryName(code)
    notifyNewsCached(code, countryName, lang, items.length).catch(() => {})
    getTokenStats()
      .then((stats) => checkCostAlert(stats.totalCost, stats.calls, redisExec))
      .catch(() => {})

    return NextResponse.json({
      country: code,
      lang,
      newArticles: items.length,
      totalArticles: merged.length,
    })
  } catch (err) {
    console.error('Summarize error:', err)
    const country = request.nextUrl.searchParams.get('country') || 'unknown'
    notifyError(`Summarize (${country})`, err).catch(() => {})
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
