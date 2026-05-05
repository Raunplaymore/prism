'use client'

import { useEffect, useRef, useState } from 'react'
import type { NewsItem } from '@/types/news'
import { getCountryName, getCountryNameKo, countryFlag } from '@/lib/countries'
import { CATEGORY_META, isValidCategory } from '@/lib/categories'
import { findEntry } from '@/lib/keywords/index'

const CARD_W = 1080
const CARD_H = 1350

function ScaledCard({
  refCb,
  children,
}: {
  refCb?: (el: HTMLDivElement | null) => void
  children: React.ReactNode
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      setScale(w / CARD_W)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ aspectRatio: '4 / 5' }}
    >
      <div
        ref={(el) => {
          cardRef.current = el
          refCb?.(el)
        }}
        style={{
          width: CARD_W,
          height: CARD_H,
          transform: scale ? `scale(${scale})` : 'scale(0)',
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Capture a DOM node as a 1080×1350 PNG blob.
 *  Cloudflare Pages edge can't run @vercel/og (Yoga/Resvg WASM doesn't init),
 *  so we render in the browser. html2canvas mis-positioned text vertically
 *  inside flex pills (baseline math drift). html-to-image uses SVG
 *  foreignObject so the browser's own renderer paints the pixels — preview
 *  and PNG are pixel-identical. Dynamic import keeps the admin-only library
 *  out of the public bundle.
 *
 *  The node is already rendered at CARD_W×CARD_H (ScaledCard keeps it fixed)
 *  and only visually scaled via transform. We strip the transform before capture
 *  so html-to-image sees the true 1080×1350 box, then restore it afterwards. */
async function captureCardBlob(node: HTMLElement): Promise<Blob | null> {
  const { toBlob } = await import('html-to-image')
  const prevTransform = node.style.transform
  node.style.transform = 'none'
  try {
    return await toBlob(node, {
      pixelRatio: 1,
      width: CARD_W,
      height: CARD_H,
      cacheBust: true,
      backgroundColor: undefined,
    })
  } finally {
    node.style.transform = prevTransform
  }
}

/** Save 1+ PNG blobs. Mobile-first: prefer Web Share API with files
 *  (iOS Safari/Android Chrome) so users hit the OS share sheet and
 *  pick "Save to Photos" or send to a chat. Fall back to per-blob
 *  <a download> on desktop or when share is blocked/cancelled. */
async function saveBlobs(items: { blob: Blob; filename: string }[]): Promise<void> {
  if (items.length === 0) return

  // Try Web Share API first (mobile)
  if (typeof navigator !== 'undefined' && 'canShare' in navigator && 'share' in navigator) {
    try {
      const files = items.map(
        ({ blob, filename }) => new File([blob], filename, { type: 'image/png' }),
      )
      if (navigator.canShare({ files })) {
        await navigator.share({ files })
        return
      }
    } catch {
      /* user cancelled or share failed — fall through */
    }
  }

  // Fallback: per-blob anchor download
  for (const { blob, filename } of items) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    // 브라우저가 연속 다운로드 차단하지 않도록 짧은 텀
    if (items.length > 1) await new Promise((r) => setTimeout(r, 250))
  }
}

type Status = 'idle' | 'loading' | 'ok' | 'error'

interface User {
  email: string
  name: string
  picture: string
  isAdmin: boolean
}

interface Card {
  jsx: React.ReactNode
  label: string
}

interface Material {
  cards: Card[]
  /** Instagram (carousel) 캡션 — 길이 여유, detail 본문 포함. */
  caption: string
  hashtags: string
  /** Threads용 캡션 — 500자 cap, 링크 + 3개 해시태그 inline. */
  threadsCaption: string
  /** UTM 제거된 raw permalink (IG 캡션용 — bio 링크 사용시). */
  permalink: string
  /** Threads/X 등 inline 링크용. utm_source 분기 가능. */
  threadsLink: string
}

