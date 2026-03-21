export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { mergeFeed, getTokenStats } from '@/lib/cache'
import { fetchNews } from '@/lib/news'
import { getCountryName } from '@/lib/countries'
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

/** Auth: admin secret header or cookie */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET
  if (secret && request.headers.get('x-admin-secret') === secret) return true

  // Also allow cookie-based admin auth
  const { verifySessionToken, getSessionFromCookie } = await import('@/lib/auth')
  const token = getSessionFromCookie(request.headers.get('cookie'))
  if (token) {
    const user = await verifySessionToken(token)
    if (user?.isAdmin) return true
  }

  return false
}

export async function POST(request: NextRequest) {
  const country = request.nextUrl.searchParams.get('country')

  // Poll failure notification — no auth required (just a telegram alert)
  if (request.nextUrl.searchParams.get('poll_failed') === 'true' && country) {
    const code = country.toUpperCase()
    const countryName = getCountryName(code)
    await notifyError(`Polling failed: ${countryName} (${code})`, 'User waited 60s but no data appeared')
    return NextResponse.json({ notified: true })
  }

  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!country || !isSupported(country.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid country' }, { status: 400 })
    }

    const code = country.toUpperCase()
    const lang = request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ko'

    const items = await fetchNews(code, lang)
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
    console.error('Refresh error:', err)
    const country = request.nextUrl.searchParams.get('country') || 'unknown'
    notifyError(`Refresh (${country})`, err).catch(() => {})
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
