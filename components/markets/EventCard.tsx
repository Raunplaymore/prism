import NewsCard from '@/components/NewsCard'
import {
  formatPercent,
  formatVolume,
  parseNumberArray,
  parseStringArray,
} from '@/lib/polymarket/format'
import type { ClassifiedEvent } from '@/lib/polymarket/client'
import type { NewsArticle } from '@/lib/polymarket/news'
import type { PolymarketMarket } from '@/lib/polymarket/types'

function MarketLine({
  market,
  eventTitle,
  koLabel,
}: {
  market: PolymarketMarket
  eventTitle: string
  koLabel?: string
}) {
  const outcomes = parseStringArray(market.outcomes)
  const prices = parseNumberArray(market.outcomePrices)
  const headPrice = prices[0]
  const headOutcome = outcomes[0] ?? 'Yes'
  const isBinary = outcomes.length === 2 && outcomes[0] === 'Yes' && outcomes[1] === 'No'
  const rawLabel = koLabel?.trim() || market.groupItemTitle?.trim() || market.question
  const label = rawLabel === eventTitle ? headOutcome : rawLabel
  const showOutcomePrefix = !isBinary && headOutcome !== 'Yes'

  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="truncate text-gray-300">{label}</span>
      <div className="flex shrink-0 items-baseline gap-2 tabular-nums">
        {showOutcomePrefix && <span className="text-xs text-gray-500">{headOutcome}</span>}
        <span className="font-semibold text-gray-100">{formatPercent(headPrice)}</span>
      </div>
    </div>
  )
}

export interface EventCardItem extends ClassifiedEvent {
  articles: NewsArticle[]
  /** Translated event.title (Korean). Falls back to English when absent. */
  titleKo?: string
  /** Translated context_description (Korean). Falls back to English when absent. */
  contextKo?: string
  /** marketId → short Korean market label. */
  marketLabelsKo?: Record<string, string>
}

export default function EventCard({ item }: { item: EventCardItem }) {
  const { event, articles } = item
  const tags = (event.tags || []).filter((t) => !t.forceHide).slice(0, 4)
  const title = item.titleKo || event.title
  const ctx = item.contextKo || event.eventMetadata?.context_description
  const allMarkets = (event.markets || []).filter((m) => m.active && !m.closed)
  const visibleMarkets = allMarkets.slice(0, 5)
  const hiddenCount = allMarkets.length - visibleMarkets.length

  return (
    <article className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-base font-medium text-gray-100">{title}</span>
        <span className="shrink-0 text-sm text-gray-500">{formatVolume(event.volume24hr)} / 24h</span>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t.id} className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
              {t.label}
            </span>
          ))}
        </div>
      )}
      {visibleMarkets.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-gray-800/60 pt-2.5">
          {visibleMarkets.map((m) => (
            <MarketLine
              key={m.id}
              market={m}
              eventTitle={title}
              koLabel={item.marketLabelsKo?.[m.id]}
            />
          ))}
          {hiddenCount > 0 && (
            <p className="pt-0.5 text-xs text-gray-600">+ {hiddenCount}개 마켓 더</p>
          )}
        </div>
      )}
      {ctx && (
        <div className="mt-3 rounded border-l-2 border-gray-700 bg-gray-900/40 py-2 pl-2.5 pr-2 text-sm leading-relaxed text-gray-300">
          <span className="font-medium text-gray-400">시장 시각</span>
          <span className="ml-1.5 text-gray-700">·</span>{' '}
          {ctx}
        </div>
      )}
      {articles.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-gray-800/60 pt-2.5">
          <p className="text-xs text-gray-600">뉴스 시각</p>
          {articles.map((a) => (
            <NewsCard key={a.id} item={a} />
          ))}
        </div>
      )}
    </article>
  )
}
