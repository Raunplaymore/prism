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

async function redis(cmd: string[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  })
  const data = await res.json()
  return data.result
}

/** POST: Save experiment to history */
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const title = request.nextUrl.searchParams.get('title') || 'Untitled'
    const query = request.nextUrl.searchParams.get('query') || ''
    const lang = request.nextUrl.searchParams.get('lang') || 'ko'

    // Read current summarized result
    const raw = await redis(['GET', 'lab:summarized']) as string | null
    if (!raw) {
      return NextResponse.json({ error: 'No summarized articles. Run summarize first.' }, { status: 404 })
    }

    const items = JSON.parse(raw)
    const entry = JSON.stringify({
      title,
      query,
      lang,
      itemCount: items.length,
      items,
      savedAt: new Date().toISOString(),
    })

    // Prepend to history list (keep max 20)
    await redis(['LPUSH', 'lab:history', entry])
    await redis(['LTRIM', 'lab:history', '0', '19'])

    return NextResponse.json({ saved: true, count: items.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** GET: Retrieve history list or single entry */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const index = request.nextUrl.searchParams.get('index')

    if (index !== null) {
      // Single entry detail
      const entry = await redis(['LINDEX', 'lab:history', index]) as string | null
      if (!entry) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      return NextResponse.json(JSON.parse(entry))
    }

    // History list (titles only)
    const list = await redis(['LRANGE', 'lab:history', '0', '19']) as string[]
    if (!list) return NextResponse.json({ history: [] })

    const history = list.map((entry, i) => {
      const parsed = JSON.parse(entry)
      return {
        index: i,
        title: parsed.title,
        query: parsed.query,
        lang: parsed.lang,
        itemCount: parsed.itemCount,
        savedAt: parsed.savedAt,
      }
    })

    return NextResponse.json({ history })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
