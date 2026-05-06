'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllCountries } from '@/lib/countries'
import { SUPPORTED_COUNTRIES } from '@/lib/rss'
import { CATEGORY_KEYS, CATEGORY_META } from '@/lib/categories'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface User {
  email: string
  name: string
  picture: string
  isAdmin: boolean
}

interface NewsItem {
  title: string
  source: string
  url: string
  publishedAt?: string
  pubDate?: string
  category?: string
  sentiment?: string
  detail?: string
  keywords?: string[]
}

interface ProbeResult {
  total: number
  topSources: { source: string; count: number }[]
  sentiment: { positive: number; neutral: number; negative: number }
  categoryDist: { category: string; count: number }[]
  avgDetailLen: number
  dateRange: { oldest: string; newest: string } | null
}

interface PivotIdea {
  text: string
  ts: number
}

// ────────────────────────────────────────────────────────────
// Static data
// ────────────────────────────────────────────────────────────

const ASSETS = [
  { emoji: '🌍', title: '다국가 RSS 수집', desc: 'Google News RSS 82개국 × 다국어', stat: '82 countries' },
  { emoji: '🏷️', title: '큐레이션 키워드 vocabulary', desc: '인물·국가·조직·기업·토픽·이벤트 슬러그', stat: '69 slugs' },
  { emoji: '📰', title: '카테고리 분류', desc: '정치·경제·사회·기술·국방·외교·환경·건강·문화', stat: '9 categories' },
  { emoji: '😊', title: 'Sentiment 라벨', desc: '기사별 긍정·중립·부정 LLM 자동 태깅', stat: 'pos/neu/neg' },
  { emoji: '🔍', title: '다국가 SSR Synthesis', desc: '카테고리·키워드·국가별 동적 한국어 정리 (LLM 비용 X)', stat: 'no per-view cost' },
  { emoji: '🌐', title: '3D Globe + Country Lens', desc: 'D3 + Topojson 글로브, 국가별 sentiment heatmap', stat: 'interactive' },
  { emoji: '⚡', title: 'Cloudflare Pages Edge', desc: 'Global edge, low latency', stat: 'edge runtime' },
  { emoji: '💾', title: 'Upstash Redis 캐시', desc: '24h TTL, 6h batched refresh, 비용 통제', stat: '24h cache' },
  { emoji: '🤖', title: 'gpt-4o-mini 파이프라인', desc: 'RSS → filter → category/summary/detail/sentiment/keyword', stat: '~$1.5/mo' },
  { emoji: '📈', title: 'GA4 + Search Console', desc: '트래픽 측정 + UTM 분기 (Threads/IG)', stat: 'measured' },
  { emoji: '💰', title: 'Google AdSense', desc: '인-피드 광고 surface 4-5곳', stat: 'live' },
  { emoji: '📱', title: 'IG Carousel + Threads 도구', desc: 'admin/instagram에서 article → 5장 1080×1350 PNG + caption 자동 생성', stat: 'auto-generated' },
  { emoji: '🔐', title: 'Google OAuth + Admin gate', desc: '`isAdmin` 인증, ADMIN_EMAIL env', stat: 'enabled' },
  { emoji: '🚀', title: 'dev/main 분리 + preview guard', desc: 'CF Pages preview에서 destructive endpoint 차단', stat: 'enforced' },
] as const

const POPULAR_KEYWORDS = [
  { slug: 'trump', label: 'Trump' },
  { slug: 'musk', label: 'Elon Musk' },
  { slug: 'china', label: 'China' },
  { slug: 'us', label: 'United States' },
  { slug: 'ukraine', label: 'Ukraine' },
  { slug: 'xi-jinping', label: 'Xi Jinping' },
  { slug: 'tariff', label: 'Tariff' },
  { slug: 'ai', label: 'AI' },
]

const allCountries = getAllCountries().filter((c) => SUPPORTED_COUNTRIES.has(c.code))

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

