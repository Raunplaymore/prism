import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { NewsItem } from '@/types/news'
import NewsCard from '@/components/NewsCard'
import Nav from '@/components/Nav'
import KeywordSynthesis from '@/components/keyword/KeywordSynthesis'
import { findEntry, getArticlesByKeyword } from '@/lib/keywords/index'
import { getCountryNameKo } from '@/lib/countries'

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

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const entry = findEntry(decodeURIComponent(params.slug))
  if (!entry) {
    return {
      title: 'Keyword not found — Prism',
      robots: { index: false, follow: false },
    }
  }
  const display = entry.labelKo || entry.label
  const articles = await getArticlesByKeyword(entry.slug)
  const countryCount = new Set(articles.map((a) => a.country)).size
  const description =
    articles.length > 0
      ? `${display} 관련 ${articles.length}건의 기사를 ${countryCount}개국에서 수집했습니다. Prism이 다국가 보도 양상을 종합하여 한국어로 제공합니다.`
      : `${display} 관련 모든 국가의 최신 기사`
  return {
    title: `#${entry.slug} · ${display} — Prism`,
    description,
    robots:
      articles.length === 0
        ? { index: false, follow: false }
        : { index: true, follow: true },
  }
}

export default async function KeywordPage({
  params,
}: {
  params: { slug: string }
}) {
  const slug = decodeURIComponent(params.slug)
  const entry = findEntry(slug)
  if (!entry) notFound()

  const articles = await getArticlesByKeyword(entry.slug)
  const display = entry.labelKo || entry.label

  // Build CollectionPage JSON-LD describing the keyword and its articles.
  // Including a description plus hasPart NewsArticle entries gives crawlers
  // a structured anchor for the page's original synthesis + sources.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${display} — Prism`,
    description:
      articles.length > 0
        ? `Prism이 ${display} 관련 ${articles.length}건의 기사를 ${
            new Set(articles.map((a) => a.country)).size
          }개국에서 종합한 다국가 보도 분석입니다.`
        : `${display} 관련 다국가 보도 분석`,
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
  }

  // Group articles by country, ordered by article count desc.
  const groupMap = new Map<string, NewsItem[]>()
  for (const a of articles) {
    const list = groupMap.get(a.country) ?? []
    list.push(a)
    groupMap.set(a.country, list)
  }
  const groups = Array.from(groupMap.entries()).sort(
    (a, b) => b[1].length - a[1].length,
  )
  const countryCount = groups.length

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
          <h1 className="mt-1 text-3xl font-bold">{display}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {articles.length}건 · {countryCount}개 국가
            <span className="ml-2 rounded bg-gray-900 px-1.5 py-0.5 text-xs text-gray-500">
              {CATEGORY_LABEL_KO[entry.category] ?? entry.category}
            </span>
          </p>
        </div>

        {groups.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {groups.map(([country, items]) => (
              <a
                key={country}
                href={`#country-${country}`}
                className="inline-flex items-baseline gap-1 rounded-full border border-gray-800 bg-gray-900 px-2 py-0.5 text-xs text-gray-400 transition hover:border-gray-700 hover:text-gray-200"
              >
                <span>{countryFlag(country)}</span>
                <span>{getCountryNameKo(country)}</span>
                <span className="text-gray-600">{items.length}</span>
              </a>
            ))}
            <a
              href="/map"
              className="inline-flex items-center gap-1 rounded-full border border-gray-800 bg-gray-900 px-2 py-0.5 text-xs text-gray-400 transition hover:border-gray-700 hover:text-gray-200"
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
            />

            <div className="space-y-8">
              {groups.map(([country, items]) => (
                <section key={country} id={`country-${country}`} className="scroll-mt-20">
                  <h2 className="mb-3 flex items-center gap-2 border-b border-gray-800 pb-2 text-lg font-semibold">
                    <span>{countryFlag(country)}</span>
                    <span>{getCountryNameKo(country)}</span>
                    <span className="text-sm font-normal text-gray-500">
                      ({items.length}건)
                    </span>
                  </h2>
                  <ul className="space-y-3">
                    {items.map((a) => (
                      <li key={a.id}>
                        <NewsCard item={a} defaultExpanded />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
