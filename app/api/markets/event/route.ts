export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { fetchTranslatedMarketContent } from '@/lib/polymarket/marketview'
import { fetchRelatedNews } from '@/lib/polymarket/news'
import { buildNewsQuery } from '@/lib/polymarket/queries'
import type { PrismCategory } from '@/lib/polymarket/categories'
import type { PolymarketEvent } from '@/lib/polymarket/types'

interface RequestBody {
  eventId: string
  eventTitle: string
  category: PrismCategory
  context: string
  markets: { id: string; question: string; groupItemTitle?: string }[]
  tags: { id: string; label: string; slug: string; forceShow?: boolean; forceHide?: boolean }[]
}

export async function POST(request: NextRequest) {
  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  if (!body?.eventId || !body?.eventTitle || !body?.category) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  // Reconstruct the minimum PolymarketEvent shape buildNewsQuery needs.
  const eventForQuery = {
    id: body.eventId,
    slug: '',
    title: body.eventTitle,
    active: true,
    closed: false,
    archived: false,
    tags: body.tags,
  } as unknown as PolymarketEvent
  const newsQuery = buildNewsQuery(eventForQuery, body.category)

  const [contentResult, newsResult] = await Promise.all([
    fetchTranslatedMarketContent({
      eventId: body.eventId,
      title: body.eventTitle,
      context: body.context ?? '',
      markets: body.markets ?? [],
    }),
    fetchRelatedNews({
      query: newsQuery.query,
      eventTitle: body.eventTitle,
      category: body.category,
      eventId: body.eventId,
    }),
  ])

  return NextResponse.json({
    titleKo: contentResult.titleKo,
    contextKo: contentResult.contextKo,
    marketLabelsKo: contentResult.marketLabelsKo,
    articles: newsResult.articles,
  })
}
