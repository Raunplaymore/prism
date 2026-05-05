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

/** RSS description이 이 길이 미만이면 LLM에 보내지 않고 drop.
 *  짧은 입력은 detail이 summary 재진술 수준이라 사용자 가치가 낮음.
 *  hallucination을 차단한 보수 프롬프트와 짝을 이룸. */
const MIN_DESCRIPTION_LENGTH = 150

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

  const filteredArticles = articles.filter((a) => (a.description?.length ?? 0) >= MIN_DESCRIPTION_LENGTH)
  if (filteredArticles.length === 0) {
    return []
  }

  if (filteredArticles.length < articles.length) {
    console.log(`[news] ${countryCode}: filtered ${articles.length - filteredArticles.length} short articles (<${MIN_DESCRIPTION_LENGTH}c), kept ${filteredArticles.length}`)
  }

  const articlesForAi = filteredArticles.map((a, i) => ({
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

Each item: {"originalIndex":number,"category":"one of the categories below","title":"${langLabel} title","summary":"1-2 sentence ${langLabel} summary","detail":"2-4 sentence ${langLabel} natural-flow elaboration. Extract ALL the concrete facts, names, quotes, numbers, dates, locations, and stated context from the input that aren't already in summary. Use only information actually present in the input; do not invent context, implications, or speculation.","sentiment":"positive"|"neutral"|"negative","keywords":["slug1","slug2",...]}
Write title, summary, and detail in ${langLabel}. "summary" is a brief 1-2 sentence overview that captures the headline fact. "detail" is a natural-flow 2-4 sentence elaboration that surfaces the additional concrete facts in the input — names, numbers, dates, places, quoted statements, stated reasons or stated context — that summary couldn't fit. Aim for 2-4 sentences when the input supports it; only fall back to fewer sentences if the input genuinely contains nothing more to say beyond summary. CRITICAL: Use only information actually present in the input description. Do not add historical context, implications, predictions, "what to watch" remarks, or stakeholder analysis unless that information is explicitly stated in the source. Better a faithful 2-3 sentences with real facts than a 1-sentence near-restatement of summary.

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
    .filter((item) => typeof item.originalIndex === 'number' && item.originalIndex >= 0 && item.originalIndex < filteredArticles.length)
    .map((item) => {
      const original: RssArticle = filteredArticles[item.originalIndex]
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
