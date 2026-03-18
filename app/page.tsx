'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import NewsStand, { ALL_FREE_COUNTRIES } from '@/components/NewsStand'
import NewsCard from '@/components/NewsCard'
import type { NewsItem, NewsCategory } from '@/types/news'
import { getAllCountries, getCountryName } from '@/lib/countries'

const allCountries = getAllCountries()
const FREE_CODES = new Set(ALL_FREE_COUNTRIES.map((c) => c.code))

const WorldMap = dynamic(() => import('@/components/map/WorldMap'), { ssr: false })

const categories: NewsCategory[] = ['Society', 'Economy']

interface User {
  email: string
  name: string
  picture: string
  isAdmin: boolean
}

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

function LoginPrompt() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l2 2" />
      </svg>
      <p className="text-sm text-gray-400">
        Sign in to access news from all countries
      </p>
      <a
        href="/api/auth/login"
        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign in with Google
      </a>
    </div>
  )
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [lang, setLang] = useState<'en' | 'ko'>('ko')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [latestItems, setLatestItems] = useState<NewsItem[]>([])
  const [latestHasMore, setLatestHasMore] = useState(false)
  const [latestLoading, setLatestLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [activeTab, setActiveTab] = useState<NewsCategory>('Society')
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})

  const refreshLatest = useCallback(() => {
    fetch(`/api/news/latest?lang=${lang}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setLatestItems(data.items)
        setLatestHasMore(data.hasMore ?? false)
      })
      .catch(() => {})
  }, [lang])

  const loadMoreLatest = useCallback(() => {
    setLatestLoading(true)
    fetch(`/api/news/latest?lang=${lang}&offset=${latestItems.length}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setLatestItems((prev) => [...prev, ...data.items])
        setLatestHasMore(data.hasMore ?? false)
      })
      .catch(() => {})
      .finally(() => setLatestLoading(false))
  }, [lang, latestItems.length])

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setAuthLoading(false))

    refreshLatest()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCountrySelect = useCallback(async (countryCode: string) => {
    if (!user && !FREE_CODES.has(countryCode)) {
      setShowLoginPrompt(true)
      setSelectedCountry(null)
      return
    }
    setShowLoginPrompt(false)

    setSelectedCountry(countryCode)
    setIsLoading(true)
    setIsRefreshing(false)
    setError(null)
    // Don't clear newsItems — keep previous while loading

    try {
      // Step 1: Get cached feed (fast)
      const res = await fetch(`/api/news?country=${countryCode}&lang=${lang}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to fetch news')

      setNewsItems(data.items)
      setIsLoading(false)
      setHeatmapData(prev => ({
        ...prev,
        [countryCode]: (prev[countryCode] || 0) + 1,
      }))

      // Step 2: If stale, trigger background refresh
      if (data.refreshing) {
        setIsRefreshing(true)
        try {
          const refreshRes = await fetch(`/api/news?country=${countryCode}&lang=${lang}&refresh=true`)
          const refreshData = await refreshRes.json()
          if (refreshRes.ok) {
            setNewsItems(refreshData.items)
            refreshLatest() // Update global feed with new articles
          }
        } catch {
          // Refresh failure is non-critical — stale data is still shown
        } finally {
          setIsRefreshing(false)
        }
      }
    } catch (err) {
      console.error('News fetch error:', err)
      setError('Failed to load news. Please try again.')
      setIsLoading(false)
    }
  }, [lang, user])

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
            {/* Auth */}
            {authLoading ? null : user ? (
              <div className="flex items-center gap-2">
                <img src={user.picture} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
                <span className="hidden text-xs text-gray-400 sm:inline">{user.name}</span>
                {user.isAdmin && (
                  <a href="/admin" className="text-[10px] text-yellow-500 hover:text-yellow-400">Admin</a>
                )}
                <a href="/api/auth/logout" className="text-[11px] text-gray-500 hover:text-gray-300">Logout</a>
              </div>
            ) : (
              <a
                href="/api/auth/login"
                className="rounded-md border border-gray-700 px-2.5 py-1 text-[11px] text-gray-400 transition hover:border-gray-600 hover:text-white"
              >
                Sign in
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
        {/* Country Selector */}
        <section className="mb-4">
          <NewsStand
            selectedCountry={selectedCountry}
            onSelect={handleCountrySelect}
            isLoading={isLoading}
            onToggleMap={() => {
              if (viewMode === 'map') {
                setViewMode('list')
              } else {
                setViewMode('map')
                setSelectedCountry(null)
                setNewsItems([])
              }
            }}
            mapOpen={viewMode === 'map'}
          />
          {user && (
            <select
              value={selectedCountry ?? ''}
              onChange={(e) => { if (e.target.value) handleCountrySelect(e.target.value) }}
              className="mt-2 w-full rounded-lg border border-gray-800 bg-gray-900 px-2 py-1.5 text-xs text-gray-300 outline-none transition focus:border-blue-500 sm:w-48"
            >
              <option value="">All countries...</option>
              {allCountries.map(({ code, name }) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          )}
          {!user && (
            <p className="mt-2 text-xs text-gray-600">Sign in to browse all countries</p>
          )}

          {/* Map (collapsible) */}
          {viewMode === 'map' && (
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
              <div className="h-[250px] sm:h-[350px] lg:h-[400px]">
                <WorldMap
                  onCountrySelect={handleCountrySelect}
                  heatmapData={heatmapData}
                  selectedCountry={selectedCountry}
                />
              </div>
            </div>
          )}
        </section>

        {/* Login Prompt */}
        {showLoginPrompt && !user && (
          <section className="mb-6">
            <LoginPrompt />
          </section>
        )}

        {/* News Section */}
        {selectedCountry && (
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-bold">{getCountryName(selectedCountry)}</h2>
              {isRefreshing && (
                <span className="inline-flex items-center gap-1.5 text-xs text-blue-400">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                  Updating...
                </span>
              )}
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
            {error ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 text-sm text-red-400">
                <span>{error}</span>
                <button
                  onClick={() => selectedCountry && handleCountrySelect(selectedCountry)}
                  className="rounded-md bg-red-900/50 px-3 py-1 text-xs text-red-300 transition hover:bg-red-900/70"
                >
                  Retry
                </button>
              </div>
            ) : isLoading ? (
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

        {/* Latest Feed — shown when no country is selected */}
        {!selectedCountry && !showLoginPrompt && (
          <section className="mb-8">
            {latestItems.length > 0 ? (
              <>
                <h2 className="mb-3 text-sm font-semibold text-gray-400">Latest</h2>
                <div className="space-y-3">
                  {latestItems.map((item) => (
                    <NewsCard key={item.id} item={item} showCountry />
                  ))}
                </div>
                {latestHasMore && (
                  <button
                    onClick={loadMoreLatest}
                    disabled={latestLoading}
                    className="mt-4 w-full rounded-lg border border-gray-800 bg-gray-900 py-2.5 text-sm text-gray-400 transition hover:border-gray-700 hover:text-white disabled:cursor-wait disabled:opacity-50"
                  >
                    {latestLoading ? 'Loading...' : 'More'}
                  </button>
                )}
              </>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-gray-600">
                Select a country to get started
              </div>
            )}
          </section>
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

    </div>
  )
}
