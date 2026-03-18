import { getCountryName } from '@/lib/countries'
import { fetchRssArticles, type RssArticle } from '@/lib/rss'
import type { NewsItem } from '@/types/news'
import { recordTokenUsage } from '@/lib/cache'

interface SummarizedItem {
  originalIndex: number
  category: 'Society' | 'Economy'
  title: string
  summary: string
  detail: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

interface OpenAIResponse {
  choices: { message: { content: string | null } }[]
  usage?: { prompt_tokens: number; completion_tokens: number }
}

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ko: 'Korean',
}

const CATEGORY_PROMPT = `Category definitions (STRICT):
- Society: politics, law, education, health, environment, social issues, crime, demographics
- Economy: business, finance, markets, trade, employment, GDP, industry, startups, real estate

IMPORTANT: Exclude sports, entertainment, K-pop, celebrities, movies, TV shows, music entirely — they do not fit any category.`

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

/**
 * Google News RSS에서 기사 수집 (무료) + OpenAI로 요약만 수행
 */
export async function fetchNews(countryCode: string, lang = 'en'): Promise<NewsItem[]> {
  const countryName = getCountryName(countryCode)
  const langLabel = LANG_LABELS[lang] ?? 'English'
  const now = new Date().toISOString()

  const articles = await fetchRssArticles(countryCode)

  if (articles.length === 0) {
    return []
  }

  const articlesForAi = articles.map((a, i) => ({
    i,
    t: a.title,
    d: a.description.slice(0, 200),
  }))

  const response = await callOpenAI([
    {
      role: 'system',
      content: `You filter and summarize news articles that are DIRECTLY about ${countryName}. Return JSON: {"items":[...]}

CRITICAL FILTERING RULE:
- ONLY include articles where ${countryName} is the PRIMARY subject
- EXCLUDE articles that merely mention ${countryName} in passing or are primarily about another country
- If an article is about relations between ${countryName} and another country, include it only if ${countryName}'s perspective is central
- If fewer than 5 articles pass this filter, that is fine — quality over quantity

Each item: {"originalIndex":number,"category":"Society"|"Economy","title":"${langLabel} title","summary":"1-2 sentence ${langLabel} summary","detail":"4-5 sentence ${langLabel} detailed analysis with context and background","sentiment":"positive"|"neutral"|"negative"}
Write title, summary, and detail in ${langLabel}. "summary" is a brief overview. "detail" provides deeper analysis, background context, and implications.

${CATEGORY_PROMPT}

Select up to 5 per category (max 10 total). Keep summaries concise.`,
    },
    {
      role: 'user',
      content: JSON.stringify(articlesForAi),
    },
  ])

  if (response.usage) {
    await recordTokenUsage(response.usage.prompt_tokens, response.usage.completion_tokens, countryCode, 'rss')
  }

  const content = response.choices[0]?.message?.content
  if (!content) return []

  const parsed = JSON.parse(content)

  if (!parsed.items || !Array.isArray(parsed.items)) return []

  return (parsed.items as SummarizedItem[])
    .filter((item) => typeof item.originalIndex === 'number' && item.originalIndex >= 0 && item.originalIndex < articles.length)
    .map((item, idx) => {
      const original: RssArticle = articles[item.originalIndex]
      return {
        id: `${countryCode}-${item.category}-${idx}-${Date.now()}`,
        country: countryCode,
        category: item.category,
        title: item.title,
        summary: item.summary,
        detail: item.detail,
        sentiment: item.sentiment,
        source: original.source,
        url: original.link,
        cachedAt: now,
        isRealtime: true,
      }
    })
}
