export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getFeed } from '@/lib/cache'

// All free-access countries
const COUNTRIES = ['US', 'KR', 'JP', 'GB', 'CN', 'RU', 'IR', 'IL', 'UA']

export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get('lang') === 'ko' ? 'ko' : 'en'

  try {
    const feeds = await Promise.all(
      COUNTRIES.map(async (code) => {
        const feed = await getFeed(code, lang)
        return feed?.items ?? []
      })
    )

    // Flatten and sort by addedAt (newest first)
    const all = feeds.flat().sort((a, b) => {
      const ta = a.addedAt ? new Date(a.addedAt).getTime() : 0
      const tb = b.addedAt ? new Date(b.addedAt).getTime() : 0
      return tb - ta
    })

    const offset = Number(request.nextUrl.searchParams.get('offset')) || 0
    const limit = Number(request.nextUrl.searchParams.get('limit')) || 20
    const page = all.slice(offset, offset + limit)

    return NextResponse.json({
      items: page,
      total: all.length,
      hasMore: offset + limit < all.length,
    })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
