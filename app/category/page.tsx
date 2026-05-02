import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import NewsCard from '@/components/NewsCard'
import CategorySphere from '@/components/category/CategorySphere'
import SelectNavigator from '@/components/SelectNavigator'
import {
  CATEGORY_KEYS,
  CATEGORY_META,
  slugForCategory,
  type CategoryKey,
} from '@/lib/categories'
import { getCategoryCounts } from '@/lib/categories/counts'
import type { NewsItem } from '@/types/news'

/**
 * Fetch the freshest articles for a single category to render a preview
 * underneath the sphere. Mirrors app/page.tsx and app/category/[name]/page.tsx
 * by hitting the public origin so the same edge fleet that owns the Redis
 * cache serves the request; revalidate=300 dedupes within a render cycle.
 */
async function fetchCategoryPreview(key: CategoryKey): Promise<NewsItem[]> {
  const url = `https://prism-4gy.pages.dev/api/news/latest?lang=ko&category=${key}&limit=8`
  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = (await res.json()) as { items?: NewsItem[] }
    return data.items ?? []
  } catch {
    return []
  }
}

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
    images: ['/og-image.png'],
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

  const items = CATEGORY_KEYS.map((key) => ({
    slug: slugForCategory(key),
    ko: CATEGORY_META[key].ko,
    color: CATEGORY_META[key].color,
    count: counts[key] ?? 0,
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: 'https://prismglobe.com/' },
          { '@type': 'ListItem', position: 2, name: '카테고리', item: 'https://prismglobe.com/category' },
        ],
      },
      {
        '@type': 'ItemList',
        name: '뉴스 카테고리 9개 분류',
        numberOfItems: items.length,
        itemListElement: items.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `https://prismglobe.com/category/${it.slug}`,
          name: it.ko,
        })),
      },
    ],
  }

  // Top category preview: pick the busiest category, surface its latest
  // articles below the sphere. counts initializes every key to 0, so we
  // guard against the all-zero (empty cloud) case by checking the max.
  const topCategory: CategoryKey | null = CATEGORY_KEYS.reduce<CategoryKey | null>(
    (max, key) => {
      if ((counts[key] ?? 0) <= 0) return max
      if (max === null) return key
      return (counts[key] ?? 0) > (counts[max] ?? 0) ? key : max
    },
    null,
  )
  const topCategoryArticles = topCategory
    ? await fetchCategoryPreview(topCategory)
    : []

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">카테고리로 보는 세계 뉴스</h1>
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

        <div className="relative mb-3 flex h-[190px] items-center justify-center overflow-hidden rounded-2xl border border-gray-900 bg-gradient-to-b from-gray-950 to-gray-900/40 text-sm font-semibold sm:h-[350px] sm:text-lg lg:h-[400px] lg:text-xl">
          <CategorySphere items={items} />
          <p className="pointer-events-none absolute bottom-3 right-4 text-xs text-gray-600">
            클릭해서 들어가기
          </p>
        </div>
        <SelectNavigator
          routePrefix="/category"
          placeholder="카테고리 직접 선택"
          options={items.map((it) => ({
            value: it.slug,
            label: `${it.ko} (${it.count}건)`,
          }))}
        />

        {topCategory && topCategoryArticles.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-white">
                지금 가장 활발한 분류:{' '}
                <span style={{ color: CATEGORY_META[topCategory].color }}>
                  {CATEGORY_META[topCategory].ko}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({counts[topCategory]}건)
                </span>
              </h2>
              <a
                href={`/category/${slugForCategory(topCategory)}`}
                className="text-xs text-gray-500 transition hover:text-gray-300"
              >
                카테고리 상세 →
              </a>
            </div>
            <div className="space-y-3">
              {topCategoryArticles.slice(0, 8).map((item) => (
                <NewsCard key={item.id} item={item} showCountry />
              ))}
            </div>
            <a
              href={`/category/${slugForCategory(topCategory)}`}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 text-base font-semibold transition hover:opacity-80"
              style={{
                borderColor: CATEGORY_META[topCategory].color,
                color: CATEGORY_META[topCategory].color,
              }}
            >
              {CATEGORY_META[topCategory].ko} 카테고리 상세
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </section>
        )}
      </div>
    </div>
  )
}
