export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { fetchRssArticles, isSupported } from '@/lib/rss'
import { mergeFeed, getTokenStats, enforceAnonQuota } from '@/lib/cache'
import { getCountryName } from '@/lib/countries'
import { checkCostAlert, notifyNewsCached, notifyError } from '@/lib/telegram'
import { fetchNewsFromArticles } from '@/lib/news'
import { indexBatch } from '@/lib/keywords/index'
import { isProductionRuntime, previewBlockedResponse } from '@/lib/env'

/**
 * Step 1: POST /api/news/collect?country=XX        → collect RSS only
 * Step 2: POST /api/news/collect?country=XX&step=2 → summarize from Redis
 */

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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://prismglobe.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

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

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  if (!isProductionRuntime()) return previewBlockedResponse()
  const step = request.nextUrl.searchParams.get('step')

  if (step === '2') {
    const res = await handleSummarize(request)
    // Add CORS headers for cross-origin calls from prismglobe.com → pages.dev
    CORS_HEADERS && Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }
  return handleCollect(request)
}

/** Step 1: Collect RSS and store in Redis */
async function handleCollect(request: NextRequest) {
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
    const articles = await fetchRssArticles(code)

    // Store raw articles in Redis (TTL 10 min)
    await redisSet(`raw:${code}`, JSON.stringify(articles), 600)

    return NextResponse.json({
      country: code,
      articlesCollected: articles.length,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** Step 2: Read raw articles from Redis, summarize with OpenAI, save feed */
async function handleSummarize(request: NextRequest) {
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

    // Phase 2: populate keyword reverse index (kw:{slug} → {articleId, ...}).
    // MUST await — Edge runtime does not guarantee fire-and-forget execution
    // after response is returned (Cloudflare Workers terminates worker context
    // without waitUntil registration).
    try {
      await indexBatch(items)
    } catch {
      // non-critical: index will be rebuilt on next ingest
    }

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
