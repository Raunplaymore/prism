export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getFeed, needsRefresh, mergeFeed, incrementUsage, getTokenStats } from '@/lib/cache'
import { fetchNews } from '@/lib/news'
import { getCountryName } from '@/lib/countries'
import { ValidationError, AiServiceError } from '@/lib/errors'
import { isSupported } from '@/lib/rss'
import { checkCostAlert, notifyNewsCached, notifyError } from '@/lib/telegram'

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
  } catch {
    return null
  }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  )
}

export async function GET(request: NextRequest) {
  try {
    const country = request.nextUrl.searchParams.get('country')

    if (!country || !/^[A-Z]{2}$/i.test(country)) {
      const err = new ValidationError('Valid ISO alpha-2 country code required.')
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    const code = country.toUpperCase()

    if (!isSupported(code)) {
      return NextResponse.json({ error: 'unsupported', country: code }, { status: 404 })
    }

    const lang = request.nextUrl.searchParams.get('lang') === 'ko' ? 'ko' : 'en'
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true'
    const ip = getClientIp(request)

    // Force refresh: fetch new articles, merge with existing, return all
    if (forceRefresh) {
      const items = await fetchNews(code, lang)
      const merged = await mergeFeed(code, lang, items as unknown as import('@/lib/cache').FeedItem[])
      await incrementUsage(ip)

      const countryName = getCountryName(code)
      notifyNewsCached(code, countryName, lang, items.length).catch(() => {})
      getTokenStats()
        .then((stats) => checkCostAlert(stats.totalCost, stats.calls, redisExec))
        .catch(() => {})

      return NextResponse.json({
        items: merged,
        refreshing: false,
        newCount: items.length,
      })
    }

    // Normal flow: return cached feed if available
    const feed = await getFeed(code, lang)
    const stale = needsRefresh(feed)

    // Has cached articles — return immediately
    if (feed && feed.items.length > 0) {
      await incrementUsage(ip)
      return NextResponse.json({
        items: feed.items,
        refreshing: stale,
        newCount: 0,
      })
    }

    // No cache at all — must fetch (blocking)
    const items = await fetchNews(code, lang)
    const merged = await mergeFeed(code, lang, items as unknown as import('@/lib/cache').FeedItem[])
    await incrementUsage(ip)

    const countryName = getCountryName(code)
    notifyNewsCached(code, countryName, lang, items.length).catch(() => {})
    getTokenStats()
      .then((stats) => checkCostAlert(stats.totalCost, stats.calls, redisExec))
      .catch(() => {})

    return NextResponse.json({
      items: merged,
      refreshing: false,
      newCount: items.length,
    })
  } catch (err) {
    console.error('News API error:', err)

    const country = request.nextUrl.searchParams.get('country') || 'unknown'
    notifyError(`News API (${country})`, err).catch(() => {})

    if (err instanceof SyntaxError) {
      const apiErr = new AiServiceError('Failed to parse AI response.')
      return NextResponse.json(apiErr.toJSON(), { status: apiErr.statusCode })
    }

    const apiErr = new AiServiceError()
    return NextResponse.json(apiErr.toJSON(), { status: apiErr.statusCode })
  }
}
