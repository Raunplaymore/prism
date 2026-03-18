'use client'

import { useState } from 'react'
import type { NewsItem } from '@/types/news'

interface NewsCardProps {
  item: NewsItem
  showCountry?: boolean
}

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
}

const sentimentColors = {
  positive: '#22c55e',
  neutral: '#6b7280',
  negative: '#ef4444',
} as const

export default function NewsCard({ item, showCountry }: NewsCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article
      className="cursor-pointer rounded-lg border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-700"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-white">
          {showCountry && item.country && (
            <span className="mr-1.5">{countryFlag(item.country)}</span>
          )}
          {item.title}
        </h3>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase"
          style={{
            backgroundColor: `${sentimentColors[item.sentiment]}20`,
            color: sentimentColors[item.sentiment],
          }}
        >
          {item.sentiment}
        </span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-gray-400">{item.summary}</p>
      {expanded && item.detail && (
        <div className="mb-3 rounded-md border border-gray-800 bg-gray-950 p-3">
          <p className="text-xs leading-relaxed text-gray-300">{item.detail}</p>
        </div>
      )}
      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <span>{item.source}</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-600">{expanded ? 'Collapse' : 'Detail'}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 transition hover:text-blue-300"
            onClick={(e) => e.stopPropagation()}
          >
            Read original
          </a>
        </div>
      </div>
    </article>
  )
}
