'use client'

import { useState } from 'react'
import type { NewsItem, NewsCategory } from '@/types/news'
import NewsCard from './NewsCard'

interface NewsPanelProps {
  country: string | null
  newsItems: NewsItem[]
  isLoading: boolean
  onClose: () => void
}

const categories: NewsCategory[] = ['Society', 'Economy']

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-gray-400">Fetching latest news...</p>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-800 bg-gray-900 p-4"
        >
          <div className="mb-2 h-4 w-3/4 rounded bg-gray-800" />
          <div className="mb-1 h-3 w-full rounded bg-gray-800" />
          <div className="mb-1 h-3 w-5/6 rounded bg-gray-800" />
          <div className="h-3 w-2/3 rounded bg-gray-800" />
        </div>
      ))}
    </div>
  )
}

export default function NewsPanel({
  country,
  newsItems,
  isLoading,
  onClose,
}: NewsPanelProps) {
  const [activeTab, setActiveTab] = useState<NewsCategory>('Society')

  const filteredItems = newsItems.filter((item) => item.category === activeTab)

  return (
    <div
      className={`fixed right-0 top-0 z-30 flex h-full w-full flex-col bg-gray-950/95 backdrop-blur-md transition-transform duration-300 sm:w-96 ${
        country ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-4">
        <h2 className="text-lg font-bold text-white">
          {country ?? ''}
        </h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-800 hover:text-white"
          aria-label="Close panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex-1 py-2.5 text-sm font-medium transition ${
              activeTab === cat
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-gray-500">
            No {activeTab.toLowerCase()} news available.
          </div>
        )}
      </div>
    </div>
  )
}
