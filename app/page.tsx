'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import NewsStand, { ALL_FREE_COUNTRIES } from '@/components/NewsStand'
import NewsCard from '@/components/NewsCard'
import AdSlot from '@/components/AdSlot'
import type { NewsItem } from '@/types/news'
import { getAllCountries, getCountryName } from '@/lib/countries'

import { SUPPORTED_COUNTRIES } from '@/lib/rss'
const allCountries = getAllCountries().filter((c) => SUPPORTED_COUNTRIES.has(c.code))
const FREE_CODES = new Set(ALL_FREE_COUNTRIES.map((c) => c.code))

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

function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex justify-center">
          <img src="/logo.png" alt="Prism" className="h-12 w-12 rounded-lg" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-white">구글 로그인으로<br />더 많은 뉴스를 만나세요</h3>
        <p className="mb-6 text-sm text-gray-400">{SUPPORTED_COUNTRIES.size}개국의 뉴스를 검색하고 열람할 수 있습니다</p>
        <a
          href="/api/auth/login"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google로 시작하기
        </a>
        <button onClick={onClose} className="mt-4 block w-full text-xs text-gray-500 hover:text-gray-300">닫기</button>
      </div>
    </div>
  )
}

function CountrySearch({ countries, onSelect, loggedIn, onLoginPrompt }: { countries: { code: string; name: string; nameKo: string }[]; onSelect: (code: string) => void; loggedIn: boolean; onLoginPrompt?: () => void }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  if (!loggedIn) {
    return (
      <div className="relative mt-2" onClick={() => onLoginPrompt?.()}>
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <div className="w-full cursor-pointer rounded-lg border border-gray-800 bg-gray-900 py-2 pl-8 pr-3 text-sm text-gray-500 sm:w-56">
            더 많은 국가를 검색하세요
          </div>
        </div>
      </div>
    )
  }

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

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const lang = 'ko' as const
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [latestItems, setLatestItems] = useState<NewsItem[]>([])
  const [latestHasMore, setLatestHasMore] = useState(false)
  const [latestCategory, setLatestCategory] = useState<string>('all')
  const [latestLoading, setLatestLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')
  const refreshMsgTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const deferredPromptRef = useRef<{ prompt: () => void } | null>(null)
  const [pullState, setPullState] = useState<'idle' | 'pulling' | 'refreshing'>('idle')
  const [pullDistance, setPullDistance] = useState(0)
  const currentCountryRef = useRef<string | null>(null)
  const [rotateTarget, setRotateTarget] = useState<[number, number] | null>(null)
  const viewModeRef = useRef(viewMode)
  const sharedArticleRef = useRef<string | null>(null)
  const isSharedLinkRef = useRef(false)
  const pullStartY = useRef(0)
  const pullDistRef = useRef(0)

  const refreshLatest = useCallback((category?: string) => {
    const cat = category ?? latestCategory
    const catParam = cat !== 'all' ? `&category=${cat}` : ''
    fetch(`/api/news/latest?lang=${lang}&limit=20${catParam}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setLatestItems(data.items)
        setLatestHasMore(data.hasMore ?? false)
      })
      .catch(() => {})
  }, [lang, latestCategory])

  const loadMoreLatest = useCallback(() => {
    setLatestLoading(true)
    const catParam = latestCategory !== 'all' ? `&category=${latestCategory}` : ''
    fetch(`/api/news/latest?lang=${lang}&offset=${latestItems.length}&limit=20${catParam}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setLatestItems((prev) => [...prev, ...data.items])
        setLatestHasMore(data.hasMore ?? false)
      })
      .catch(() => {})
      .finally(() => setLatestLoading(false))
  }, [lang, latestItems.length, latestCategory])

  const changeCategory = (cat: string) => {
    setLatestCategory(cat)
    refreshLatest(cat)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // Share link: ?country=XX&article=YY
    const countryParam = params.get('country')
    const articleParam = params.get('article')

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user)
        // Show globe after login
        if (data.user) {
          setViewMode('map'); viewModeRef.current = 'map'
        }
      })
      .catch(() => {})
      .finally(() => {
        setAuthLoading(false)
        // Handle share link after auth is resolved
        if (countryParam) {
          sharedArticleRef.current = articleParam
          isSharedLinkRef.current = true
          handleCountrySelect(countryParam)
          window.history.replaceState({}, '', window.location.pathname)
        }
      })

    refreshLatest()

    // Intercept install prompt — only show when user clicks install button
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as unknown as { prompt: () => void }
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })

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
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCountrySelect = useCallback(async (countryCode: string) => {
    // Skip login gate for shared links
    if (isSharedLinkRef.current) {
      isSharedLinkRef.current = false
    } else if (!user && !FREE_CODES.has(countryCode)) {
      setShowLoginPrompt(true)
      setSelectedCountry(null)
      return
    }
    setShowLoginPrompt(false)

    currentCountryRef.current = countryCode
    setSelectedCountry(countryCode)
    setIsLoading(true)
    setIsRefreshing(false)
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

      // Empty cache — trigger refresh and poll
      if (data.empty) {
        setIsRefreshing(true)
        setRefreshMessage('뉴스 검색은 약 30초 정도 소요됩니다')

        // Rotating messages
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

        // Step 1: Collect RSS, then Step 2: Summarize
        fetch(`/api/news/collect?country=${countryCode}`, { method: 'POST' })
          .then(() => {
            setTimeout(() => {
              fetch(`https://prism-4gy.pages.dev/api/news/collect?country=${countryCode}&lang=${lang}&step=2`, { method: 'POST' }).catch(() => {})
            }, 2000)
          })
          .catch(() => {})

        // Poll every 5s for up to 60s
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
            // Notify admin of polling failure
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
      } else if (data.refreshing) {
        setIsRefreshing(true)
      }
    } catch (err) {
      if (currentCountryRef.current !== countryCode) return
      console.error('News fetch error:', err)
      setError('Failed to load news. Please try again.')
      setIsLoading(false)
    }
  }, [lang, user])

  const sortedItems = newsItems

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800/50 bg-gray-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Prism" className="h-7 w-7 rounded-md" />
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight">Prism</span>
              <span className="text-[10px] text-gray-500">refracted by AI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Install */}
            <button
              onClick={() => {
                if (deferredPromptRef.current) {
                  deferredPromptRef.current.prompt()
                  deferredPromptRef.current = null
                } else {
                  setShowInstallGuide(true)
                }
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 text-gray-400 transition hover:border-gray-600 hover:text-white"
              aria-label="Install app"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
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
          }} loggedIn={!!user} onLoginPrompt={() => setShowLoginPrompt(true)} />

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

        {/* Login Modal */}
        {showLoginPrompt && !user && (
          <LoginModal onClose={() => setShowLoginPrompt(false)} />
        )}

        {/* Install Guide Modal */}
        {showInstallGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInstallGuide(false)}>
            <div className="mx-4 w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex justify-center">
                <img src="/logo.png" alt="Prism" className="h-12 w-12 rounded-lg" />
              </div>
              <h3 className="mb-4 text-lg font-bold text-white">홈 화면에 추가</h3>
              <div className="mb-4 space-y-3 text-left text-sm text-gray-300">
                <div className="rounded-lg bg-gray-800 p-3">
                  <p className="mb-1 font-medium text-blue-400">iPhone / iPad</p>
                  <p className="text-xs text-gray-400">Safari 하단 공유 버튼(↑) → &quot;홈 화면에 추가&quot;</p>
                </div>
                <div className="rounded-lg bg-gray-800 p-3">
                  <p className="mb-1 font-medium text-green-400">Android</p>
                  <p className="text-xs text-gray-400">Chrome 메뉴(⋮) → &quot;홈 화면에 추가&quot;</p>
                </div>
              </div>
              <p className="mb-4 text-xs text-gray-500">앱처럼 빠르게 접속할 수 있습니다</p>
              <button onClick={() => setShowInstallGuide(false)} className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">확인</button>
            </div>
          </div>
        )}

        <AdSlot slot="top-banner" type="banner" />

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
                  onClick={() => selectedCountry && handleCountrySelect(selectedCountry)}
                  className="rounded-md bg-red-900/50 px-3 py-1 text-xs text-red-300 transition hover:bg-red-900/70"
                >
                  Retry
                </button>
              </div>
            ) : isLoading ? (
              <LoadingSkeleton />
            ) : sortedItems.length > 0 ? (
              <div className="space-y-3">
                {sortedItems.map((item, i) => (
                  <div key={item.id}>
                    <NewsCard item={item} />
                    {(i + 1) % 5 === 0 && i < sortedItems.length - 1 && (
                      <AdSlot slot={`news-${i}`} type="inline" />
                    )}
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
        {!selectedCountry && !showLoginPrompt && (
          <section className="mb-8">
            {latestItems.length > 0 ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-400">Latest</h2>
                  <select
                    value={latestCategory}
                    onChange={(e) => changeCategory(e.target.value)}
                    className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-300 outline-none transition focus:border-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="Politics">Politics</option>
                    <option value="Economy">Economy</option>
                    <option value="Tech">Tech</option>
                    <option value="Defense">Defense</option>
                    <option value="Diplomacy">Diplomacy</option>
                    <option value="Society">Society</option>
                    <option value="Health">Health</option>
                    <option value="Environment">Environment</option>
                    <option value="Culture">Culture</option>
                  </select>
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

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-gray-700/90 text-white shadow-lg transition hover:bg-gray-600"
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}
    </div>
  )
}
