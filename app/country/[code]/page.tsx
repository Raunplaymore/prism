import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import NewsCard from '@/components/NewsCard'
import ShareButton from '@/components/ShareButton'
import AdSlot from '@/components/AdSlot'
import type { NewsItem } from '@/types/news'
import { CATEGORY_KEYS, CATEGORY_META, categoryFromSlug, slugForCategory, type CategoryKey } from '@/lib/categories'
import { getCountryName, getCountryNameKo, countryFlag } from '@/lib/countries'
import { isSupported } from '@/lib/rss'

export const runtime = 'edge'
export const revalidate = 300

interface PageProps {
  params: { code: string }
  searchParams?: { category?: string }
}

/**
 * Fetch articles for the given country (and optional category filter).
 *
 * Both generateMetadata() and the page itself call this with the same args;
 * Next.js fetch dedupe + revalidate=300 ensures only one network round trip
 * per render cycle.
 */
async function fetchCountryArticles(
  country: string,
  category: string | null,
): Promise<NewsItem[]> {
  const params = new URLSearchParams()
  params.set('lang', 'ko')
  params.set('country', country)
  params.set('limit', '200')
  if (category) params.set('category', category)
  const url = `https://prism-4gy.pages.dev/api/news/latest?${params.toString()}`

  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = (await res.json()) as { items?: NewsItem[] }
    return data.items ?? []
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const code = params.code.toUpperCase()
  if (!isSupported(code)) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }

  const countryNameKo = getCountryNameKo(code)
  const countryNameEn = getCountryName(code)

  const articles = await fetchCountryArticles(code, null)

  return {
    title: `${countryNameKo} 뉴스 — 다국가 시각의 한국어 정리 — Prism Globe`,
    description:
      articles.length > 0
        ? `Prism Globe이 ${countryNameKo}(${countryNameEn})에서 수집한 최신 기사 ${articles.length}건. 정치·경제·사회 등 분야별로 한국어로 정리합니다.`
        : `${countryNameKo} 뉴스를 한국어로 정리하는 Prism Globe 국가 페이지`,
    alternates: { canonical: `/country/${code}` },
    robots:
      articles.length === 0
        ? { index: false, follow: true }
        : { index: true, follow: true },
    openGraph: {
      title: `${countryNameKo} 뉴스 — 다국가 시각의 한국어 정리 — Prism Globe`,
      description:
        articles.length > 0
          ? `${countryNameKo}(${countryNameEn}) 최신 기사 ${articles.length}건을 한국어로 정리`
          : `${countryNameKo} 뉴스를 한국어로 정리하는 Prism Globe 국가 페이지`,
      type: 'website',
      locale: 'ko_KR',
      images: ['/og-image.png'],
    },
  }
}

