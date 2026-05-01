'use client'

import type { KeywordCount } from '@/lib/keywords/index'

const CATEGORY_COLOR: Record<string, string> = {
  person: '#fbbf24',
  country: '#60a5fa',
  org: '#a78bfa',
  company: '#34d399',
  topic: '#f87171',
  event: '#fb923c',
}

/**
 * Flat word cloud — flex layout with frequency-scaled font and per-category
 * color. `wrap` = multi-line natural flow, `row` = single-line horizontal scroll.
 */
export default function KeywordCloud({
  items,
  minFont = 14,
  maxFont = 44,
  layout = 'wrap',
  uniform = false,
}: {
  items: KeywordCount[]
  minFont?: number
  maxFont?: number
  layout?: 'wrap' | 'row'
  /** When true, all keywords share the same font size and opacity. */
  uniform?: boolean
}) {
  if (items.length === 0) return null

  // Sort biggest first so the eye lands on heaviest keywords
  const sorted = [...items].sort((a, b) => b.count - a.count)
  const max = Math.max(1, ...items.map((i) => i.count))
  const min = Math.max(1, Math.min(...items.map((i) => i.count)))
  const span = Math.max(1, Math.log(max) - Math.log(min))
  const uniformFont = maxFont

  return (
    <div
      className={
        layout === 'row'
          ? 'group/cloud flex h-full items-center gap-5 whitespace-nowrap px-5 leading-none'
          : 'group/cloud flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-4 leading-none'
      }
    >
      {sorted.map((kc) => {
        // Log scale so a few huge counts don't crush the small ones
        const t = (Math.log(kc.count) - Math.log(min)) / span
        const fontSize = uniform ? uniformFont : minFont + t * (maxFont - minFont)
        const opacity = uniform ? 0.9 : 0.55 + t * 0.45
        const color = CATEGORY_COLOR[kc.entry.category] ?? '#9ca3af'
        const display = kc.entry.labelKo || kc.entry.label
        return (
          <a
            key={kc.entry.slug}
            href={`/keyword/${encodeURIComponent(kc.entry.slug)}`}
            className="inline-block font-medium transition-all duration-150 group-hover/cloud:opacity-30 hover:!scale-110 hover:!text-white hover:!opacity-100"
            style={{
              fontSize,
              color,
              opacity,
              textShadow: '0 0 6px rgba(0,0,0,0.4)',
            }}
          >
            {display}
          </a>
        )
      })}
    </div>
  )
}
