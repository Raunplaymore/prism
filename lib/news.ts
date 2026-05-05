import { getCountryName } from '@/lib/countries'
import { fetchRssArticles, type RssArticle } from '@/lib/rss'
import type { NewsItem } from '@/types/news'
import { recordTokenUsage } from '@/lib/cache'
import { matchKeywords } from '@/lib/keywords/match'

interface SummarizedItem {
  originalIndex: number
  category: string
  title: string
  summary: string
  detail: string
  sentiment: 'positive' | 'neutral' | 'negative'
  keywords?: string[]
}

interface OpenAIResponse {
  choices: { message: { content: string | null } }[]
  usage?: { prompt_tokens: number; completion_tokens: number }
}

export function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ko: 'Korean',
}

const CATEGORY_PROMPT = `Assign one category per article from this list:
Politics, Economy, Society, Tech, Defense, Diplomacy, Environment, Health, Culture

Exclude: celebrity/idol news (concerts, tours, comebacks, fan events, dating), K-pop, movie/TV/drama reviews, sports scores/match results.
General sports INDUSTRY news (e.g. league deals, stadium economics) is OK.`

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
  const articles = await fetchRssArticles(countryCode)
  return fetchNewsFromArticles(countryCode, lang, articles)
}

/**
 * Summarize pre-collected articles with OpenAI (no RSS fetch)
 */
export async function fetchNewsFromArticles(countryCode: string, lang = 'en', articles: RssArticle[]): Promise<NewsItem[]> {
  const countryName = getCountryName(countryCode)
  const langLabel = LANG_LABELS[lang] ?? 'English'
  const now = new Date().toISOString()

  if (articles.length === 0) {
    return []
  }

  const articlesForAi = articles.map((a, i) => ({
    i,
    t: a.title,
    d: a.description.slice(0, 700),
  }))

  const response = await callOpenAI([
    {
      role: 'system',
      content: `You filter and summarize news articles that are DIRECTLY about ${countryName}. Return JSON: {"items":[...]}

FILTERING RULE:
- Include articles that are significantly about ${countryName} — domestic affairs, economy, politics, or international relations involving ${countryName}
- EXCLUDE articles that only mention ${countryName} in passing while being primarily about a different country
- Articles about bilateral relations are fine if ${countryName} is one of the main parties
- Articles may be in any language — translate the title, summary, and detail to ${langLabel}

Each item: {"originalIndex":number,"category":"one of the categories below","title":"${langLabel} title","summary":"1-2 sentence ${langLabel} summary","detail":"5-7 short paragraphs in ${langLabel}, each paragraph EXACTLY ONE sentence, separated by \\n\\n. Each paragraph covers a different angle (historical context / stakeholders / why this matters now / downstream implications / supporting facts)","sentiment":"positive"|"neutral"|"negative","keywords":["slug1","slug2",...]}
Write title, summary, and detail in ${langLabel}. "summary" is a brief overview. "detail" is structured as 5-7 short paragraphs separated by \n\n; each paragraph is exactly ONE sentence and addresses a distinct angle. Do not number paragraphs. Do not use markdown bullets or headings. "detail" MUST introduce information that is not in "summary" — historical context, stakeholders, why this matters now, or downstream implications. Restating the summary in different words is forbidden.

For "keywords": extract 3-5 canonical English slug keywords (lowercase kebab-case ASCII).
Prefer named entities — people, countries, organizations, companies — and concrete topics.
Skip generic words (news, today, world, breaking). Use English slugs even if the article is in Korean.

${CATEGORY_PROMPT}

Include all relevant articles (up to 30).`,
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
    .map((item) => {
      const original: RssArticle = articles[item.originalIndex]
      // Normalize free-form LLM keywords against the curated vocabulary.
      // Unknown keywords are dropped here; pending-curator queue is Phase 3.
      const rawKeywords = Array.isArray(item.keywords) ? item.keywords : []
      const { matched } = matchKeywords(rawKeywords)
      const keywords = matched.map((m) => m.slug)
      return {
        id: `${countryCode}-${simpleHash(original.link)}`,
        country: countryCode,
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
        keywords,
      }
    })
}
