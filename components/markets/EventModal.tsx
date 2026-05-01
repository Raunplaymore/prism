'use client'

import { useEffect, useState } from 'react'
import EventCard, { type EventCardItem } from './EventCard'
import type { NewsArticle } from '@/lib/polymarket/news'

interface ModalContent {
  titleKo: string
  contextKo: string
  marketLabelsKo: Record<string, string>
  articles: NewsArticle[]
}

export default function EventModal({
  item,
  onClose,
}: {
  item: EventCardItem
  onClose: () => void
}) {
  const [content, setContent] = useState<ModalContent | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    const markets = (item.event.markets || [])
      .filter((m) => m.active && !m.closed)
      .slice(0, 8)
      .map((m) => ({
        id: m.id,
        question: m.question,
        groupItemTitle: m.groupItemTitle,
      }))
    const tags = (item.event.tags || []).map((t) => ({
      id: t.id,
      label: t.label,
      slug: t.slug,
      forceShow: t.forceShow,
      forceHide: t.forceHide,
    }))

    fetch('/api/markets/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: item.event.id,
        eventTitle: item.event.title,
        category: item.category,
        context: item.event.eventMetadata?.context_description ?? '',
        markets,
        tags,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: ModalContent) => {
        if (!cancelled) setContent(data)
      })
      .catch(() => {
        if (!cancelled) setError('상세 정보를 불러오지 못했습니다.')
      })

    return () => {
      cancelled = true
    }
  }, [item.event.id, item.event.title, item.category])

  const enrichedItem: EventCardItem = content
    ? {
        ...item,
        titleKo: content.titleKo,
        contextKo: content.contextKo,
        marketLabelsKo: content.marketLabelsKo,
        articles: content.articles,
      }
    : item

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative my-8 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 rounded p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {error ? (
          <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : (
          <EventCard item={enrichedItem} loading={!content} />
        )}
      </div>
    </div>
  )
}