function analyzeItems(items: NewsItem[], selectedCategory: string): ProbeResult {
  const sourceCounts: Record<string, number> = {}
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
  const categoryCounts: Record<string, number> = {}
  let totalDetailLen = 0
  const dates: number[] = []

  for (const item of items) {
    // source
    sourceCounts[item.source] = (sourceCounts[item.source] ?? 0) + 1

    // sentiment
    const s = item.sentiment ?? ''
    if (s === 'positive') sentimentCounts.positive++
    else if (s === 'negative') sentimentCounts.negative++
    else sentimentCounts.neutral++

    // category
    if (item.category) {
      categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1
    }

    // detail length
    totalDetailLen += item.detail?.length ?? 0

    // date
    const raw = item.publishedAt ?? item.pubDate
    if (raw) {
      const d = new Date(raw).getTime()
      if (!isNaN(d)) dates.push(d)
    }
  }

  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }))

  const categoryDist =
    selectedCategory
      ? []
      : Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([category, count]) => ({ category, count }))

  const dateRange =
    dates.length > 0
      ? {
          oldest: new Date(Math.min(...dates)).toLocaleString('ko'),
          newest: new Date(Math.max(...dates)).toLocaleString('ko'),
        }
      : null

  return {
    total: items.length,
    topSources,
    sentiment: sentimentCounts,
    categoryDist,
    avgDetailLen: items.length > 0 ? Math.round(totalDetailLen / items.length) : 0,
    dateRange,
  }
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function PivotLabPage() {
  // auth
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // probe
  const [probeCountry, setProbeCountry] = useState('')
  const [probeKeyword, setProbeKeyword] = useState('')
  const [probeCategory, setProbeCategory] = useState('')
  const [probing, setProbing] = useState(false)
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null)
  const [probeError, setProbeError] = useState('')

  // idea board
  const [ideas, setIdeas] = useState<PivotIdea[]>([])
  const [ideaText, setIdeaText] = useState('')

  // ── Auth ────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])

  // ── Load ideas from localStorage ────────────────────────
  useEffect(() => {
    try {
      setIdeas(JSON.parse(localStorage.getItem('prism-pivot-ideas') ?? '[]'))
    } catch {
      // ignore
    }
  }, [])

  // ── Probe ───────────────────────────────────────────────
  const handleProbe = useCallback(async () => {
    setProbing(true)
    setProbeError('')
    setProbeResult(null)
    try {
      const params = new URLSearchParams({ lang: 'ko', limit: '200' })
      if (probeCountry) params.set('country', probeCountry)
      if (probeCategory) params.set('category', probeCategory)

      const res = await fetch(`/api/news/latest?${params.toString()}`)
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      let items: NewsItem[] = data.items ?? []

      if (probeKeyword) {
        items = items.filter((a) => a.keywords?.includes(probeKeyword))
      }

      setProbeResult(analyzeItems(items, probeCategory))
    } catch (err) {
      setProbeError(`Probe 실패: ${err}`)
    } finally {
      setProbing(false)
    }
  }, [probeCountry, probeKeyword, probeCategory])

  // ── Idea save ───────────────────────────────────────────
  const saveIdea = useCallback(() => {
    const text = ideaText.trim()
    if (!text) return
    const next: PivotIdea[] = [{ text, ts: Date.now() }, ...ideas]
    setIdeas(next)
    localStorage.setItem('prism-pivot-ideas', JSON.stringify(next))
    setIdeaText('')
  }, [ideaText, ideas])

  const deleteIdea = useCallback(
    (ts: number) => {
      const next = ideas.filter((i) => i.ts !== ts)
      setIdeas(next)
      localStorage.setItem('prism-pivot-ideas', JSON.stringify(next))
    },
    [ideas],
  )

  // ── Auth gates ──────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-sm text-gray-500">로딩 중…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4 text-white">
        <div className="text-center">
          <h1 className="mb-4 text-xl font-bold">Prism Globe Admin</h1>
          <a href="/api/auth/login" className="text-sm text-blue-400 hover:text-blue-300">
            Sign in
          </a>
        </div>
      </div>
    )
  }

  if (!user.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4 text-white">
        <div className="text-center">
          <h1 className="mb-4 text-xl font-bold">Access Denied</h1>
          <p className="mb-2 text-sm text-gray-400">{user.email}</p>
          <a href="/admin" className="text-sm text-blue-400 hover:text-blue-300">
            Admin으로
          </a>
        </div>
      </div>
    )
  }

  // ── Sentiment bar helpers ────────────────────────────────
  const sentTotal =
    probeResult
      ? probeResult.sentiment.positive + probeResult.sentiment.neutral + probeResult.sentiment.negative
      : 0
  const sentPct = (n: number) => (sentTotal > 0 ? Math.round((n / sentTotal) * 100) : 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-5xl p-4 sm:p-8">
        {/* Header */}
        <header className="mb-8">
          <a
            href="/admin"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300"
          >
            ← Admin
          </a>
          <h1 className="text-2xl font-bold">피벗 실험실</h1>
          <p className="mt-1 text-sm text-gray-400">
            prism의 기술 자산을 한눈에 보면서 비즈니스 피벗 아이디어를 탐색·기록하는 도구.
          </p>
        </header>

        {/* ── Section 1: Asset Inventory ── */}
        <section className="mb-10">
          <h2 className="mb-4 text-base font-semibold text-gray-300">자산 인벤토리</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ASSETS.map((asset) => (
              <div
                key={asset.title}
                className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 transition hover:border-gray-700 hover:bg-gray-900"
              >
                <div className="mb-2 text-2xl">{asset.emoji}</div>
                <p className="mb-1 text-sm font-semibold text-gray-100">{asset.title}</p>
                <p className="mb-3 text-[11px] leading-relaxed text-gray-500">{asset.desc}</p>
                <span className="inline-block rounded-md bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                  {asset.stat}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 2: Quick Data Probe ── */}
        <section className="mb-10">
          <h2 className="mb-4 text-base font-semibold text-gray-300">Quick Data Probe</h2>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
            {/* Selectors */}
            <div className="mb-4 flex flex-wrap gap-3">
              {/* Country */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500">국가</label>
                <select
                  value={probeCountry}
                  onChange={(e) => setProbeCountry(e.target.value)}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500"
                >
                  <option value="">전체</option>
                  {allCountries.map(({ code, name }) => (
                    <option key={code} value={code}>
                      {name} ({code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Keyword */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500">키워드</label>
                <select
                  value={probeKeyword}
                  onChange={(e) => setProbeKeyword(e.target.value)}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500"
                >
                  <option value="">전체</option>
                  {POPULAR_KEYWORDS.map(({ slug, label }) => (
                    <option key={slug} value={slug}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500">카테고리</label>
                <select
                  value={probeCategory}
                  onChange={(e) => setProbeCategory(e.target.value)}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500"
                >
                  <option value="">전체</option>
                  {CATEGORY_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {CATEGORY_META[key].ko} ({key})
                    </option>
                  ))}
                </select>
              </div>

              {/* Probe button */}
              <div className="flex items-end">
                <button
                  onClick={handleProbe}
                  disabled={probing}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-50"
                >
                  {probing ? '조회 중…' : 'Probe'}
                </button>
              </div>
            </div>

            {/* Error */}
            {probeError && <p className="mb-3 text-xs text-red-400">{probeError}</p>}

            {/* Results */}
            {probeResult && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Article count */}
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <p className="mb-1 text-[11px] text-gray-500">기사 수</p>
                  <p className="text-2xl font-bold">{probeResult.total.toLocaleString()}</p>
                </div>

                {/* Avg detail length */}
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <p className="mb-1 text-[11px] text-gray-500">평균 detail 길이</p>
                  <p className="text-2xl font-bold">
                    {probeResult.avgDetailLen.toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-gray-500">chars</span>
                  </p>
                </div>

                {/* Date range */}
                {probeResult.dateRange && (
                  <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                    <p className="mb-1 text-[11px] text-gray-500">기사 기간</p>
                    <p className="text-xs text-gray-300">
                      {probeResult.dateRange.oldest}
                      <br />
                      <span className="text-gray-500">~</span>
                      <br />
                      {probeResult.dateRange.newest}
                    </p>
                  </div>
                )}

                {/* Top sources */}
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <p className="mb-2 text-[11px] text-gray-500">매체 Top 5</p>
                  <div className="space-y-1">
                    {probeResult.topSources.map(({ source, count }) => (
                      <div key={source} className="flex items-center justify-between text-xs">
                        <span className="truncate text-gray-300">{source}</span>
                        <span className="ml-2 shrink-0 text-gray-500">{count}</span>
                      </div>
                    ))}
                    {probeResult.topSources.length === 0 && (
                      <p className="text-xs text-gray-600">데이터 없음</p>
                    )}
                  </div>
                </div>

                {/* Sentiment */}
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                  <p className="mb-2 text-[11px] text-gray-500">Sentiment 분포</p>
                  <div className="mb-2 flex h-3 overflow-hidden rounded-full">
                    <div
                      className="bg-green-500"
                      style={{ width: `${sentPct(probeResult.sentiment.positive)}%` }}
                    />
                    <div
                      className="bg-gray-600"
                      style={{ width: `${sentPct(probeResult.sentiment.neutral)}%` }}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${sentPct(probeResult.sentiment.negative)}%` }}
                    />
                  </div>
                  <div className="flex gap-3 text-[11px]">
                    <span className="text-green-400">
                      긍정 {sentPct(probeResult.sentiment.positive)}%
                    </span>
                    <span className="text-gray-400">
                      중립 {sentPct(probeResult.sentiment.neutral)}%
                    </span>
                    <span className="text-red-400">
                      부정 {sentPct(probeResult.sentiment.negative)}%
                    </span>
                  </div>
                </div>

                {/* Category distribution — only when category not filtered */}
                {probeResult.categoryDist.length > 0 && (
                  <div className="rounded-lg border border-gray-800 bg-gray-950 p-4 sm:col-span-2">
                    <p className="mb-2 text-[11px] text-gray-500">카테고리 분포</p>
                    <div className="flex flex-wrap gap-2">
                      {probeResult.categoryDist.map(({ category, count }) => (
                        <div
                          key={category}
                          className="flex items-center gap-1 rounded-md bg-gray-800 px-2 py-1 text-[11px]"
                        >
                          <span className="text-gray-300">
                            {CATEGORY_META[category as keyof typeof CATEGORY_META]?.ko ?? category}
                          </span>
                          <span className="text-gray-500">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Section 3: Pivot Idea Board ── */}
        <section>
          <h2 className="mb-4 text-base font-semibold text-gray-300">
            피벗 아이디어 보드
            <span className="ml-2 text-[11px] font-normal text-gray-600">
              (localStorage — 이 기기에만 저장)
            </span>
          </h2>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
            {/* Input */}
            <div className="mb-4">
              <textarea
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    saveIdea()
                  }
                }}
                rows={4}
                placeholder="기술 스펙을 보면서 떠오른 피벗 아이디어를 적어두세요"
                className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] text-gray-600">Cmd+Enter 또는 Ctrl+Enter로 저장</p>
                <button
                  onClick={saveIdea}
                  disabled={!ideaText.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  저장
                </button>
              </div>
            </div>

            {/* Idea list */}
            {ideas.length === 0 ? (
              <p className="text-xs text-gray-600">저장된 아이디어가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {ideas.map((idea) => (
                  <div
                    key={idea.ts}
                    className="rounded-lg border border-gray-800 bg-gray-950 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">{timeAgo(idea.ts)}</span>
                      <button
                        onClick={() => deleteIdea(idea.ts)}
                        className="text-[11px] text-gray-600 transition hover:text-red-400"
                      >
                        삭제
                      </button>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-gray-200">
                      {idea.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
