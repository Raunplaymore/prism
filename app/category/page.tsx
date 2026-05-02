import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import {
  CATEGORY_KEYS,
  CATEGORY_META,
  slugForCategory,
  type CategoryKey,
} from '@/lib/categories'
import { getCategoryCounts } from '@/lib/categories/counts'

export const runtime = 'edge'
export const revalidate = 300

export const metadata: Metadata = {
  title: '카테고리 — 세계 뉴스 9개 분류 — Prism',
  description:
    'Prism이 매일 50여 개국에서 수집한 기사를 정치·경제·사회·기술·국방·외교·환경·건강·문화 9개 분류로 정리합니다. 같은 주제를 여러 국가가 어떻게 다루는지 비교하세요.',
  alternates: { canonical: '/category' },
  robots: { index: true, follow: true },
  openGraph: {
    title: '카테고리 — 세계 뉴스 9개 분류 — Prism',
    description:
      'Prism이 매일 50여 개국에서 수집한 기사를 9개 분류로 정리. 같은 주제를 여러 국가가 어떻게 다루는지 한눈에 비교.',
    type: 'website',
    locale: 'ko_KR',
  },
}

export default async function CategoryIndexPage() {
  let counts: Record<CategoryKey, number>
  try {
    counts = await getCategoryCounts()
  } catch {
    // empty cloud / Redis unavailable — render zeros so the page still ships.
    counts = {} as Record<CategoryKey, number>
    for (const key of CATEGORY_KEYS) counts[key] = 0
  }

  const totalArticleHits = CATEGORY_KEYS.reduce((sum, key) => sum + counts[key], 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">카테고리로 보는 세계 뉴스</h1>
          <p className="mt-1 text-sm text-gray-500">
            지금 살아있는 기사 {totalArticleHits}건을 9개 분류로 둘러보세요
          </p>
          <details className="group mt-2 max-w-2xl">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-gray-500 transition hover:text-gray-300">
              <span>카테고리 분류 방식 안내</span>
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
            <p className="mt-2 text-sm leading-relaxed text-gray-300">
              Prism은 매일 50여 개국 현지 언론에서 수집한 기사를
              정치·경제·사회·기술·국방·외교·환경·건강·문화 9개 분류로 정리합니다.
              한 카테고리를 누르면 같은 주제를 여러 국가가 어떻게 다루는지
              한눈에 비교할 수 있습니다.
            </p>
          </details>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORY_KEYS.map((key) => {
            const meta = CATEGORY_META[key]
            const count = counts[key] ?? 0
            return (
              <a
                key={key}
                href={`/category/${slugForCategory(key)}`}
                className="group rounded-xl border border-gray-800 p-4 transition hover:border-gray-700"
                style={{ backgroundColor: `${meta.color}15` }}
              >
                <div
                  className="text-xl font-semibold"
                  style={{ color: meta.color }}
                >
                  {meta.ko}
                </div>
                <div className="mt-0.5 text-xs uppercase tracking-wide text-gray-500">
                  {meta.en}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {count}건
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
