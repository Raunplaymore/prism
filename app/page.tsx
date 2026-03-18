'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import NewsStand from '@/components/NewsStand'
import NewsCard from '@/components/NewsCard'
import PaywallModal from '@/components/PaywallModal'
import type { NewsItem, NewsCategory, UsageState } from '@/types/news'
import { getAllCountries, getCountryName } from '@/lib/countries'

const allCountries = getAllCountries()

const WorldMap = dynamic(() => import('@/components/map/WorldMap'), { ssr: false })

const categories: NewsCategory[] = ['Society', 'Economy']

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-gray-400">Fetching latest news...</p>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="mb-2 h-4 w-3/4 rounded bg-gray-800" />
          <div className="mb-1 h-3 w-full rounded bg-gray-800" />
          <div className="h-3 w-2/3 rounded bg-gray-800" />
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [lang, setLang] = useState<'en' | 'ko'>('ko')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [activeTab, setActiveTab] = useState<NewsCategory>('Society')
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})
  const [usage, setUsage] = useState<UsageState>({
    clicksToday: 0,
    lastClickDate: '',
    clickedCountries: [],
  })

  const handleCountrySelect = useCallback(async (countryCode: string) => {
    setSelectedCountry(countryCode)
    setIsLoading(true)
    setNewsItems([])

    try {
      const res = await fetch(`/api/news?country=${countryCode}&lang=${lang}`)
      const data = await res.json()

      if (res.status === 402) {
        setShowPaywall(true)
        setIsLoading(false)
        return
      }

      if (!res.ok) throw new Error(data.error || 'Failed to fetch news')

      setNewsItems(data.items)
      setHeatmapData(prev => ({
        ...prev,
        [countryCode]: (prev[countryCode] || 0) + 1,
      }))
      setUsage(prev => ({
        clicksToday: prev.clicksToday + 1,
        lastClickDate: new Date().toISOString().split('T')[0],
        clickedCountries: prev.clickedCountries.includes(countryCode)
          ? prev.clickedCountries
          : [...prev.clickedCountries, countryCode],
      }))
    } catch (err) {
      console.error('News fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [lang])

  const filteredItems = newsItems.filter((item) => item.category === activeTab)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800/50 bg-gray-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight">Prism</span>
            <span className="hidden text-xs text-gray-500 sm:inline">World News at a Glance</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-500">{usage.clicksToday}/5 today</span>
            <div className="flex overflow-hidden rounded-md border border-gray-700 bg-gray-900/80">
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 text-[11px] font-medium transition ${
                  lang === 'en' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('ko')}
                className={`px-2.5 py-1 text-[11px] font-medium transition ${
                  lang === 'ko' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                KO
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
        {/* NewsStand */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-400">Quick Access</h2>
          <NewsStand
            selectedCountry={selectedCountry}
            onSelect={handleCountrySelect}
            isLoading={isLoading}
          />
          <select
            value={selectedCountry ?? ''}
            onChange={(e) => {
              if (e.target.value) handleCountrySelect(e.target.value)
            }}
            className="mt-3 w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-gray-300 outline-none transition focus:border-blue-500 sm:w-64"
          >
            <option value="">All countries...</option>
            {allCountries.map(({ code, name }) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </section>

        {/* Atlas */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-gray-400">Atlas</h2>
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          <div className="h-[250px] sm:h-[350px] lg:h-[400px]">
            <WorldMap
              onCountrySelect={handleCountrySelect}
              heatmapData={heatmapData}
              selectedCountry={selectedCountry}
            />
          </div>
          </div>
        </section>

        {/* News Section */}
        {selectedCountry && (
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold">{getCountryName(selectedCountry)}</h2>
            </div>

            {/* Category Tabs */}
            <div className="mb-4 flex gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition sm:flex-none ${
                    activeTab === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* News List */}
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredItems.length > 0 ? (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-sm text-gray-500">
                No {activeTab.toLowerCase()} news available.
              </div>
            )}
          </section>
        )}

        {/* Empty State */}
        {!selectedCountry && (
          <div className="flex h-32 items-center justify-center text-sm text-gray-600">
            Select a country from the tabs above or click on the map
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 bg-gray-950">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <span className="text-[11px] text-gray-500">
            Summaries are AI-generated. For accuracy, please read the original article from the source.
          </span>
        </div>
      </footer>

      {showPaywall && (
        <PaywallModal onClose={() => setShowPaywall(false)} />
      )}
    </div>
  )
}
