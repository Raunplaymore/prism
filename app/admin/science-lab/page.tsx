'use client'

import { useState, useEffect } from 'react'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type SourceId = 'arxiv' | 'sciencedaily'

interface User {
  email: string
  name: string
  picture: string
  isAdmin: boolean
}

interface ArxivItem {
  id: string
  title: string
  summary: string
  published: string
  link: string
  authors: string[]
}

interface EducationItem extends ArxivItem {
  koTitle: string
  koTagline: string
  koBody: string
}

// ────────────────────────────────────────────────────────────
// Source + field definitions
// ────────────────────────────────────────────────────────────

const SOURCE_FIELDS: Record<SourceId, { id: string; emoji: string; label: string }[]> = {
  arxiv: [
    { id: 'astro-ph',      emoji: '🚀', label: '천체물리·우주' },
    { id: 'q-bio',         emoji: '🧬', label: '생명공학·생물' },
    { id: 'quant-ph',      emoji: '⚛️', label: '양자물리·양자정보' },
    { id: 'cs.AI',         emoji: '🤖', label: 'AI·머신러닝' },
    { id: 'cs.LG',         emoji: '📚', label: '머신러닝 이론' },
    { id: 'cs.CL',         emoji: '💬', label: '자연어처리·LLM' },
    { id: 'cond-mat',      emoji: '🧪', label: '응집물질·재료' },
    { id: 'physics.ao-ph', emoji: '🌍', label: '지구·대기과학' },
    { id: 'q-bio.NC',      emoji: '🧠', label: '신경과학' },
    { id: 'stat.ML',       emoji: '📊', label: '통계·머신러닝' },
    { id: 'math.PR',       emoji: '🔢', label: '확률·수학' },
    { id: 'cs.RO',         emoji: '🦾', label: '로보틱스' },
  ],
  sciencedaily: [
    { id: 'all',             emoji: '🌐', label: '전체' },
    { id: 'space_time',      emoji: '🚀', label: '우주·시간' },
    { id: 'matter_energy',   emoji: '⚛️', label: '물질·에너지' },
    { id: 'computers_math',  emoji: '🤖', label: '컴퓨터·수학' },
    { id: 'health_medicine', emoji: '💊', label: '건강·의학' },
    { id: 'mind_brain',      emoji: '🧠', label: '뇌·심리' },
    { id: 'plants_animals',  emoji: '🌱', label: '식물·동물' },
    { id: 'earth_climate',   emoji: '🌍', label: '지구·기후' },
    { id: 'fossils_ruins',   emoji: '🦴', label: '화석·고고학' },
    { id: 'strange_offbeat', emoji: '🎭', label: '특이·유머' },
  ],
}

const SOURCE_LABEL: Record<SourceId, string> = {
  arxiv: 'arXiv',
  sciencedaily: 'ScienceDaily',
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '…'
}

