import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav'
import NewsCard from '@/components/NewsCard'
import CategorySynthesis from '@/components/category/CategorySynthesis'
import type { NewsItem } from '@/types/news'
import { CATEGORY_META, categoryFromSlug, type CategoryKey } from '@/lib/categories'
import { getCountryNameKo, countryFlag, normalizeCountryParam } from '@/lib/countries'
import { groupByCountry } from '@/lib/news/groupByCountry'

export const runtime = 'edge'
export const revalidate = 300

interface PageProps {
  params: { name: string }
  searchParams?: { country?: string }
}

/**
 * Fetch articles for the given category (and optional single country).
 *
 * Both generateMetadata() and the page itself call this with the same args;
 * Next.js fetch dedupe + revalidate=300 ensures only one network round trip
 * per render cycle. Crossing the public origin matches app/page.tsx so the
 * route handler runs on the same edge fleet that owns the Redis cache.
 */
async function fetchCategoryArticles(
  categoryKey: CategoryKey,
  country: string | null,
): Promise<NewsItem[]> {
  const params = new URLSearchParams()
  params.set('lang', 'ko')
  params.set('category', categoryKey)
  params.set('limit', '200')
  if (country) params.set('country', country)
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
  searchParams,
}: PageProps): Promise<Metadata> {
  const categoryKey = categoryFromSlug(params.name)
  if (!categoryKey) {
    return { title: 'Not Found', robots: { index: false, follow: false } }
  }
  const meta = CATEGORY_META[categoryKey]
  const country = normalizeCountryParam(searchParams?.country)

  const articles = await fetchCategoryArticles(categoryKey, country)
  const countryCount = new Set(articles.map((a) => a.country)).size

  return {
    title: `${meta.ko} 뉴스 — 다국가 시각 비교 — Prism`,
    description:
      articles.length > 0
        ? `Prism이 ${countryCount}개국에서 수집한 ${meta.ko} 분야 기사 ${articles.length}건. 국가별 보도 차이를 한국어로 비교합니다.`
        : `${meta.ko} 분야 기사를 다국가 시각으로 비교하는 Prism 카테고리 페이지`,
    alternates: { canonical: `/category/${params.name}` },
    robots:
      articles.length === 0
        ? { index: false, follow: true }
        : { index: true, follow: true },
    openGraph: {
      title: `${meta.ko} 뉴스 — 다국가 시각 비교 — Prism`,
      description:
        articles.length > 0
          ? `${countryCount}개국 ${meta.ko} 분야 기사 ${articles.length}건의 다국가 보도 분석`
          : `${meta.ko} 분야 다국가 보도 분석`,
      type: 'website',
      locale: 'ko_KR',
      images: ['/og-image.png'],
    },
  }
}

export default async function CategoryHubPage({
  params,
  searchParams,
}: PageProps) {
  const categoryKey = categoryFromSlug(params.name)
  if (!categoryKey) notFound()

  const meta = CATEGORY_META[categoryKey]
  const country = normalizeCountryParam(searchParams?.country)

  // Always fetch the full category set so the country chip row stays stable
  // as the user toggles between countries. Filter client-side for the list.
  const allArticles = await fetchCategoryArticles(categoryKey, null)
  const articles = country
    ? allArticles.filter((a) => a.country.toUpperCase() === country)
    : allArticles
  const allGroups = groupByCountry(allArticles)
  const countryCount = allGroups.length

  // CollectionPage + BreadcrumbList JSON-LD. @graph로 두 type을 묶어 SERP에서
  // collection rich result + breadcrumb 모두 노출 가능하도록.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: 'https://prismglobe.com/' },
          { '@type': 'ListItem', position: 2, name: '카테고리', item: 'https://prismglobe.com/category' },
          { '@type': 'ListItem', position: 3, name: meta.ko, item: `https://prismglobe.com/category/${params.name}` },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${meta.ko} 뉴스 — Prism`,
        description:
          articles.length > 0
            ? `Prism이 ${countryCount}개국에서 수집한 ${meta.ko} 분야 기사 ${articles.length}건의 다국가 보도 분석`
            : `${meta.ko} 분야 다국가 보도 분석`,
        inLanguage: 'ko',
        isPartOf: {
          '@type': 'WebSite',
          name: 'Prism',
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
          contentLocation: { '@type': 'Country', name: getCountryNameKo(a.country) },
        })),
      },
    ],
  }

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
            href="/category"
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
            모든 카테고리
          </a>
          <p className="text-sm uppercase tracking-wide text-gray-500">
            {meta.en}
          </p>
          <h1
            className="mt-1 text-3xl font-bold"
            style={{ color: meta.color }}
          >
            {meta.ko} 뉴스
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {articles.length}건 · {countryCount}개 국가 · 다국가 시각 비교
          </p>
        </header>

        {(allGroups.length > 0 || country) && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            <a
              href={`/category/${params.name}`}
              className={
                !country
                  ? 'inline-flex items-baseline gap-1 rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs text-white'
                  : 'inline-flex items-baseline gap-1 rounded-full border border-gray-800 bg-gray-900 px-2.5 py-0.5 text-xs text-gray-400 transition hover:border-gray-700 hover:text-gray-200'
              }
            >
              전체
            </a>
            {allGroups.map(([code, items]) => {
              const active = country === code
              return (
                <a
                  key={code}
                  href={`/category/${params.name}?country=${code}`}
                  className={
                    active
                      ? 'inline-flex items-baseline gap-1 rounded-full border border-gray-700 bg-gray-800 px-2.5 py-0.5 text-xs text-white'
                      : 'inline-flex items-baseline gap-1 rounded-full border border-gray-800 bg-gray-900 px-2.5 py-0.5 text-xs text-gray-400 transition hover:border-gray-700 hover:text-gray-200'
                  }
                >
                  <span>{countryFlag(code)}</span>
                  <span>{getCountryNameKo(code)}</span>
                  <span className="text-gray-600">({items.length}건)</span>
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
              아직 매칭된 {meta.ko} 기사가 없습니다.
            </p>
            <p className="mt-2 text-xs text-gray-600">
              새 기사가 들어오면 자동으로 표시됩니다.
            </p>
          </div>
        ) : (
          <>
            <CategorySynthesis label={meta.ko} articles={articles} />
            <ul className="space-y-3">
              {articles.map((item) => (
                <li key={item.id}>
                  <NewsCard item={item} showCountry />
                </li>
              ))}
            </ul>
          </>
        )}

        <a
          href="/map"
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
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
          </svg>
          더 많은 국가 뉴스 검색
        </a>
      </div>
    </div>
  )
}
