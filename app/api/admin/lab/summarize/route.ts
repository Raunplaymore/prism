export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { recordTokenUsage } from '@/lib/cache'

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

interface OpenAIResponse {
  choices: { message: { content: string | null } }[]
  usage?: { prompt_tokens: number; completion_tokens: number }
}

async function callOpenAI(messages: { role: string; content: string }[]): Promise<OpenAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error: ${res.status} ${err}`)
  }

  return res.json()
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://prismglobe.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ko: 'Korean',
}

export async function POST(request: NextRequest) {
  try {
    const lang = request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ko'
    const langLabel = LANG_LABELS[lang]

    // Read raw articles from Redis
    const raw = await redisGet('lab:raw')
    if (!raw) {
      const res = NextResponse.json({ error: 'No raw articles. Run collect first.' }, { status: 404 })
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    const articles = JSON.parse(raw) as { title: string; link: string; description: string; pubDate: string; source: string }[]
    const now = new Date().toISOString()

    const articlesForAi = articles.map((a, i) => ({
      i,
      t: a.title,
      d: a.description.slice(0, 200),
    }))

    const response = await callOpenAI([
      {
        role: 'system',
        content: `You filter and summarize economy/finance news articles. Return JSON: {"items":[...]}

FILTERING RULE:
- Include articles about global economy, finance, markets, trade, monetary policy
- Assign one category per article from: Macro, Stocks, Commodities, Forex, Crypto, Policy, Trade
- EXCLUDE: celebrity news, sports, entertainment, K-pop, movie/TV reviews
- General business/industry news is OK if it has economic significance

Each item: {"originalIndex":number,"category":"one of the categories above","title":"${langLabel} title","summary":"1-2 sentence ${langLabel} summary","detail":"4-5 sentence ${langLabel} detailed analysis with context and background","sentiment":"positive"|"neutral"|"negative"}
Write title, summary, and detail in ${langLabel}. "summary" is a brief overview. "detail" provides deeper analysis, background context, and implications.

Include all relevant articles (up to 30).`,
      },
      {
        role: 'user',
        content: JSON.stringify(articlesForAi),
      },
    ])

    if (response.usage) {
      await recordTokenUsage(response.usage.prompt_tokens, response.usage.completion_tokens, 'GLOBAL_ECONOMY', 'rss')
    }

    const content = response.choices[0]?.message?.content
    if (!content) {
      const res = NextResponse.json({ error: 'Empty OpenAI response' }, { status: 500 })
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    const parsed = JSON.parse(content)
    if (!parsed.items || !Array.isArray(parsed.items)) {
      const res = NextResponse.json({ error: 'Invalid OpenAI response format' }, { status: 500 })
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    const items = parsed.items
      .filter((item: { originalIndex: number }) => typeof item.originalIndex === 'number' && item.originalIndex >= 0 && item.originalIndex < articles.length)
      .map((item: { originalIndex: number; category: string; title: string; summary: string; detail: string; sentiment: string }) => {
        const original = articles[item.originalIndex]
        return {
          id: `ECON-${simpleHash(original.link)}`,
          country: 'GLOBAL_ECONOMY',
          category: item.category,
          title: item.title,
          summary: item.summary,
          detail: item.detail,
          sentiment: item.sentiment,
          source: original.source,
          url: original.link,
          pubDate: original.pubDate || now,
          cachedAt: now,
          isRealtime: true,
        }
      })

    // Store summarized in Redis with 1hr TTL
    await redisSet('lab:summarized', JSON.stringify(items), 3600)

    const res = NextResponse.json({ items })
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
    return res
  } catch (err) {
    console.error('Lab summarize error:', err)
    const res = NextResponse.json({ error: String(err) }, { status: 502 })
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }
}
