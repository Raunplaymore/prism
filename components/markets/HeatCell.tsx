'use client'

import {
  formatPercent,
  formatVolume,
  parseNumberArray,
} from '@/lib/polymarket/format'
import type { EventCardItem } from './EventCard'

function pickHeadlineMarket(item: EventCardItem) {
  const markets = (item.event.markets || []).filter((m) => m.active && !m.closed)
  if (markets.length === 0) return null
  // Prefer the market with the largest 24h volume — what most traders care about.
  return markets.slice().sort((a, b) => (b.volume24hr ?? 0) - (a.volume24hr ?? 0))[0]
}

export default function HeatCell({
  item,
  onClick,
}: {
  item: EventCardItem
  onClick: () => void
}) {
  const market = pickHeadlineMarket(item)
  const prices = parseNumberArray(market?.outcomePrices)
  const headPrice = prices[0]
  const title = item.titleKo || item.event.title
  const activeMarkets = (item.event.markets || []).filter((m) => m.active && !m.closed).length
  const articleCount = item.articles.length

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-[7rem] w-full flex-col gap-1.5 rounded-lg border border-gray-800 bg-gray-900 p-3 text-left transition hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
    >
      <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-100 underline decoration-gray-700 decoration-dotted underline-offset-[3px] transition-colors group-hover:decoration-gray-400 group-hover:decoration-solid">
        {title}
      </p>
      <div className="mt-auto space-y-1">
        <div className="flex items-baseline justify-between tabular-nums">
          <span className="text-base font-semibold text-gray-100">
            {formatPercent(headPrice)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatVolume(item.event.volume24hr)}</span>
          <span className="text-gray-600">
            {activeMarkets > 1 && `${activeMarkets} markets`}
            {activeMarkets > 1 && articleCount > 0 && ' · '}
            {articleCount > 0 && `${articleCount} news`}
          </span>
        </div>
      </div>
    </button>
  )
}
