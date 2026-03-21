export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getFeed } from '@/lib/cache'

// All free-access countries
const COUNTRIES = ['US', 'KR', 'JP', 'GB', 'CN', 'FR', 'BR', 'IN', 'RU', 'IR', 'IL', 'UA']

function pubTime(item: { pubDate?: string; addedAt?: string }): number {
  if (item.pubDate) { const t = new Date(item.pubDate).getTime(); if (!isNaN(t)) return t }
  if (item.addedAt) { const t = new Date(item.addedAt).getTime(); if (!isNaN(t)) return t }
  return 0
}

export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get('lang') === 'ko' ? 'ko' : 'en'
  const category = request.nextUrl.searchParams.get('category')

  try {
    const feeds = await Promise.all(
      COUNTRIES.map(async (code) => {
        const feed = await getFeed(code, lang)
        return feed?.items ?? []
      })
    )

    let all = feeds.flat()

    // Category filter
    if (category) {
      all = all.filter((item) => (item as unknown as { category?: string }).category === category)
    }

    // Sort by pubDate
    all.sort((a, b) => pubTime(b) - pubTime(a))

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
