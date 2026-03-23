export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { mergeFeed } from '@/lib/cache'
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

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const lang = request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ko'

    // Read summarized articles from Redis
    const raw = await redisGet('lab:summarized')
    if (!raw) {
      return NextResponse.json({ error: 'No summarized articles. Run summarize first.' }, { status: 404 })
    }

    const items = JSON.parse(raw) as { id: string; url: string; addedAt?: string }[]

    // Save to feed using mergeFeed
    const merged = await mergeFeed('GLOBAL_ECONOMY', lang, items)

    return NextResponse.json({
      saved: true,
      count: items.length,
      totalInFeed: merged.length,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
