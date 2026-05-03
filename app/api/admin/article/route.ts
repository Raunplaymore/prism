export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getFeed } from '@/lib/cache'
import { isSupported } from '@/lib/rss'
import { verifySessionToken, getSessionFromCookie } from '@/lib/auth'
import type { NewsItem } from '@/types/news'

/** Admin secret header OR isAdmin session cookie */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET
  if (secret && request.headers.get('x-admin-secret') === secret) return true
  const token = getSessionFromCookie(request.headers.get('cookie'))
  if (token) {
    const user = await verifySessionToken(token)
    if (user?.isAdmin) return true
  }
  return false
}

/**
 * GET /api/admin/article?id=KR-abc123
 * 단일 article 조회 — admin 인스타그램 콘텐츠 워크플로우 재료용.
 */
export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  // article id 형식: "{COUNTRY}-{hash}" (lib/news.ts simpleHash 기반)
  const m = id.match(/^([A-Za-z]{2})-/)
  if (!m) return NextResponse.json({ error: 'bad_id_format' }, { status: 400 })
  const country = m[1].toUpperCase()
  if (!isSupported(country)) {
    return NextResponse.json({ error: 'unsupported_country' }, { status: 404 })
  }

  for (const lang of ['ko', 'en'] as const) {
    const feed = await getFeed(country, lang)
    if (!feed) continue
    // FeedItem 타입은 id/url/addedAt만이지만 실제 저장 데이터는 NewsItem 전체.
    const items = feed.items as unknown as NewsItem[]
    const item = items.find((i) => i.id === id)
    if (item) return NextResponse.json({ item })
  }
  return NextResponse.json({ error: 'not_found' }, { status: 404 })
}
