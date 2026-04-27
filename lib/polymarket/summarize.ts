import { recordTokenUsage } from '@/lib/cache'

interface FallbackArgs {
  eventTitle: string
  category: string
  failedQuery: string
}

/**
 * LLM fallback for the heuristic news-query builder.
 * Called only when the heuristic query returns 0 RSS results.
 * Returns a single boolean query string in the same format
 * (`"<subject>" (<term> OR <term> ...)`), or null on any failure.
 */
export async function suggestNewsQueryFallback(args: FallbackArgs): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You convert a prediction-market topic into ONE Google News boolean search query.\n\n' +
              'Required format (exactly):\n' +
              '"<subject phrase>" (<term1> OR <term2> OR <term3>)\n\n' +
              'Rules:\n' +
              '- 1–3 word quoted subject (proper nouns or specific concepts)\n' +
              '- 3–5 OR-terms (action verbs or topical English nouns)\n' +
              '- Use English only\n' +
              '- Avoid reusing the exact phrasing from the failed query\n' +
              '- Pick subjects that real news outlets would name in a headline\n\n' +
              'Return JSON: {"query": "..."}',
          },
          { role: 'user', content: JSON.stringify(args) },
        ],
      }),
    })
  } catch {
    return null
  }

  if (!res.ok) return null

  const data = (await res.json()) as OpenAIResponse
  if (data.usage) {
    await recordTokenUsage(
      data.usage.prompt_tokens,
      data.usage.completion_tokens,
      args.failedQuery.slice(0, 60),
      'markets',
    )
  }

  const content = data.choices[0]?.message?.content
  if (!content) return null
  try {
    const parsed = JSON.parse(content) as { query?: string }
    const q = parsed.query?.trim()
    return q && q.length > 0 ? q : null
  } catch {
    return null
  }
}

export interface MarketLabel {
  id: string
  labelKo: string
}

export interface MarketContentTranslation {
  titleKo: string
  contextKo: string
  markets: MarketLabel[]
}

export interface MarketTranslationInput {
  title: string
  context: string
  markets: { id: string; question: string; groupItemTitle?: string }[]
}

/**
 * Translate a Polymarket event's title, "market view" paragraph, and per-market
 * labels in a single LLM call. Co-translating keeps terminology consistent and
 * costs one round-trip per event. Returns null on any failure.
 */
export async function translateMarketContentKo(
  input: MarketTranslationInput,
): Promise<MarketContentTranslation | null> {
  const title = input.title?.trim()
  const context = input.context?.trim()
  const markets = (input.markets || []).map((m) => ({
    id: m.id,
    q: m.question,
    g: m.groupItemTitle ?? '',
  }))
  if (!title && !context && markets.length === 0) return null

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You translate prediction-market topics from English into natural, professional Korean.\n' +
              'Preserve all facts, numbers, dates, and proper nouns. Stay neutral.\n\n' +
              'For each market label, the Polymarket "groupItemTitle" (g) is a short tag like "April 30"\n' +
              'or "Trump"; the full "question" (q) holds the actual claim. Produce a SHORT Korean label\n' +
              'that combines the parent topic with the market’s specific point — readable on its own.\n' +
              '  example: parent="Russia-Ukraine ceasefire?", q="...by April 30?" → "4월 30일까지"\n' +
              '  example: parent="Largest Company", q="NVIDIA" → "NVIDIA"\n' +
              '  Aim for ~6–14 Korean characters per label.\n\n' +
              'Return JSON:\n' +
              '{\n' +
              '  "titleKo": "<concise Korean headline>",\n' +
              '  "contextKo": "<full Korean translation of context>",\n' +
              '  "marketsKo": [{"id": "<exact id>", "labelKo": "<short Korean label>"}, ...]\n' +
              '}\n' +
              'Preserve every input market id. Do not invent ids.',
          },
          {
            role: 'user',
            content: JSON.stringify({ title, context: context.slice(0, 1500), markets }),
          },
        ],
      }),
    })
  } catch {
    return null
  }

  if (!res.ok) return null

  const data = (await res.json()) as OpenAIResponse
  if (data.usage) {
    await recordTokenUsage(
      data.usage.prompt_tokens,
      data.usage.completion_tokens,
      'market-view',
      'markets',
    )
  }

  const content = data.choices[0]?.message?.content
  if (!content) return null
  try {
    const parsed = JSON.parse(content) as {
      titleKo?: string
      contextKo?: string
      marketsKo?: { id?: string; labelKo?: string }[]
    }
    const titleKo = parsed.titleKo?.trim() || title
    const contextKo = parsed.contextKo?.trim() || ''
    const marketLabels: MarketLabel[] = []
    for (const m of parsed.marketsKo ?? []) {
      const id = m.id?.trim()
      const labelKo = m.labelKo?.trim()
      if (id && labelKo) marketLabels.push({ id, labelKo })
    }
    if (!titleKo && !contextKo && marketLabels.length === 0) return null
    return { titleKo, contextKo, markets: marketLabels }
  } catch {
    return null
  }
}

