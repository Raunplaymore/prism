import type { Metadata } from 'next'
import { fetchEventsByCategory } from '@/lib/polymarket/client'
import { PRISM_CATEGORIES, type PrismCategory } from '@/lib/polymarket/categories'
import CategoryGrid from '@/components/markets/CategoryGrid'
import type { EventCardItem } from '@/components/markets/EventCard'
import Nav from '@/components/Nav'

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

  const totalClassified = grouped
    ? Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)
    : 0

  // Lazy-load translation + news in the modal — keep server cold path tiny
  // (one Polymarket fetch per category, nothing else) so we stay under the
  // Cloudflare Worker subrequest limit.
  const itemsByCategory: Record<PrismCategory, EventCardItem[]> = {} as Record<
    PrismCategory,
    EventCardItem[]
  >
  if (grouped) {
    for (const cat of PRISM_CATEGORIES) {
      itemsByCategory[cat.id] = grouped[cat.id]
        .slice(0, PER_CATEGORY_VISIBLE)
        .map((item) => ({ ...item }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <div className="mx-auto max-w-5xl p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Prism Markets</h1>
          <p className="mt-1 text-sm text-gray-400">
            폴리마켓 상위 토픽 {totalClassified}건
          </p>
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
