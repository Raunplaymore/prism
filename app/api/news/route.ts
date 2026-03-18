import { NextRequest, NextResponse } from 'next/server'
import { getCachedNews, setCachedNews, getUsageCount, incrementUsage } from '@/lib/cache'
import { fetchNews } from '@/lib/news'
import { ValidationError, PlanLimitError, AiServiceError } from '@/lib/errors'

const FREE_DAILY_LIMIT = 5

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function GET(request: NextRequest) {
  try {
    const country = request.nextUrl.searchParams.get('country')

    if (!country || !/^[A-Z]{2}$/i.test(country)) {
      const err = new ValidationError('Valid ISO alpha-2 country code required.')
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    const code = country.toUpperCase()
    const lang = request.nextUrl.searchParams.get('lang') === 'ko' ? 'ko' : 'en'
    const ip = getClientIp(request)

    // Check usage limit (skip in development)
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
      const usage = await getUsageCount(ip)
      if (usage >= FREE_DAILY_LIMIT) {
        const err = new PlanLimitError()
        return NextResponse.json(err.toJSON(), { status: err.statusCode })
      }
    }

    // Check cache (language-specific)
    const cached = await getCachedNews(code, lang)
    if (cached) {
      await incrementUsage(ip)
      return NextResponse.json({
        items: cached.items,
        cached: true,
        cachedAt: cached.cachedAt,
      })
    }

    // RSS 수집 + OpenAI 요약
    const items = await fetchNews(code, lang)

    // Cache and increment usage in parallel
    await Promise.all([
      setCachedNews(code, lang, items),
      incrementUsage(ip),
    ])

    return NextResponse.json({
      items,
      cached: false,
      cachedAt: null,
    })
  } catch (err) {
    console.error('News API error:', err)

    if (err instanceof SyntaxError) {
      const apiErr = new AiServiceError('Failed to parse AI response.')
      return NextResponse.json(apiErr.toJSON(), { status: apiErr.statusCode })
    }

    const apiErr = new AiServiceError()
    return NextResponse.json(apiErr.toJSON(), { status: apiErr.statusCode })
  }
}
