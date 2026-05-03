'use client'

import { useEffect, useState } from 'react'
import type { NewsItem } from '@/types/news'
import { getCountryName, getCountryNameKo, countryFlag } from '@/lib/countries'
import { CATEGORY_META, isValidCategory } from '@/lib/categories'
import { findEntry } from '@/lib/keywords/index'

type Status = 'idle' | 'loading' | 'ok' | 'error'

interface User {
  email: string
  name: string
  picture: string
  isAdmin: boolean
}

interface Material {
  cardJsx: React.ReactNode
  caption: string
  hashtags: string
  permalink: string
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
 * Parse `?article=KR-abc` from a full prismglobe URL or accept the bare id.
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
  tags.add('#prism')
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

  // 1:1 카드 미리보기 (HTML/CSS, 1080×1080 기준 비율)
  const cardJsx = (
    <div
      className="relative aspect-square w-full max-w-md overflow-hidden rounded-xl border border-gray-800 shadow-2xl"
      style={{
        background: `linear-gradient(135deg, #050505 0%, #1a1a1a 50%, ${catColor}15 100%)`,
      }}
    >
      {/* 상단 brand */}
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Prism" className="h-7 w-7 rounded-md" />
          <span className="text-base font-bold text-white">Prism</span>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: `${catColor}25`, color: catColor }}
        >
          {item.category}
        </span>
      </div>

      {/* 본문 */}
      <div className="flex flex-col justify-center px-6 py-8" style={{ minHeight: 'calc(100% - 130px)' }}>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-2xl">{flag}</span>
          <span className="text-sm font-medium text-gray-400">
            {koCountry} · {catKo}
          </span>
        </div>
        <h2 className="mb-4 text-xl font-bold leading-tight text-white sm:text-2xl">
          {item.title}
        </h2>
        <p className="text-sm leading-relaxed text-gray-300 sm:text-base">{item.summary}</p>
        {hasDetail && (
          <p className="mt-3 text-xs leading-relaxed text-gray-400 sm:text-sm">
            {trim(firstSentence(item.detail), 140)}
          </p>
        )}
      </div>

      {/* 하단 출처 */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/10 bg-black/40 px-6 py-3">
        <span className="text-xs text-gray-400">{item.source}</span>
        <span className="text-xs font-medium text-white">prismglobe.com</span>
      </div>
    </div>
  )

  // 받는 사람이 클릭 시 그 article로 진입하는 deep link.
  const permalink = `https://prismglobe.com/?country=${country}&article=${item.id}`

  return { cardJsx, caption, hashtags, permalink }
}

export default function InstagramAdmin() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [material, setMaterial] = useState<Material | null>(null)
  const [copied, setCopied] = useState<'caption' | 'hashtags' | 'all' | null>(null)

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
      setStatus('ok')
    } catch (e) {
      setStatus('error')
      setErrorMsg(String(e))
    }
  }

  const copy = async (kind: 'caption' | 'hashtags' | 'all') => {
    if (!material) return
    let text = ''
    if (kind === 'caption') text = material.caption
    else if (kind === 'hashtags') text = material.hashtags
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
          <h1 className="text-2xl font-bold">Instagram 콘텐츠 워크플로우</h1>
          <p className="mt-1 text-sm text-gray-400">
            article URL이나 id를 붙여넣으면 카드 미리보기 + 캡션 + 해시태그가 자동 생성됩니다.
            처음엔 수동 업로드, 추후 n8n에서 <code>/api/admin/article</code>로 동일 데이터 fetch 가능.
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
              placeholder="https://prismglobe.com/?country=KR&article=KR-abc123 또는 KR-abc123"
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
          <div className="space-y-6">
            {/* 미리보기 카드 */}
            <section>
              <h2 className="mb-2 text-sm font-medium text-gray-500">미리보기 (1:1)</h2>
              <div className="flex justify-center">{material.cardJsx}</div>
              <p className="mt-2 text-center text-xs text-gray-600">
                현재는 화면 스크린샷으로 사용 — Phase 2에서 PNG 자동 export 예정
              </p>
            </section>

            {/* 캡션 */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-500">캡션</h2>
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

            {/* 해시태그 */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-500">해시태그</h2>
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

            {/* Deep link */}
            <section>
              <h2 className="mb-2 text-sm font-medium text-gray-500">Deep link (받는 사람용)</h2>
              <pre className="whitespace-pre-wrap rounded-md border border-gray-800 bg-gray-900 p-3 text-xs text-blue-400">
                {material.permalink}
              </pre>
            </section>

            {/* 통합 복사 */}
            <div className="flex justify-center">
              <button
                onClick={() => copy('all')}
                className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                {copied === 'all' ? '✓ 캡션 + 해시태그 + 링크 복사됨' : '전체 복사 (캡션 + 해시태그 + 링크)'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