interface RawArticle {
  title: string
  description: string
}

export type Sentiment = 'positive' | 'neutral' | 'negative'

// NewsCard's category palette — must stay aligned with components/NewsCard.tsx
export type ArticleCategory =
  | 'Politics'
  | 'Economy'
  | 'Society'
  | 'Tech'
  | 'Defense'
  | 'Diplomacy'
  | 'Environment'
  | 'Health'
  | 'Culture'

const ALLOWED_CATEGORIES: ArticleCategory[] = [
  'Politics', 'Economy', 'Society', 'Tech', 'Defense',
  'Diplomacy', 'Environment', 'Health', 'Culture',
]
const ALLOWED_SENTIMENTS: Sentiment[] = ['positive', 'neutral', 'negative']

export interface TranslatedArticle {
  titleKo: string
  summaryKo: string
  detailKo: string
  sentiment: Sentiment
  category: ArticleCategory
}

interface OpenAIResponse {
  choices: { message: { content: string | null } }[]
  usage?: { prompt_tokens: number; completion_tokens: number }
}

interface ParsedItem {
  i?: number
  title?: string
  summary?: string
  detail?: string
  sentiment?: string
  category?: string
}

/**
 * Translate + summarize a batch of English news snippets into Korean.
 * One OpenAI call per call site (not per article).
 */
function defaultArticle(a: RawArticle): TranslatedArticle {
  return {
    titleKo: a.title,
    summaryKo: a.description.slice(0, 120),
    detailKo: '',
    sentiment: 'neutral',
    category: 'Politics',
  }
}

function pickCategory(raw: string | undefined): ArticleCategory {
  if (!raw) return 'Politics'
  const normalized = raw.trim()
  return (ALLOWED_CATEGORIES.find((c) => c === normalized) ?? 'Politics') as ArticleCategory
}

function pickSentiment(raw: string | undefined): Sentiment {
  if (!raw) return 'neutral'
  const lower = raw.trim().toLowerCase()
  return (ALLOWED_SENTIMENTS.find((s) => s === lower) ?? 'neutral') as Sentiment
}

export async function summarizeArticlesKo(
  articles: RawArticle[],
  contextLabel: string,
): Promise<TranslatedArticle[]> {
  if (articles.length === 0) return []

  const fallback = (): TranslatedArticle[] => articles.map(defaultArticle)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return fallback()

  const compact = articles.map((a, i) => ({
    i,
    t: a.title,
    d: a.description.slice(0, 200),
  }))

  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You translate, summarize, and tag English news snippets into Korean. Return JSON: {"items":[...]}.\n\n' +
              'For each input article produce one item:\n' +
              '- "i": original index (number)\n' +
              '- "title": natural Korean headline (concise)\n' +
              '- "summary": one short Korean sentence under 60 characters\n' +
              '- "detail": 3–4 Korean sentences with background and implications\n' +
              '- "sentiment": one of "positive" | "neutral" | "negative"\n' +
              '- "category": one of "Politics" | "Economy" | "Society" | "Tech" | "Defense" | "Diplomacy" | "Environment" | "Health" | "Culture"\n\n' +
              'Stay factual and neutral; do not add speculation.',
          },
          { role: 'user', content: JSON.stringify(compact) },
        ],
      }),
    })
  } catch {
    return fallback()
  }

  if (!res.ok) return fallback()

  const data = (await res.json()) as OpenAIResponse
  if (data.usage) {
    await recordTokenUsage(
      data.usage.prompt_tokens,
      data.usage.completion_tokens,
      contextLabel,
      'markets',
    )
  }

  const content = data.choices[0]?.message?.content
  if (!content) return fallback()

  let parsed: { items?: ParsedItem[] }
  try {
    parsed = JSON.parse(content) as { items?: ParsedItem[] }
  } catch {
    return fallback()
  }

  const out: TranslatedArticle[] = articles.map(defaultArticle)
  for (const item of parsed.items ?? []) {
    if (typeof item.i === 'number' && item.i >= 0 && item.i < out.length) {
      out[item.i] = {
        titleKo: item.title?.trim() || articles[item.i].title,
        summaryKo: item.summary?.trim() || '',
        detailKo: item.detail?.trim() || '',
        sentiment: pickSentiment(item.sentiment),
        category: pickCategory(item.category),
      }
    }
  }
  return out
}
