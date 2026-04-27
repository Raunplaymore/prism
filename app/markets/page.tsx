import type { Metadata } from 'next'
import { fetchEventsByCategory } from '@/lib/polymarket/client'
import { PRISM_CATEGORIES, type PrismCategory } from '@/lib/polymarket/categories'
import { buildNewsQuery } from '@/lib/polymarket/queries'
import { fetchRelatedNews, type NewsArticle } from '@/lib/polymarket/news'
import { fetchTranslatedMarketContent } from '@/lib/polymarket/marketview'
import CategoryGrid from '@/components/markets/CategoryGrid'
import type { EventCardItem } from '@/components/markets/EventCard'

export const metadata: Metadata = {
  title: 'Markets — Prism v2 (WIP)',
  robots: { index: false, follow: false },
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const PER_CATEGORY_VISIBLE = 10

export default async function MarketsPage() {
  type Grouped = Awaited<ReturnType<typeof fetchEventsByCategory>>['data']
  let grouped: Grouped | null = null
  let error: string | null = null

  try {
    const result = await fetchEventsByCategory(50)
    grouped = result.data
  } catch (e) {
    error = e instanceof Error ? e.message : 'unknown error'
  }

  const newsByEventId = new Map<string, NewsArticle[]>()
  const titleKoByEventId = new Map<string, string>()
  const ctxKoByEventId = new Map<string, string>()
  const marketLabelsKoByEventId = new Map<string, Record<string, string>>()
  if (grouped) {
    const visibleItems = PRISM_CATEGORIES.flatMap((cat) =>
      grouped![cat.id].slice(0, PER_CATEGORY_VISIBLE),
    )

    const newsResultsPromise = Promise.all(
      visibleItems.map(async (item) => {
        const q = buildNewsQuery(item.event, item.category)
        const res = await fetchRelatedNews({
          query: q.query,
          eventTitle: item.event.title,
          category: item.category,
          eventId: item.event.id,
        })
        return { id: item.event.id, ...res }
      }),
    )

    const ctxResultsPromise = Promise.all(
      visibleItems.map(async (item) => {
        const en = item.event.eventMetadata?.context_description ?? ''
        const markets = (item.event.markets || [])
          .filter((m) => m.active && !m.closed)
          .slice(0, 8)
          .map((m) => ({
            id: m.id,
            question: m.question,
            groupItemTitle: m.groupItemTitle,
          }))
        const r = await fetchTranslatedMarketContent({
          eventId: item.event.id,
          title: item.event.title,
          context: en,
          markets,
        })
        return {
          id: item.event.id,
          titleKo: r.titleKo,
          contextKo: r.contextKo,
          marketLabelsKo: r.marketLabelsKo,
        }
      }),
    )

    const [newsResults, ctxResults] = await Promise.all([newsResultsPromise, ctxResultsPromise])

    for (const r of newsResults) {
      newsByEventId.set(r.id, r.articles)
    }
    for (const r of ctxResults) {
      if (r.titleKo) titleKoByEventId.set(r.id, r.titleKo)
      if (r.contextKo) ctxKoByEventId.set(r.id, r.contextKo)
      if (r.marketLabelsKo && Object.keys(r.marketLabelsKo).length > 0) {
        marketLabelsKoByEventId.set(r.id, r.marketLabelsKo)
      }
    }
  }

  const totalClassified = grouped
    ? Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)
    : 0

  // Per-category items, capped, with attached articles. Already plain-serializable
  // for the Client Component boundary.
  const itemsByCategory: Record<PrismCategory, EventCardItem[]> = {} as Record<
    PrismCategory,
    EventCardItem[]
  >
  if (grouped) {
    for (const cat of PRISM_CATEGORIES) {
      itemsByCategory[cat.id] = grouped[cat.id]
        .slice(0, PER_CATEGORY_VISIBLE)
        .map((item) => ({
          ...item,
          articles: newsByEventId.get(item.event.id) || [],
          titleKo: titleKoByEventId.get(item.event.id),
          contextKo: ctxKoByEventId.get(item.event.id),
          marketLabelsKo: marketLabelsKoByEventId.get(item.event.id),
        }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Prism Markets</h1>
            <p className="mt-1 text-sm text-gray-400">
              폴리마켓 상위 토픽 {totalClassified}건
            </p>
          </div>
          <a
            href="/admin"
            className="shrink-0 rounded-md border border-gray-800 px-2.5 py-1 text-xs text-gray-500 transition hover:border-gray-700 hover:text-gray-300"
          >
            Admin
          </a>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-900 bg-red-950/30 p-4 text-base text-red-300">
            Polymarket fetch 실패: {error}
          </div>
        )}

        {grouped &&
          PRISM_CATEGORIES.map((cat) => {
            const items = itemsByCategory[cat.id]
            return (
              <section key={cat.id} className="mb-6">
                <div className="mb-1 flex items-baseline gap-2">
                  <h2 className="text-xl font-semibold">
                    <span className="mr-1">{cat.emoji}</span>
                    {cat.label}
                  </h2>
                  <span className="text-sm text-gray-500">{items.length}</span>
                </div>
                <p className="mb-3 text-sm text-gray-500">{cat.description}</p>
                <CategoryGrid items={items} />
              </section>
            )
          })}
      </div>
    </div>
  )
}