const CATEGORY_KO: Record<string, string> = {
  Politics: '정치',
  Economy: '경제',
  Society: '사회',
  Tech: '기술',
  Defense: '국방',
  Diplomacy: '외교',
  Environment: '환경',
  Health: '건강',
  Culture: '문화',
}

/**
 * Parse `?article=KR-abc` from a full Prism Globe URL or accept the bare id.
 * Tolerates both prism-4gy.pages.dev / prismglobe.com / leading slash.
 */
function parseArticleId(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  // try URL parsing
  try {
    const u = new URL(s)
    const a = u.searchParams.get('article')
    if (a) return a
  } catch { /* not a URL */ }
  // bare id form: "KR-xxxx"
  if (/^[A-Za-z]{2}-[A-Za-z0-9]+$/.test(s)) return s.toUpperCase().split('-')[0] + '-' + s.split('-').slice(1).join('-')
  return null
}

/** 단어 경계를 보존하는 길이 제한. */
function trim(s: string, max: number): string {
  if (!s) return ''
  if (s.length <= max) return s
  return s.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

/** detail에서 첫 한 문장만 추출 — 카드 보조 라인용. */
function firstSentence(s: string): string {
  if (!s) return ''
  const m = s.match(/^[\s\S]+?[.!?。！？](?=\s|$)/)
  return m ? m[0].trim() : s
}

function buildMaterial(item: NewsItem): Material {
  const country = item.country.toUpperCase()
  const flag = countryFlag(country)
  const koCountry = getCountryNameKo(country)
  const enCountry = getCountryName(country)
  const cat = item.category && isValidCategory(item.category) ? item.category : null
  const catKo = cat ? CATEGORY_META[cat].ko : item.category
  const catColor = cat ? CATEGORY_META[cat].color : '#6b7280'

  const hasDetail = Boolean(item.detail) && item.detail.trim() !== item.summary.trim()

  // Caption: 제목 → 요약 → (detail 본문) → 출처 → prism 링크 → 해시태그.
  const captionLines: string[] = [
    `${flag} ${koCountry} · ${catKo}`,
    '',
    item.title,
    '',
    item.summary,
  ]
  if (hasDetail) {
    captionLines.push('', trim(item.detail, 800))
  }
  captionLines.push('', `🔗 출처: ${item.source}`, '👉 prismglobe.com')
  const caption = captionLines.join('\n')

  // Hashtags: #prism + #세계뉴스 + #{국가}뉴스 + #{카테고리} + keywords (Korean labels).
  const tags = new Set<string>()
  tags.add('#PrismGlobe')
  tags.add('#세계뉴스')
  tags.add(`#${koCountry}뉴스`)
  tags.add(`#${enCountry.replace(/\s+/g, '')}News`)
  if (catKo) tags.add(`#${catKo}`)
  if (item.keywords) {
    for (const slug of item.keywords) {
      const entry = findEntry(slug)
      if (entry) {
        const label = entry.labelKo || entry.label
        tags.add(`#${label.replace(/\s+/g, '')}`)
      }
    }
  }
  // 12개 max.
  const hashtags = Array.from(tags).slice(0, 12).join(' ')

  // Threads용 짧은 해시태그 (3개) — 500자 캡 안에서 핵심만.
  const tagPriority = [
    '#PrismGlobe',
    `#${koCountry}뉴스`,
    catKo ? `#${catKo}` : null,
  ].filter((t): t is string => Boolean(t))
  const threadsTags = tagPriority.slice(0, 3).join(' ')

  // GA4에서 referral 분리하기 위한 utm_source 분기.
  const permalink = `https://prismglobe.com/map?country=${country}&article=${item.id}`
  const threadsLink = `${permalink}&utm_source=threads&utm_medium=social`

  // Threads 포스트 — 텍스트 first, 링크 직접 노출. 500자 한도.
  // 형식: 헤더 / 제목 / summary / CTA 한줄 / 링크 / 해시태그
  const titleForThreads = trim(item.title, 100)
  const summaryForThreads = trim(item.summary, 180)
  const threadsCore = [
    `${flag} ${koCountry} · ${catKo}`,
    '',
    titleForThreads,
    '',
    summaryForThreads,
    '',
    '📊 다른 나라들은 어떻게 보도했을까?',
    threadsLink,
    '',
    threadsTags,
  ].join('\n')
  // 안전 cap: 500자 넘으면 summary 줄여서 재구성.
  const threadsCaption =
    threadsCore.length <= 500
      ? threadsCore
      : [
          `${flag} ${koCountry} · ${catKo}`,
          '',
          titleForThreads,
          '',
          trim(item.summary, 100),
          '',
          threadsLink,
          '',
          threadsTags,
        ].join('\n')

  // 3장 carousel — 1080×1080 기준 비율. 각 카드 독립 PNG export 가능한 구조.
  const cardClass =
    'relative h-full w-full overflow-hidden rounded-xl border border-gray-800 shadow-2xl'

  const headerBrand = (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Prism Globe" className="h-10 w-10 rounded-md" />
      <span className="text-2xl font-bold text-white">Prism Globe</span>
    </div>
  )

  // Card 1 — Hook: 시선 끌기 (국가flag 큼지막 + 큰 제목)
  const card1 = (
    <div
      className={cardClass}
      style={{
        background: `linear-gradient(135deg, #050505 0%, #0a0a0a 40%, ${catColor}55 100%)`,
      }}
    >
      <div className="flex items-center px-12 pt-7">
        {headerBrand}
      </div>
      <div
        className="flex flex-col justify-center gap-10 px-12 py-14"
        style={{ minHeight: 'calc(100% - 180px)' }}
      >
        <span className="text-8xl leading-none">{flag}</span>
        <span
          className="inline-flex h-12 w-fit items-center justify-center rounded-full px-5 text-lg font-semibold uppercase leading-none tracking-wider"
          style={{ backgroundColor: `${catColor}30`, color: catColor }}
        >
          {koCountry} · {catKo}
        </span>
        <h2 className="text-7xl font-bold leading-tight text-white">
          {trim(item.title, 80)}
        </h2>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end border-t border-white/10 bg-black/40 px-12 py-5">
        <span className="text-xl font-medium leading-none text-gray-400">▶ Swipe</span>
      </div>
    </div>
  )
  // detail 문단 분리 (LLM이 \n\n 구분자로 생성한 3개 문단)
  const paragraphs = (item.detail || '').split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const p1 = paragraphs[0] || ''
  const p2 = paragraphs[1] || ''
  const p3 = paragraphs[2] || ''

  // 본문 카드 헬퍼 — 배경/현재/전망 공통 패턴
  const bodyCard = (theme: string, paragraph: string, gradient: string, footerLabel: string) => (
    <div className={cardClass} style={{ background: gradient }}>
      {/* 1) 헤더 brand */}
      <div className="flex items-center px-12 pt-7">
        {headerBrand}
      </div>

      {/* 2) 컨텍스트 미니바 — 헤더 바로 아래 별도 row */}
      <div className="mt-7 flex items-center gap-2 border-b border-white/10 px-12 pb-6">
        <span className="text-3xl leading-none">{flag}</span>
        <span
          className="text-lg font-semibold uppercase tracking-wider"
          style={{ color: catColor }}
        >
          {koCountry} · {catKo}
        </span>
        <span className="ml-auto truncate text-lg text-gray-400">{trim(item.title, 40)}</span>
      </div>

      {/* 3) 가운데 영역: chapter + paragraph (justify-center로 카드 가운데 정렬) */}
      <div
        className="flex flex-col justify-center gap-10 px-12 py-14"
        style={{ minHeight: 'calc(100% - 280px)' }}
      >
        <div>
          <p className="mb-4 text-xl font-semibold uppercase tracking-[0.25em] text-gray-500">
            {String(theme === '배경' ? '01' : theme === '현재' ? '02' : '03')} · CHAPTER
          </p>
          <h2
            className="text-8xl font-bold leading-tight"
            style={{ color: catColor }}
          >
            {theme}
          </h2>
        </div>
        <p className="whitespace-pre-line text-[42px] leading-[1.55] text-gray-100">
          {paragraph}
        </p>
      </div>

      {/* 4) footer (absolute) */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end border-t border-white/10 bg-black/40 px-12 py-5">
        <span className="text-xl font-medium leading-none text-gray-400">{footerLabel}</span>
      </div>
    </div>
  )

  // Card 5 — CTA: 브랜드 메시지 + 출처 + 링크
  const card5_cta = (
    <div
      className={cardClass}
      style={{
        background: `linear-gradient(135deg, ${catColor}30 0%, #0a0a0a 50%, #050505 100%)`,
      }}
    >
      <div className="flex items-center px-12 pt-7">
        {headerBrand}
      </div>
      <div
        className="flex flex-col justify-center gap-10 px-12 py-14"
        style={{ minHeight: 'calc(100% - 180px)' }}
      >
        <h3 className="text-7xl font-bold leading-tight text-white">
          85개국,
          <br />
          같은 사건을
          <br />
          <span style={{ color: catColor }}>다르게 본다</span>
        </h3>
        <p className="text-3xl leading-relaxed text-gray-300">
          한 나라의 시선만으로는 보이지 않던 흐름.
          <br />
          Prism Globe에서 다국가 뉴스를 한 화면으로.
        </p>
        <div className="rounded-lg border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-lg font-semibold uppercase tracking-[0.2em] text-gray-500">출처</p>
          <p className="mt-1 text-3xl font-medium text-white">{item.source}</p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center border-t border-white/10 bg-black/50 px-12 py-5">
        <span className="text-xl font-medium leading-none text-gray-400">prismglobe.com</span>
      </div>
    </div>
  )

  const cards: Card[] = [{ jsx: card1, label: '1. Hook' }]
  if (p1) cards.push({ jsx: bodyCard('배경', p1, 'linear-gradient(135deg, #050505 0%, #1a1a1a 100%)', '▶ Swipe'), label: '2. 배경' })
  if (p2) cards.push({ jsx: bodyCard('현재', p2, `linear-gradient(135deg, #0a0a0a 0%, #161616 50%, ${catColor}22 100%)`, '▶ Swipe'), label: '3. 현재' })
  if (p3) cards.push({ jsx: bodyCard('전망', p3, `linear-gradient(135deg, #050505 0%, #0f0f0f 50%, ${catColor}33 100%)`, '▶ 자세히'), label: '4. 전망' })
  cards.push({ jsx: card5_cta, label: `${cards.length + 1}. CTA` })

  return { cards, caption, hashtags, threadsCaption, permalink, threadsLink }
}

export default function InstagramAdmin() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [material, setMaterial] = useState<Material | null>(null)
  const [articleId, setArticleId] = useState<string | null>(null)
  const [copied, setCopied] = useState<'caption' | 'hashtags' | 'all' | 'threads' | 'permalink' | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const threadsCardRef = useRef<HTMLDivElement | null>(null)
  const igCardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setAuthLoading(false))
  }, [])

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-950 text-sm text-gray-500">로딩 중…</div>
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4 text-white">
        <div className="text-center">
          <h1 className="mb-3 text-xl font-bold">로그인이 필요합니다</h1>
          <a href="/signin" className="text-sm text-blue-400 hover:text-blue-300">
            Sign in →
          </a>
        </div>
      </div>
    )
  }

  if (!user.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4 text-white">
        <div className="text-center">
          <h1 className="mb-3 text-xl font-bold">Access Denied</h1>
          <p className="mb-2 text-sm text-gray-400">{user.email} is not an admin account.</p>
          <a href="/" className="text-sm text-blue-400 hover:text-blue-300">Back home</a>
        </div>
      </div>
    )
  }

  const handleLoad = async () => {
    const id = parseArticleId(input)
    if (!id) {
      setStatus('error')
      setErrorMsg('article id 또는 URL 형식이 아닙니다 (예: KR-abc123 또는 ?article=KR-abc123 포함 URL)')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/admin/article?id=${encodeURIComponent(id)}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStatus('error')
        setErrorMsg(data.error || `HTTP ${res.status}`)
        return
      }
      const data = (await res.json()) as { item: NewsItem }
      setMaterial(buildMaterial(data.item))
      setArticleId(data.item.id)
      setStatus('ok')
    } catch (e) {
      setStatus('error')
      setErrorMsg(String(e))
    }
  }

  const copy = async (kind: 'caption' | 'hashtags' | 'all' | 'threads' | 'permalink') => {
    if (!material) return
    let text = ''
    if (kind === 'caption') text = material.caption
    else if (kind === 'hashtags') text = material.hashtags
    else if (kind === 'threads') text = material.threadsCaption
    else if (kind === 'permalink') text = material.permalink
    else text = `${material.caption}\n\n${material.hashtags}\n\n${material.permalink}`
    await navigator.clipboard.writeText(text)
    setCopied(kind)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <header className="mb-6">
          <a
            href="/admin"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-300"
          >
            ← Admin
          </a>
          <h1 className="text-2xl font-bold">소셜 콘텐츠 워크플로우</h1>
          <p className="mt-1 text-sm text-gray-400">
            Threads + Instagram 동시 운영. article URL이나 id를 붙여넣으면 두 채널용 재료가 자동 생성됩니다.
            n8n 자동화는 <code>/api/admin/article</code>로 동일 데이터 fetch 가능.
          </p>
        </header>

        <div className="mb-6">
          <label className="mb-2 block text-xs font-medium text-gray-500">
            Article URL 또는 ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLoad()
              }}
              placeholder="https://prismglobe.com/map?country=KR&article=KR-abc123 또는 KR-abc123"
              className="flex-1 rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500"
            />
            <button
              onClick={handleLoad}
              disabled={status === 'loading' || !input.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'loading' ? '로드 중…' : '재료 생성'}
            </button>
          </div>
          {status === 'error' && (
            <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
          )}
        </div>

        {material && status === 'ok' && (
          <div className="space-y-10">
            {/* ===== Threads 섹션 ===== */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-black">
                  Threads
                </span>
                <span className="text-xs text-gray-500">텍스트 + 이미지 1장 / 링크 직접 노출</span>
              </div>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    첨부 이미지 (Hook 카드 1장)
                  </h3>
                  {articleId && (
                    <button
                      type="button"
                      disabled={downloading === 'threads'}
                      onClick={async () => {
                        const node = threadsCardRef.current
                        if (!node) return
                        setDownloading('threads')
                        try {
                          const blob = await captureCardBlob(node)
                          if (blob) await saveBlobs([{ blob, filename: `${articleId}-threads.png` }])
                        } finally {
                          setDownloading(null)
                        }
                      }}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
                    >
                      {downloading === 'threads' ? '저장 중…' : 'PNG 다운로드'}
                    </button>
                  )}
                </div>
                <div className="flex justify-center">
                  <div className="w-[80%] sm:w-[55%]">
                    <ScaledCard refCb={(el) => { threadsCardRef.current = el }}>
                      {material.cards[0].jsx}
                    </ScaledCard>
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-gray-600">
                  1080×1080 PNG · 브라우저 캡처 · GA4에서 utm_source=threads로 분리 측정
                </p>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Threads 본문 ({material.threadsCaption.length}/500자)
                  </h3>
                  <button
                    onClick={() => copy('threads')}
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-500"
                  >
                    {copied === 'threads' ? '✓ 복사됨' : '본문 복사'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap rounded-md border border-gray-800 bg-gray-900 p-3 text-sm text-gray-300">
                  {material.threadsCaption}
                </pre>
                <p className="mt-1.5 text-[11px] text-gray-600">
                  링크에 <code>utm_source=threads</code> 자동 부착 — GA4에서 referral 분리 측정
                </p>
              </section>
            </div>

            {/* ===== Instagram 섹션 ===== */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                <span
                  className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                >
                  Instagram
                </span>
                <span className="text-xs text-gray-500">{material.cards.length}장 carousel + 캡션 (링크 비활성)</span>
              </div>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Carousel 미리보기
                    </h3>
                    <span className="text-[10px] text-gray-600">
                      {material.cards.map((c) => c.label.split('. ')[1]).join(' → ')}
                    </span>
                  </div>
                  {articleId && (
                    <button
                      type="button"
                      disabled={downloading === 'ig-all'}
                      onClick={async () => {
                        if (!articleId) return
                        setDownloading('ig-all')
                        try {
                          const items: { blob: Blob; filename: string }[] = []
                          for (let i = 0; i < material.cards.length; i++) {
                            const node = igCardRefs.current[i]
                            if (!node) continue
                            const blob = await captureCardBlob(node)
                            if (blob) items.push({ blob, filename: `${articleId}-card-${i + 1}.png` })
                          }
                          await saveBlobs(items)
                        } finally {
                          setDownloading(null)
                        }
                      }}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
                    >
                      {downloading === 'ig-all' ? '저장 중…' : `전체 PNG 다운로드 (${material.cards.length}장)`}
                    </button>
                  )}
                </div>
                <div className="flex items-start snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
                  {material.cards.map((c, idx) => {
                    const dlKey = `ig-${idx}`
                    return (
                      <div key={c.label} className="flex w-[85%] shrink-0 snap-center flex-col items-center sm:w-[60%]">
                        <div className="mb-1.5 flex w-full items-center justify-between">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                            {c.label}
                          </span>
                          {articleId && (
                            <button
                              type="button"
                              disabled={downloading === dlKey}
                              onClick={async () => {
                                const node = igCardRefs.current[idx]
                                if (!node) return
                                setDownloading(dlKey)
                                try {
                                  const blob = await captureCardBlob(node)
                                  if (blob) await saveBlobs([{ blob, filename: `${articleId}-card-${idx + 1}.png` }])
                                } finally {
                                  setDownloading(null)
                                }
                              }}
                              className="rounded bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white disabled:cursor-wait disabled:opacity-60"
                            >
                              {downloading === dlKey ? '저장…' : 'PNG ↓'}
                            </button>
                          )}
                        </div>
                        <div className="w-full">
                          <ScaledCard refCb={(el) => { igCardRefs.current[idx] = el }}>
                            {c.jsx}
                          </ScaledCard>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">캡션</h3>
                  <button
                    onClick={() => copy('caption')}
                    className="text-xs text-gray-400 transition hover:text-white"
                  >
                    {copied === 'caption' ? '✓ 복사됨' : '복사'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap rounded-md border border-gray-800 bg-gray-900 p-3 text-sm text-gray-300">
                  {material.caption}
                </pre>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">해시태그</h3>
                  <button
                    onClick={() => copy('hashtags')}
                    className="text-xs text-gray-400 transition hover:text-white"
                  >
                    {copied === 'hashtags' ? '✓ 복사됨' : '복사'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap rounded-md border border-gray-800 bg-gray-900 p-3 text-sm text-gray-300">
                  {material.hashtags}
                </pre>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    링크 (Bio · Stories용)
                  </h3>
                  <button
                    onClick={() => copy('permalink')}
                    className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-500"
                  >
                    {copied === 'permalink' ? '✓ 복사됨' : '링크만 복사'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap rounded-md border border-gray-800 bg-gray-900 p-3 text-xs text-blue-400">
                  {material.permalink}
                </pre>
              </section>

              <div className="flex justify-center">
                <button
                  onClick={() => copy('all')}
                  className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
                >
                  {copied === 'all' ? '✓ 캡션 + 해시태그 + 링크 복사됨' : '전체 복사 (캡션 + 해시태그 + 링크)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
