import type { NewsItem } from '@/types/news'
import { getCountryNameKo } from '@/lib/countries'

interface Props {
  label: string // 한국어 카테고리 라벨 (예: "경제")
  articles: NewsItem[]
}

const SENTIMENT_KO: Record<string, string> = {
  positive: '긍정',
  neutral: '중립',
  negative: '부정',
}

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
}

function topN<T>(map: Map<T, number>, n: number): [T, number][] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

function pct(count: number, total: number): number {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

/**
 * SSR-only synthesis paragraph for a category hub page. Mirrors
 * KeywordSynthesis but framed around "category × multi-country" rather than
 * "keyword × multi-country". No LLM calls — pure metadata aggregation, so
 * page traffic does not scale OpenAI cost.
 */
export default function CategorySynthesis({ label, articles }: Props) {
  if (articles.length === 0) return null

  const total = articles.length

  const byCountry = new Map<string, number>()
  const bySentiment = new Map<string, number>()
  let oldestTs = Infinity
  let newestTs = 0

  for (const a of articles) {
    byCountry.set(a.country, (byCountry.get(a.country) ?? 0) + 1)
    if (a.sentiment) bySentiment.set(a.sentiment, (bySentiment.get(a.sentiment) ?? 0) + 1)
    const t = a.pubDate ? new Date(a.pubDate).getTime() : 0
    if (t > 0) {
      if (t < oldestTs) oldestTs = t
      if (t > newestTs) newestTs = t
    }
  }

  const topCountries = topN(byCountry, 3)
  const sentiments = topN(bySentiment, 3)

  const countryCount = byCountry.size
  const spanHours =
    newestTs > 0 && oldestTs < Infinity
      ? Math.max(1, Math.round((newestTs - oldestTs) / (1000 * 60 * 60)))
      : null

  const countryPart =
    topCountries.length > 0
      ? topCountries.map(([c, n]) => `${getCountryNameKo(c)}(${n}건)`).join(', ')
      : null

  const dominantSentiment = sentiments[0]
  const sentimentPart = dominantSentiment
    ? `${SENTIMENT_KO[dominantSentiment[0]] ?? dominantSentiment[0]} 톤이 ${pct(
        dominantSentiment[1],
        total,
      )}%로 우세`
    : null

  const sentences: string[] = []

  sentences.push(
    `Prism은 지난 24시간 동안 ${label} 분야 기사를 ${countryCount}개국에서 총 ${total}건 수집했습니다.`,
  )
  if (countryPart) sentences.push(`가장 활발히 보도한 국가는 ${countryPart} 순입니다.`)
  if (sentimentPart) sentences.push(`보도 톤은 ${sentimentPart}했습니다.`)
  if (spanHours !== null && spanHours >= 2) {
    sentences.push(
      `가장 오래된 기사부터 가장 최신 기사까지 약 ${spanHours}시간 범위에 걸쳐 보도되고 있습니다.`,
    )
  }

  // Per-country lead — most recent headline from each top country.
  const leadByCountry = new Map<string, NewsItem>()
  for (const a of articles) {
    const prev = leadByCountry.get(a.country)
    const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0
    const tp = prev?.pubDate ? new Date(prev.pubDate).getTime() : -1
    if (!prev || ta > tp) leadByCountry.set(a.country, a)
  }
  const leadCountries = topCountries
    .map(([code]) => ({ code, item: leadByCountry.get(code) }))
    .filter((x): x is { code: string; item: NewsItem } => Boolean(x.item))

  return (
    <section className="mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-4 sm:p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-400">
          Prism 분석
        </span>
        <h2 className="text-sm font-semibold text-gray-300">
          {label} — 다국가 보도 종합
        </h2>
      </div>
      <p className="text-sm leading-relaxed text-gray-300">{sentences.join(' ')}</p>

      {leadCountries.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-gray-800 pt-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            국가별 주요 보도
          </p>
          {leadCountries.map(({ code, item }) => (
            <p key={code} className="text-sm leading-relaxed text-gray-300">
              <span className="mr-1.5">{countryFlag(code)}</span>
              <span className="font-medium text-white">{getCountryNameKo(code)}</span>
              <span className="text-gray-500"> · </span>
              <span className="text-gray-400">&ldquo;{item.title}&rdquo;</span>
            </p>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-gray-600">
        본 종합은 Prism이 위 기사들의 메타데이터(국가, 보도 톤, 발행 시각)를 기계적으로
        집계한 결과입니다. 개별 기사의 정확한 내용은 아래 카드를 통해 원문 출처로 확인해 주세요.
      </p>
    </section>
  )
}
