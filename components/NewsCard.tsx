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

const categoryColors: Record<string, string> = {
  Politics: '#3b82f6',
  Economy: '#22c55e',
  Society: '#6b7280',
  Tech: '#a855f7',
  Defense: '#ef4444',
  Diplomacy: '#eab308',
  Environment: '#10b981',
  Health: '#06b6d4',
  Culture: '#ec4899',
}

export default function NewsCard({ item, showCountry }: NewsCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}?country=${item.country}&article=${item.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url: shareUrl })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
                backgroundColor: `${categoryColors[item.category] ?? '#6b7280'}15`,
                color: categoryColors[item.category] ?? '#6b7280',
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
      {expanded && item.detail && (
        <div className="mb-3 rounded-md border border-gray-800 bg-gray-950 p-3">
          <p className="text-sm leading-relaxed text-gray-300">{item.detail}</p>
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
        <div className="flex items-center gap-3">
          <span className="text-gray-600">{expanded ? 'Collapse' : 'Detail'}</span>
          <button
            onClick={handleShare}
            className="text-gray-500 transition hover:text-white"
            aria-label="Share"
          >
            {copied ? (
              <span className="text-green-400">Copied!</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
