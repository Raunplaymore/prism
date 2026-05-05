import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { NewsItem } from '@/types/news'
import NewsCard from '@/components/NewsCard'
import Nav from '@/components/Nav'
import KeywordSynthesis from '@/components/keyword/KeywordSynthesis'
import ShareButton from '@/components/ShareButton'
import { findEntry, getArticlesByKeyword } from '@/lib/keywords/index'
import { getCountryNameKo, countryFlag, normalizeCountryParam } from '@/lib/countries'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const CATEGORY_LABEL_KO: Record<string, string> = {
  person: '인물',
  country: '국가·지역',
  org: '조직',
  company: '기업',
  topic: '토픽',
  event: '이벤트',
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams?: { country?: string }
}): Promise<Metadata> {
  const entry = findEntry(decodeURIComponent(params.slug))
  if (!entry) {
    return {
      title: 'Keyword not found — Prism Globe',
      robots: { index: false, follow: false },
    }
  }
  const display = entry.labelKo || entry.label
  const country = normalizeCountryParam(searchParams?.country)
  const allArticles = await getArticlesByKeyword(entry.slug)
  const articles = country
    ? allArticles.filter((a) => a.country.toUpperCase() === country)
    : allArticles
  const countryCount = new Set(allArticles.map((a) => a.country)).size
  const lensSuffix = country ? ` — ${getCountryNameKo(country)} 시각` : ''
  const description =
    articles.length > 0
      ? country
        ? `${getCountryNameKo(country)} 매체가 본 ${display} — Prism Globe이 ${articles.length}건의 보도를 수집했습니다.`
        : `${display} 관련 ${articles.length}건의 기사를 ${countryCount}개국에서 수집했습니다. Prism Globe이 다국가 보도 양상을 종합하여 한국어로 제공합니다.`
      : `${display} 관련 모든 국가의 최신 기사`
  return {
    title: `#${entry.slug} · ${display}${lensSuffix} — Prism Globe`,
    description,
    alternates: { canonical: `/keyword/${encodeURIComponent(entry.slug)}` },
    robots:
      articles.length === 0
        ? { index: false, follow: false }
        : { index: true, follow: true },
    openGraph: {
      title: `#${display}${lensSuffix} — 다국가 보도 종합 — Prism Globe`,
      description,
      type: 'website',
      locale: 'ko_KR',
      images: ['/og-image.png'],
    },
  }
}

export default async function KeywordPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams?: { country?: string }
}) {
  const slug = decodeURIComponent(params.slug)
  const entry = findEntry(slug)
  if (!entry) notFound()

  const allArticles = await getArticlesByKeyword(entry.slug)
  const country = normalizeCountryParam(searchParams?.country)
  const articles = country
    ? allArticles.filter((a) => a.country.toUpperCase() === country)
    : allArticles
  const display = entry.labelKo || entry.label

  // CollectionPage + BreadcrumbList JSON-LD. @graph로 두 type을 묶어 SERP에서
  // collection rich result + breadcrumb 모두 노출 가능하도록.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: 'https://prismglobe.com/' },
          { '@type': 'ListItem', position: 2, name: '키워드', item: 'https://prismglobe.com/keyword' },
          {
            '@type': 'ListItem',
            position: 3,
            name: display,
            item: `https://prismglobe.com/keyword/${encodeURIComponent(entry.slug)}`,
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${display} — Prism Globe`,
        description:
          articles.length > 0
            ? `Prism Globe이 ${display} 관련 ${articles.length}건의 기사를 ${
                new Set(articles.map((a) => a.country)).size
              }개국에서 종합한 다국가 보도 분석입니다.`
            : `${display} 관련 다국가 보도 분석`,
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
          contentLocation: { '@type': 'Country', name: getCountryNameKo(a.country) },
        })),
      },
    ],
  }

  // Country chip filter — derive from the unfiltered article set so the chip
  // row stays stable as the user toggles between countries.
  const allCountryCounts = new Map<string, number>()
  for (const a of allArticles) {
    const code = a.country.toUpperCase()
    allCountryCounts.set(code, (allCountryCounts.get(code) ?? 0) + 1)
  }
  const countryChips = Array.from(allCountryCounts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )
  const countryCount = countryChips.length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <div className="mb-6">
          <a
            href="/keyword"
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
            모든 키워드
          </a>
          <p className="text-sm text-gray-500">#{entry.slug}</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h1 className="text-3xl font-bold">{display}</h1>
            <ShareButton title={`#${display} — Prism Globe`} />
          </div>
          <p className="mt-1 text-sm text-gray-400">
            {articles.length}건 · {countryCount}개 국가
            <span className="ml-2 rounded bg-gray-900 px-1.5 py-0.5 text-xs text-gray-500">
              {CATEGORY_LABEL_KO[entry.category] ?? entry.category}
            </span>
          </p>
        </div>

        {countryChips.length > 0 && (
          <section
            aria-label="Country Lens"
            className="mb-6 rounded-xl border border-gray-800 bg-gray-900/40 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Country Lens
              </h2>
              <span className="text-[11px] text-gray-600">시각을 바꿔 비교해보세요</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/keyword/${encodeURIComponent(entry.slug)}`}
                className={
                  !country
                    ? 'inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-200'
                    : 'inline-flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-sm text-gray-400 transition hover:border-gray-700 hover:text-gray-200'
                }
              >
                <span aria-hidden="true">🌐</span>
                <span>전체 시각</span>
              </a>
              {countryChips.slice(0, 7).map(([code, count]) => {
                const active = country === code
                return (
                  <a
                    key={code}
                    href={`/keyword/${encodeURIComponent(entry.slug)}?country=${code}`}
                    className={
                      active
                        ? 'inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-200'
                        : 'inline-flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-sm text-gray-400 transition hover:border-gray-700 hover:text-gray-200'
                    }
                  >
                    <span>{countryFlag(code)}</span>
                    <span>{getCountryNameKo(code)} 시각</span>
                    <span className={active ? 'text-blue-300/70' : 'text-gray-600'}>
                      · {count}건
                    </span>
                  </a>
                )
              })}
              {countryChips.length > 7 && (
                <span className="inline-flex items-center px-2 text-xs text-gray-600">
                  +{countryChips.length - 7}개국 더 있음
                </span>
              )}
            </div>
          </section>
        )}

        {articles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-800 px-4 py-10 text-center">
            <p className="text-sm text-gray-500">
              아직 매칭된 기사가 없습니다.
            </p>
            <p className="mt-2 text-xs text-gray-600">
              새 기사가 들어오면 자동으로 표시됩니다.
            </p>
          </div>
        ) : (
          <>
            <KeywordSynthesis
              label={display}
              category={entry.category}
              articles={articles}
              lensCountry={country}
            />

            <ul className="space-y-3">
              {articles.map((a) => (
                <li key={a.id}>
                  <NewsCard item={a} showCountry defaultExpanded />
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
