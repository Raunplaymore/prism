import OpenAI from 'openai'
import { getCountryName } from '@/lib/countries'
import { fetchRssArticles, type RssArticle } from '@/lib/rss'
import type { NewsItem } from '@/types/news'
import { recordTokenUsage } from '@/lib/cache'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface SummarizedItem {
  originalIndex: number
  category: 'Society' | 'Economy'
  title: string
  summary: string
  detail: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ko: 'Korean',
}

const CATEGORY_PROMPT = `Category definitions (STRICT):
- Society: politics, law, education, health, environment, social issues, crime, demographics
- Economy: business, finance, markets, trade, employment, GDP, industry, startups, real estate

IMPORTANT: Exclude sports, entertainment, K-pop, celebrities, movies, TV shows, music entirely — they do not fit any category.`

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

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You categorize and summarize news articles about ${countryName}. Return JSON: {"items":[...]}
Each item: {"originalIndex":number,"category":"Society"|"Economy","title":"${langLabel} title","summary":"1-2 sentence ${langLabel} summary","detail":"4-5 sentence ${langLabel} detailed analysis with context and background","sentiment":"positive"|"neutral"|"negative"}
Write title, summary, and detail in ${langLabel}. "summary" is a brief overview. "detail" provides deeper analysis, background context, and implications.

${CATEGORY_PROMPT}

Select 5 per category (10 total). If a category has fewer articles, include what's available. Keep summaries concise.`,
      },
      {
        role: 'user',
        content: JSON.stringify(articlesForAi),
      },
    ],
  })

  if (response.usage) {
    recordTokenUsage(response.usage.prompt_tokens, response.usage.completion_tokens, countryCode, 'rss')
  }

  const content = response.choices[0]?.message?.content
  if (!content) return []

  const parsed: { items: SummarizedItem[] } = JSON.parse(content)

  return parsed.items
    .filter((item) => item.originalIndex >= 0 && item.originalIndex < articles.length)
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
