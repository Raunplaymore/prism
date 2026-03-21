export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getFeed, needsRefresh } from '@/lib/cache'
import { ValidationError } from '@/lib/errors'
import { isSupported } from '@/lib/rss'

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

    // Always return cached data only — never call OpenAI
    const feed = await getFeed(code, lang)
    const stale = needsRefresh(feed)

    if (feed && feed.items.length > 0) {
      return NextResponse.json({
        items: feed.items,
        refreshing: stale,
        newCount: 0,
      })
    }

    // No cache — return empty with refreshing flag
    return NextResponse.json({
      items: [],
      refreshing: true,
      newCount: 0,
      empty: true,
    })
  } catch (err) {
    console.error('News API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
