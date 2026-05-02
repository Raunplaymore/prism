export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { mergeFeed, getTokenStats, enforceAnonQuota } from '@/lib/cache'
import { getCountryName } from '@/lib/countries'
import { isSupported } from '@/lib/rss'
import { checkCostAlert, notifyNewsCached, notifyError } from '@/lib/telegram'
import { fetchNewsFromArticles } from '@/lib/news'

/** Step 2: Read raw articles from Redis, summarize with OpenAI, save feed */

/** Auth: admin secret header or cookie — same pattern as refresh route */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET
  if (secret && request.headers.get('x-admin-secret') === secret) return true

  const { verifySessionToken, getSessionFromCookie } = await import('@/lib/auth')
  const token = getSessionFromCookie(request.headers.get('cookie'))
  if (token) {
    const user = await verifySessionToken(token)
    if (user?.isAdmin) return true
  }

  return false
}

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
    // Admin bypass; otherwise enforce per-IP daily quota (OpenAI abuse protection)
    if (!(await isAuthorized(request))) {
      const quota = await enforceAnonQuota(request)
      if (!quota.ok) {
        return NextResponse.json(
          { error: 'rate_limit', message: '오늘 무료 사용량을 모두 사용했습니다. 내일 다시 시도해 주세요.' },
          { status: 429 },
        )
      }
    }

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
