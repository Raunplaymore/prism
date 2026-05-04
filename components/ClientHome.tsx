'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import NewsStand from '@/components/NewsStand'
import NewsCard from '@/components/NewsCard'
import AdSlot from '@/components/AdSlot'
import InstallButton from '@/components/InstallButton'
import type { NewsItem } from '@/types/news'
import { getAllCountries, getCountryName } from '@/lib/countries'

import { SUPPORTED_COUNTRIES } from '@/lib/rss'
const allCountries = getAllCountries().filter((c) => SUPPORTED_COUNTRIES.has(c.code))

const WorldMap = dynamic(() => import('@/components/map/WorldMap'), { ssr: false })

/** Approximate center coordinates [lon, lat] for countries */
const COUNTRY_COORDS: Record<string, [number, number]> = {
  KR: [127, 36], JP: [139, 36], CN: [104, 35], TW: [121, 24], MN: [105, 47],
  KP: [127, 40], US: [-98, 38], CA: [-106, 56], BR: [-51, -10], MX: [-102, 23],
  AR: [-64, -34], CO: [-74, 4], VE: [-66, 7], CU: [-79, 22], CL: [-71, -35],
  PE: [-76, -10], GB: [-2, 54], FR: [2, 47], DE: [10, 51], IT: [12, 43],
  ES: [-4, 40], PT: [-8, 39], NL: [5, 52], PL: [20, 52], SE: [18, 62],
  NO: [10, 62], GR: [22, 39], BE: [4, 51], AT: [14, 47], CH: [8, 47],
  DK: [10, 56], FI: [26, 64], IE: [-8, 53], CZ: [15, 50], RO: [25, 46],
  HU: [19, 47], RS: [21, 44], HR: [16, 45], BG: [25, 43], SK: [19, 49],
  LT: [24, 56], LV: [25, 57], EE: [26, 59], MD: [29, 47],
  RU: [100, 60], UA: [32, 49], BY: [28, 53], KZ: [67, 48], GE: [44, 42],
  IL: [35, 31], IR: [53, 32], SA: [45, 24], EG: [30, 27], IQ: [44, 33],
  SY: [38, 35], LB: [36, 34], AE: [54, 24], TR: [35, 39], JO: [36, 31], QA: [51, 25],
  IN: [79, 21], PK: [69, 30], BD: [90, 24], TH: [101, 15], VN: [108, 16],
  ID: [118, -2], PH: [122, 13], MM: [96, 19], SG: [104, 1], MY: [110, 4], KH: [105, 13],
  AU: [134, -25], NZ: [174, -41],
  NG: [8, 10], ZA: [25, -29], KE: [38, 0], ET: [40, 9], SD: [30, 16],
  CD: [24, -3], GH: [-2, 8], TN: [9, 34], LY: [17, 27], MA: [-6, 32],
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

function CountrySearch({ countries, onSelect }: { countries: { code: string; name: string; nameKo: string }[]; onSelect: (code: string) => void }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const q = query.toLowerCase()
  const filtered = query.length > 0
    ? countries.filter((c) => c.name.toLowerCase().includes(q) || c.nameKo.includes(query) || c.code.toLowerCase().includes(q)).slice(0, 8)
    : []

  return (
    <div className="relative mt-2">
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="국가 검색..."
          className="w-full rounded-lg border border-gray-800 bg-gray-900 py-2 pl-8 pr-3 text-sm text-gray-300 outline-none transition focus:border-blue-500 sm:w-56"
        />
      </div>
      {focused && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 shadow-xl sm:w-56">
          {filtered.map(({ code, name, nameKo }) => (
            <button
              key={code}
              onMouseDown={() => { onSelect(code); setQuery(''); setFocused(false) }}
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
            >
              <span>{nameKo}</span>
              <span className="text-gray-600">{name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ClientHome({
  initialLatestItems = [],
}: {
  initialLatestItems?: NewsItem[]
}) {
  const lang = 'ko' as const
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [needsScrape, setNeedsScrape] = useState(false)
  const [latestItems, setLatestItems] = useState<NewsItem[]>(initialLatestItems)
  const [latestHasMore, setLatestHasMore] = useState(false)
  const [latestLoading, setLatestLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')
  const refreshMsgTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [error, setError] = useState<string | null>(null)
  // /map 페이지 진입 시 기본값은 globe(map). 사용자는 토글로 list 전환 가능.
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map')
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})
  const [pullState, setPullState] = useState<'idle' | 'pulling' | 'refreshing'>('idle')
  const [pullDistance, setPullDistance] = useState(0)
  const currentCountryRef = useRef<string | null>(null)
  const [rotateTarget, setRotateTarget] = useState<[number, number] | null>(null)
  const viewModeRef = useRef(viewMode)
  const sharedArticleRef = useRef<string | null>(null)
  const isSharedLinkRef = useRef(false)
  const pullStartY = useRef(0)
  const pullDistRef = useRef(0)

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
    const params = new URLSearchParams(window.location.search)

    // Share link: ?country=XX&article=YY
    const countryParam = params.get('country')
    const articleParam = params.get('article')
    if (countryParam) {
      sharedArticleRef.current = articleParam
      isSharedLinkRef.current = true
      handleCountrySelect(countryParam)
      window.history.replaceState({}, '', window.location.pathname)
    }

    refreshLatest()

    // Pull-to-refresh — only on global feed, only real drag (not taps)
    let pulling = false
    const onTouchStart = (e: TouchEvent) => {
      pulling = false
      pullDistRef.current = 0
      if (window.scrollY <= 0 && !currentCountryRef.current) {
        pullStartY.current = e.touches[0].clientY
      } else {
        pullStartY.current = 0
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (pullStartY.current === 0 || window.scrollY > 0) return
      const dist = e.touches[0].clientY - pullStartY.current
      if (dist > 10) { // threshold to distinguish from tap
        pulling = true
        const d = Math.min(dist, 120)
        pullDistRef.current = d
        setPullDistance(d)
        setPullState('pulling')
      }
    }
    const onTouchEnd = () => {
      if (!pulling) {
        pullStartY.current = 0
        return
      }
      pullStartY.current = 0
      pulling = false
      if (pullDistRef.current > 60) {
        setPullState('refreshing')
        setPullDistance(60)
        const done = () => { setPullState('idle'); setPullDistance(0); pullDistRef.current = 0 }
        refreshLatest()
        setTimeout(done, 500)
      } else {
        setPullState('idle')
        setPullDistance(0)
        pullDistRef.current = 0
      }
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartScrape = useCallback((countryCode: string) => {
    setNeedsScrape(false)
    setIsRefreshing(true)
    setError(null)
    setRefreshMessage('뉴스 검색은 약 30초 정도 소요됩니다')

    const msgs = ['뉴스 수집중...', '뉴스 요약중...', '뉴스 번역중...']
    let msgIdx = 0
    setTimeout(() => {
      if (currentCountryRef.current === countryCode) {
        setRefreshMessage(msgs[0])
        refreshMsgTimer.current = setInterval(() => {
          msgIdx = (msgIdx + 1) % msgs.length
          setRefreshMessage(msgs[msgIdx])
        }, 5000)
      }
    }, 3000)

    fetch(`/api/news/collect?country=${countryCode}`, { method: 'POST' })
      .then(() => {
        setTimeout(() => {
          fetch(`https://prism-4gy.pages.dev/api/news/collect?country=${countryCode}&lang=${lang}&step=2`, { method: 'POST' }).catch(() => {})
        }, 2000)
      })
      .catch(() => {})

    let polls = 0
    const maxPolls = 12
    const pollInterval = setInterval(async () => {
      polls++
      if (currentCountryRef.current !== countryCode) {
        clearInterval(pollInterval)
        return
      }
      if (polls > maxPolls) {
        clearInterval(pollInterval)
        setIsRefreshing(false)
        setRefreshMessage('')
        if (refreshMsgTimer.current) clearInterval(refreshMsgTimer.current)
        setError(`${getCountryName(countryCode)} 뉴스를 가져오지 못했습니다.`)
        fetch(`/api/news/refresh?country=${countryCode}&lang=${lang}&poll_failed=true`, { method: 'POST' }).catch(() => {})
        return
      }
      try {
        const pollRes = await fetch(`/api/news?country=${countryCode}&lang=${lang}`)
        const pollData = await pollRes.json()
        if (pollData.items?.length > 0 && currentCountryRef.current === countryCode) {
          setNewsItems(pollData.items)
          setIsRefreshing(false)
          setRefreshMessage('')
          if (refreshMsgTimer.current) clearInterval(refreshMsgTimer.current)
          clearInterval(pollInterval)
          refreshLatest()
        }
      } catch { /* ignore */ }
    }, 5000)
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCountrySelect = useCallback(async (countryCode: string) => {
    // Login gate removed — all users can select any country.
    if (isSharedLinkRef.current) {
      isSharedLinkRef.current = false
    }

    currentCountryRef.current = countryCode
    setSelectedCountry(countryCode)
    setIsLoading(true)
    setIsRefreshing(false)
    setNeedsScrape(false)
    setError(null)

    try {
      const res = await fetch(`/api/news?country=${countryCode}&lang=${lang}`)
      const data = await res.json()

      if (currentCountryRef.current !== countryCode) return

      if (res.status === 404 && data.error === 'unsupported') {
        setError(lang === 'ko'
          ? `${getCountryName(countryCode)}은(는) 현재 미제공 국가입니다.`
          : `${getCountryName(countryCode)} is not available yet.`)
        setIsLoading(false)
        return
      }

      if (!res.ok) throw new Error(data.error || 'Failed to fetch news')

      setNewsItems(data.items)
      setIsLoading(false)

      // Scroll to shared article if present
      if (sharedArticleRef.current) {
        const targetId = sharedArticleRef.current
        sharedArticleRef.current = null
        setTimeout(() => {
          const el = document.getElementById(`news-${targetId}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('ring-2', 'ring-blue-500')
            setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500'), 3000)
          }
        }, 100)
      }

      setHeatmapData(prev => ({
        ...prev,
        [countryCode]: (prev[countryCode] || 0) + 1,
      }))

      // Empty cache — show explicit scrape button instead of auto-fetching.
      // Avoids accidental LLM calls when the user grazes a country while
      // rotating the globe.
      if (data.empty) {
        setNeedsScrape(true)
      } else if (data.refreshing) {
        setIsRefreshing(true)
      }
    } catch (err) {
      if (currentCountryRef.current !== countryCode) return
      console.error('News fetch error:', err)
      setError('Failed to load news. Please try again.')
      setIsLoading(false)
    }
  }, [lang])

  const sortedItems = newsItems

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800/50 bg-gray-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3 sm:gap-5">
            <a href="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="prismglobe" className="h-7 w-7 rounded-md" />
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tight">prismglobe</span>
                <span className="text-[10px] text-gray-500">refracted by AI</span>
              </div>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <InstallButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
        {/* SSR-visible page intro — collapsed by default to save space, but
            the description body stays in the DOM so crawlers/screen readers
            still see it (native <details> elements are indexed by Google). */}
        <section className="mb-3 sm:mb-4">
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            지구를 굴려 만나는 세계 뉴스
          </h1>
          <details className="group mt-1 max-w-2xl">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-gray-500 transition hover:text-gray-300">
              <span>AI가 정제한 50여 개국 뉴스 브리핑</span>
              <svg
                className="h-3 w-3 transition-transform group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              전 세계 50여 개국의 현지 언론을 AI가 직접 수집·분류·요약하여 한국어로 제공하는 뉴스 브리핑 서비스입니다.
              키워드를 누르면 같은 사건을 여러 국가가 어떻게 다루는지 한눈에 비교할 수 있고, 지도에서 국가를 선택하면
              해당 국가에서 지금 가장 많이 보도되는 이슈를 확인할 수 있습니다.
            </p>
          </details>
        </section>
        {pullState !== 'idle' && (
          <div
            className="flex items-center justify-center overflow-hidden transition-all"
            style={{ height: pullDistance }}
          >
            {pullState === 'refreshing' ? (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-blue-400" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-gray-500 transition-transform"
                style={{ transform: `rotate(${pullDistance > 60 ? 180 : 0}deg)` }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )}
          </div>
        )}
        {/* Country Selector */}
        <section className="mb-4">
          <NewsStand
            selectedCountry={selectedCountry}
            onSelect={(code: string) => {
              const coords = COUNTRY_COORDS[code]
              if (coords && viewMode === 'map') {
                setRotateTarget([...coords] as [number, number])
              }
              handleCountrySelect(code)
            }}
            isLoading={isLoading}
            onToggleMap={() => {
              if (viewMode === 'map') {
                setViewMode('list'); viewModeRef.current = 'list'
              } else {
                setViewMode('map'); viewModeRef.current = 'map'
                setSelectedCountry(null)
                setNewsItems([])
              }
            }}
            mapOpen={viewMode === 'map'}
          />
          <CountrySearch countries={allCountries} onSelect={(code) => {
            const coords = COUNTRY_COORDS[code]
            if (coords && viewMode === 'map') {
              setRotateTarget([...coords] as [number, number])
            }
            handleCountrySelect(code)
          }} />

          {/* Map (collapsible) */}
          {viewMode === 'map' && (
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
              <div className="h-[190px] sm:h-[350px] lg:h-[400px]">
                <WorldMap
                  onCountrySelect={handleCountrySelect}
                  heatmapData={heatmapData}
                  selectedCountry={selectedCountry}
                  rotateTarget={rotateTarget}
                />
              </div>
            </div>
          )}
        </section>

        {/* Install Guide Modal */}
        {/* <AdSlot slot="top-banner" type="banner" /> */}

        {/* News Section */}
        {selectedCountry && (
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-bold">{getCountryName(selectedCountry)}</h2>
            </div>

            {/* News List */}
            {error ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 text-sm text-red-400">
                <span>{error}</span>
                <button
                  onClick={() => {
                    if (selectedCountry) handleCountrySelect(selectedCountry)
                  }}
                  className="rounded-md bg-red-900/50 px-3 py-1 text-xs text-red-300 transition hover:bg-red-900/70"
                >
                  Retry
                </button>
              </div>
            ) : needsScrape && selectedCountry ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-800 bg-gray-900/40 px-6 py-10 text-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <div>
                  <p className="text-sm text-gray-300">
                    {getCountryName(selectedCountry)}의 캐시된 기사가 없습니다.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    수집은 약 30초 소요됩니다.
                  </p>
                </div>
                <button
                  onClick={() => handleStartScrape(selectedCountry)}
                  className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                >
                  뉴스 수집 시작
                </button>
              </div>
            ) : isLoading ? (
              <LoadingSkeleton />
            ) : sortedItems.length > 0 ? (
              <div className="space-y-3">
                {sortedItems.map((item, i) => (
                  <div key={item.id}>
                    <NewsCard item={item} />
                    {/* AdSlot: re-enable after AdSense approval */}
                  </div>
                ))}
              </div>
            ) : isRefreshing ? (
              <div className="relative">
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="animate-pulse rounded-lg border border-gray-800 bg-gray-900 p-4">
                      <div className="mb-2 h-4 w-3/4 rounded bg-gray-800" />
                      <div className="mb-1 h-3 w-full rounded bg-gray-800" />
                      <div className="h-3 w-2/3 rounded bg-gray-800" />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/60 backdrop-blur-[2px]">
                  <span className="mb-3 inline-block h-7 w-7 animate-spin rounded-full border-2 border-gray-600 border-t-blue-400" />
                  <p className="text-sm font-medium text-blue-400">{refreshMessage || '뉴스를 준비하고 있습니다...'}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-sm text-gray-500">
                No news available.
              </div>
            )}
          </section>
        )}

        {/* Latest Feed — shown when no country is selected */}
        {!selectedCountry && (
          <section className="mb-8">
            {latestItems.length > 0 ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-400">Latest</h2>
                </div>
                <div className="space-y-3">
                  {latestItems.map((item, i) => (
                    <div key={item.id}>
                      <NewsCard item={item} showCountry />
                      {(i + 1) % 5 === 0 && i < latestItems.length - 1 && (
                        <AdSlot slot={`latest-${i}`} type="inline" />
                      )}
                    </div>
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
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2 text-[11px] text-gray-500">
          <span className="hidden sm:inline">AI-generated summaries.</span>
          <a href="/about" className="hover:text-gray-300">About</a>
          <a href="/privacy" className="hover:text-gray-300">Privacy</a>
        </div>
      </footer>
    </div>
  )
}
