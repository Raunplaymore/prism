'use client'

import { useState } from 'react'
import type { NewsItem } from '@/types/news'
import { CATEGORY_META, isValidCategory } from '@/lib/categories'
import { countryFlag } from '@/lib/countries'

interface NewsCardProps {
  item: NewsItem
  showCountry?: boolean
  /** Render the detail body expanded on first paint (used on keyword pages
   *  where surfacing detail in SSR meaningfully boosts page text content). */
  defaultExpanded?: boolean
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  if (isNaN(then)) return ''
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const sentimentColors = {
  positive: '#22c55e',
  neutral: '#6b7280',
  negative: '#ef4444',
} as const

export default function NewsCard({ item, showCountry, defaultExpanded }: NewsCardProps) {
  const [expanded, setExpanded] = useState(Boolean(defaultExpanded))
  const [copied, setCopied] = useState(false)
  const categoryColor =
    item.category && isValidCategory(item.category)
      ? CATEGORY_META[item.category].color
      : '#6b7280'

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}/map?country=${item.country}&article=${item.id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  const pubTime = item.pubDate ? timeAgo(item.pubDate) : ''

  return (
    <article
      id={`news-${item.id}`}
      className="cursor-pointer rounded-lg border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-700"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold leading-snug text-white">
          {showCountry && item.country && (
            <span className="mr-1.5">{countryFlag(item.country)}</span>
          )}
          {item.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          {item.category && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${categoryColor}15`,
                color: categoryColor,
              }}
            >
              {item.category}
            </span>
          )}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase"
            style={{
              backgroundColor: `${sentimentColors[item.sentiment]}20`,
              color: sentimentColors[item.sentiment],
            }}
          >
            {item.sentiment}
          </span>
        </div>
      </div>
      <p className="mb-3 text-sm leading-relaxed text-gray-400">{item.summary}</p>
      {item.keywords && item.keywords.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {item.keywords.map((kw) => (
            <a
              key={kw}
              href={`/keyword/${encodeURIComponent(kw)}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-full border border-gray-800 bg-gray-950 px-2 py-0.5 text-[11px] text-gray-400 transition hover:border-gray-700 hover:text-gray-200"
            >
              #{kw}
            </a>
          ))}
        </div>
      )}
      {expanded && item.detail && (
        <div className="mb-3 rounded-md border border-gray-800 bg-gray-950 p-3">
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-300">{item.detail}</p>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-400 transition hover:text-blue-300"
            >
              {item.source}
            </a>
          ) : (
            <span>{item.source}</span>
          )}
          {pubTime && <span className="text-gray-600">{pubTime}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="inline-flex items-center gap-1 rounded-md border border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-200 transition hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-300"
            aria-expanded={expanded}
          >
            {expanded ? '접기' : '자세히 보기'}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-800 hover:text-white"
            aria-label="링크 복사"
          >
            {copied ? (
              <span className="text-[10px] text-green-400">복사됨</span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