function formatDate(raw: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function ScienceLabPage() {
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [source, setSource] = useState<SourceId>('arxiv')
  const [field, setField] = useState<string>(SOURCE_FIELDS.arxiv[0].id)
  const [step1Loading, setStep1Loading] = useState(false)
  const [step2Loading, setStep2Loading] = useState(false)
  const [items, setItems] = useState<ArxivItem[]>([])
  const [edu, setEdu] = useState<EducationItem[]>([])
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState<Record<string, boolean>>({})

  // ── Auth ─────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => {})
      .finally(() => setAuthChecked(true))
  }, [])

  // ── Source change ─────────────────────────────────────────
  const handleSourceChange = (s: SourceId) => {
    setSource(s)
    setField(SOURCE_FIELDS[s][0].id)
    setItems([])
    setEdu([])
    setError('')
  }

  // ── Step 1: RSS fetch ─────────────────────────────────────
  const fetchSource = async () => {
    setStep1Loading(true)
    setError('')
    setEdu([])
    try {
      const res = await fetch(
        `/api/admin/science-lab/run?step=fetch&source=${source}&field=${field}`,
        { method: 'POST' },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'fetch failed')
      setItems(data.items || [])
    } catch (e) {
      setError(String(e))
    } finally {
      setStep1Loading(false)
    }
  }

  // ── Step 2: LLM 한국어 교육 콘텐츠 ─────────────────────
  const generateEducation = async () => {
    if (items.length === 0) return
    setStep2Loading(true)
    setError('')
    try {
      // generate는 LLM 호출(15-25s)이라 prismglobe.com custom domain이 502를
      // 반환함 — admin/page.tsx step=2 호출과 동일한 알려진 문제. pages.dev로
      // 직접 호출. anon quota 적용되지만 LLM 한 번에 abuse 막아주고, admin
      // cookie는 prismglobe.com 도메인 한정이라 .pages.dev에선 anon으로 분류.
      const res = await fetch(
        `https://prism-4gy.pages.dev/api/admin/science-lab/run?step=generate&source=${source}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, field }),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'generate failed')
      setEdu(data.items || [])
    } catch (e) {
      setError(String(e))
    } finally {
      setStep2Loading(false)
    }
  }

  // ── Copy to clipboard ────────────────────────────────────
  const copyEduCard = async (item: EducationItem) => {
    const text = [item.koTitle, item.koTagline, '', item.koBody].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied((prev) => ({ ...prev, [item.id]: true }))
      setTimeout(() => setCopied((prev) => ({ ...prev, [item.id]: false })), 2000)
    } catch {
      // ignore
    }
  }

  // ── Auth gates ───────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-sm text-gray-500">로딩 중...</p>
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

  const activeField = SOURCE_FIELDS[source].find((f) => f.id === field)

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
          <h1 className="text-2xl font-bold">과학 실험실</h1>
          <p className="mt-1 text-sm text-gray-400">
            최신 과학 콘텐츠 → GPT-4o-mini 한국어 교육 콘텐츠 변환. 분야 다양성과 콘텐츠 품질을 검증하는 실험 도구.
          </p>
        </header>

        {/* Source selector */}
        <section className="mb-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">소스 선택</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleSourceChange('arxiv')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                source === 'arxiv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              📄 arXiv (학술 논문)
            </button>
            <button
              onClick={() => handleSourceChange('sciencedaily')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                source === 'sciencedaily'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🌐 ScienceDaily (대중 친화)
            </button>
          </div>
        </section>

        {/* Field selector */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">분야 선택</h2>
          <div className="flex flex-wrap gap-2">
            {SOURCE_FIELDS[source].map((f) => (
              <button
                key={f.id}
                onClick={() => { setField(f.id); setItems([]); setEdu([]); setError('') }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  field === f.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* Action row */}
        <section className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={fetchSource}
            disabled={step1Loading}
            className="rounded-lg bg-gray-700 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-600 disabled:cursor-wait disabled:opacity-50"
          >
            {step1Loading
              ? '가져오는 중...'
              : source === 'arxiv'
                ? `최신 논문 가져오기 (${activeField?.emoji ?? ''} ${activeField?.label ?? field})`
                : `최신 기사 가져오기 (${activeField?.emoji ?? ''} ${activeField?.label ?? field})`}
          </button>
          <button
            onClick={generateEducation}
            disabled={items.length === 0 || step2Loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step2Loading ? '생성 중...' : '한국어 교육 콘텐츠 생성'}
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-900 bg-red-950/50 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Step 1 results: source raw items */}
        {items.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-base font-semibold text-gray-300">
              Step 1 — {SOURCE_LABEL[source]} 원문 ({items.length}건)
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-800 bg-gray-900/50 p-5"
                >
                  <h3 className="mb-1 text-sm font-semibold leading-snug text-gray-100">
                    {item.title}
                  </h3>
                  <p className="mb-2 text-[11px] text-gray-500">
                    {source === 'arxiv' && <>{item.id} &middot; </>}
                    {formatDate(item.published)}
                    {item.authors.length > 0 && (
                      <> &middot; {item.authors.slice(0, 3).join(', ')}{item.authors.length > 3 ? ' 외' : ''}</>
                    )}
                  </p>
                  <p className="mb-3 text-xs leading-relaxed text-gray-400">
                    {truncate(item.summary, 250)}
                  </p>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    원문 보기 →
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Step 2 results: 한국어 교육 콘텐츠 */}
        {edu.length > 0 && (
          <section>
            <h2 className="mb-4 text-base font-semibold text-gray-300">
              Step 2 — 한국어 교육 콘텐츠 ({edu.length}건)
            </h2>
            <div className="space-y-5">
              {edu.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-700 bg-gray-900 p-6"
                >
                  {/* 제목 */}
                  <h2 className="mb-1 text-xl font-bold leading-snug text-white">
                    {item.koTitle || item.title}
                  </h2>

                  {/* 한 줄 핵심 */}
                  {item.koTagline && (
                    <p className="mb-4 text-sm text-gray-400 italic">{item.koTagline}</p>
                  )}

                  {/* 본문 */}
                  {item.koBody && (
                    <p className="mb-5 whitespace-pre-line text-sm leading-relaxed text-gray-200">
                      {item.koBody}
                    </p>
                  )}

                  {/* 푸터 */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-4">
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                      {source === 'arxiv' && (
                        <span className="font-mono">{item.id}</span>
                      )}
                      <span>{formatDate(item.published)}</span>
                      <span className="rounded-md bg-gray-800 px-2 py-0.5 text-gray-400">
                        {activeField?.emoji} {activeField?.label}
                      </span>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        원문 →
                      </a>
                    </div>
                    <button
                      onClick={() => copyEduCard(item)}
                      className="rounded-md bg-gray-800 px-3 py-1.5 text-[11px] font-medium text-gray-300 transition hover:bg-gray-700 hover:text-white"
                    >
                      {copied[item.id] ? '복사됨!' : '복사'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