export default async function CountryHubPage({
  params,
  searchParams,
}: PageProps) {
  const code = params.code.toUpperCase()
  if (!isSupported(code)) notFound()

  const countryNameKo = getCountryNameKo(code)
  const countryNameEn = getCountryName(code)
  const flag = countryFlag(code)

  // searchParams의 category slug → CategoryKey 변환
  const categoryKey: CategoryKey | null = searchParams?.category
    ? categoryFromSlug(searchParams.category)
    : null

  // 풀 셋 1회 호출 후 클라이언트 사이드 카테고리 필터
  const allArticles = await fetchCountryArticles(code, null)
  const articles = categoryKey
    ? allArticles.filter((a) => a.category === categoryKey)
    : allArticles

  // 카테고리 분포 산출
  const catCounts = new Map<string, number>()
  for (const a of allArticles) {
    if (a.category) catCounts.set(a.category, (catCounts.get(a.category) ?? 0) + 1)
  }

  // JSON-LD — @graph로 BreadcrumbList + CollectionPage 묶음
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: 'https://prismglobe.com/' },
          { '@type': 'ListItem', position: 2, name: '글로벌 지도', item: 'https://prismglobe.com/map' },
          { '@type': 'ListItem', position: 3, name: `${countryNameKo} 뉴스`, item: `https://prismglobe.com/country/${code}` },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${countryNameKo} 뉴스 — Prism Globe`,
        description:
          articles.length > 0
            ? `Prism Globe이 ${countryNameKo}(${countryNameEn})에서 수집한 최신 기사 ${articles.length}건을 한국어로 정리`
            : `${countryNameKo} 뉴스를 한국어로 정리하는 Prism Globe 국가 페이지`,
        inLanguage: 'ko',
        isPartOf: {
          '@type': 'WebSite',
          name: 'Prism Globe',
          url: 'https://prismglobe.com',
        },
        hasPart: articles.slice(0, 20).map((a) => ({
          '@type': 'NewsArticle',
          headline: a.title,
          description: a.summary,
          datePublished: a.pubDate,
          inLanguage: 'ko',
          url: a.url,
          publisher: { '@type': 'Organization', name: a.source },
          contentLocation: { '@type': 'Country', name: countryNameKo },
        })),
      },
    ],
  }

  // 기사 리스트 중간 광고 위치 — 10번째 또는 절반 위치 중 작은 값
  const midAdIndex = Math.min(10, Math.floor(articles.length / 2))

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <header className="mb-6">
          <a
            href="/map"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-300"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            글로벌 지도
          </a>
          <p className="text-sm uppercase tracking-wide text-gray-500">
            {countryNameEn}
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="text-3xl font-bold">
              {flag} {countryNameKo} 뉴스
            </h1>
            <ShareButton title={`${countryNameKo} 뉴스 — Prism Globe`} />
          </div>
          <p className="mt-1 text-sm text-gray-400">
            {articles.length}건 · {catCounts.size}개 분야
          </p>
        </header>

        {/* 헤더 직후 배너 광고 */}
        <div className="my-4">
          <AdSlot slot="country-header" type="banner" />
        </div>

        {/* 카테고리 chip row — allArticles 중 catCounts > 0인 것만 */}
        {catCounts.size > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            <a
              href={`/country/${code}`}
              className={
                !categoryKey
                  ? 'inline-flex items-baseline gap-1 rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs text-white'
                  : 'inline-flex items-baseline gap-1 rounded-full border border-gray-800 bg-gray-900 px-2.5 py-0.5 text-xs text-gray-400 transition hover:border-gray-700 hover:text-gray-200'
              }
            >
              전체
            </a>
            {CATEGORY_KEYS.filter((key) => (catCounts.get(key) ?? 0) > 0).map((key) => {
              const active = categoryKey === key
              const meta = CATEGORY_META[key]
              const count = catCounts.get(key) ?? 0
              return (
                <a
                  key={key}
                  href={`/country/${code}?category=${slugForCategory(key)}`}
                  className={
                    active
                      ? 'inline-flex items-baseline gap-1 rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs text-white'
                      : 'inline-flex items-baseline gap-1 rounded-full border border-gray-800 bg-gray-900 px-2.5 py-0.5 text-xs text-gray-400 transition hover:border-gray-700 hover:text-gray-200'
                  }
                >
                  <span style={active ? { color: meta.color } : undefined}>{meta.ko}</span>
                  <span className="text-gray-600">({count}건)</span>
                </a>
              )
            })}
            <a
              href="/map"
              className="inline-flex items-center gap-1 rounded-full border border-gray-800 bg-gray-900 px-2.5 py-0.5 text-xs text-gray-400 transition hover:border-gray-700 hover:text-gray-200"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
              </svg>
              <span>글로벌</span>
            </a>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-800 px-4 py-10 text-center">
            <p className="text-sm text-gray-500">
              아직 매칭된 {countryNameKo} 기사가 없습니다.
            </p>
            <p className="mt-2 text-xs text-gray-600">
              새 기사가 들어오면 자동으로 표시됩니다.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {articles.map((item, index) => (
              <>
                {index === midAdIndex && midAdIndex > 0 && (
                  <li key={`ad-mid-${index}`}>
                    <div className="my-2">
                      <AdSlot slot="country-list-mid" type="inline" />
                    </div>
                  </li>
                )}
                <li key={item.id}>
                  <NewsCard item={item} showCountry={false} defaultExpanded />
                </li>
              </>
            ))}
          </ul>
        )}

        <a
          href="/category"
          className="mt-10 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-900/40 px-5 py-3 text-base font-semibold text-white transition hover:border-gray-600 hover:bg-gray-900"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          더 많은 카테고리 보기
        </a>
      </div>
    </div>
  )
}
