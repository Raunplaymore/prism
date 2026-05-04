import type { Metadata } from 'next'
import {
  getArticlesByKeyword,
  getLiveKeywordCounts,
} from '@/lib/keywords/index'
import KeywordSphere from '@/components/keyword/KeywordSphere'
import NewsCard from '@/components/NewsCard'
import Nav from '@/components/Nav'
import SelectNavigator from '@/components/SelectNavigator'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '키워드로 보는 세계 뉴스 — prismglobe',
  description:
    'prismglobe이 50여 개국에서 수집한 기사를 인물·국가·조직·기업·토픽·이벤트로 인덱싱한 키워드 클라우드. 같은 주제를 여러 국가가 어떻게 다루는지 비교해보세요.',
  alternates: { canonical: '/keyword' },
  robots: { index: true, follow: true },
  openGraph: {
    title: '키워드로 보는 세계 뉴스 — prismglobe',
    description:
      'prismglobe이 50여 개국에서 수집한 기사를 정규화된 키워드로 인덱싱. 같은 주제를 여러 국가가 어떻게 다루는지 비교.',
    type: 'website',
    locale: 'ko_KR',
    images: ['/og-image.png'],
  },
}

// Same palette as KeywordSphere — keep visual cue consistent across surfaces.
const CATEGORY_COLOR: Record<string, string> = {
  person: '#fbbf24',
  country: '#60a5fa',
  org: '#a78bfa',
  company: '#34d399',
  topic: '#f87171',
  event: '#fb923c',
}

export default async function KeywordIndexPage() {
  const all = await getLiveKeywordCounts()
  const totalArticleHits = all.reduce((sum, kc) => sum + kc.count, 0)

  // Top keyword preview: surface the most-active keyword's articles directly
  // below the sphere so the index page ships real content (better SEO + less
  // "click sphere to find anything" friction). all[] is already count-desc.
  const topKeyword = all[0] ?? null
  const topKeywordArticles = topKeyword
    ? await getArticlesByKeyword(topKeyword.entry.slug)
    : []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: 'https://prismglobe.com/' },
          { '@type': 'ListItem', position: 2, name: '키워드', item: 'https://prismglobe.com/keyword' },
        ],
      },
      {
        '@type': 'ItemList',
        name: '살아있는 키워드',
        numberOfItems: all.length,
        // 너무 많으면 SERP가 무시. 상위 50으로 제한.
        itemListElement: all.slice(0, 50).map((kc, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `https://prismglobe.com/keyword/${encodeURIComponent(kc.entry.slug)}`,
          name: kc.entry.labelKo || kc.entry.label,
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold">키워드로 보는 세계 뉴스</h1>
          <p className="mt-1 text-sm text-gray-500">
            지금 살아있는 키워드 {all.length}개 · 총 {totalArticleHits}건
          </p>
          <details className="group mt-2 max-w-2xl">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-gray-500 transition hover:text-gray-300">
              <span>키워드 인덱싱 방식 안내</span>
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
              prismglobe은 매일 50여 개국의 현지 언론에서 수집한 기사를 AI가 분류·요약하고,
              인물·국가·조직·기업·토픽·이벤트 6개 분류의 정규화된 키워드로 인덱싱합니다.
              아래 키워드를 누르면 같은 주제를 여러 국가가 어떻게 다루고 있는지 한눈에 비교할 수 있습니다.
            </p>
          </details>
        </div>

        {all.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-800 px-4 py-10 text-center">
            <p className="text-sm text-gray-500">아직 인덱스된 키워드가 없습니다.</p>
            <p className="mt-2 text-xs text-gray-600">
              새 기사가 들어오면 자동으로 표시됩니다.
            </p>
          </div>
        ) : (
          <>
            <div className="relative mb-3 flex h-[190px] items-center justify-center overflow-hidden rounded-2xl border border-gray-900 bg-gradient-to-b from-gray-950 to-gray-900/40 sm:h-[420px] lg:h-[520px]">
              <KeywordSphere items={all} />
              <p className="pointer-events-none absolute bottom-3 right-4 text-xs text-gray-600">
                클릭해서 들어가기
              </p>
            </div>
            <SelectNavigator
              routePrefix="/keyword"
              placeholder="키워드 직접 선택"
              options={all.map((kc) => ({
                value: kc.entry.slug,
                label: `${kc.entry.labelKo || kc.entry.label} (${kc.count}건)`,
              }))}
            />
            {topKeyword && topKeywordArticles.length > 0 && (
              <section className="mb-12">
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    지금 가장 활발한 키워드:{' '}
                    <span className="text-white">
                      #{topKeyword.entry.labelKo || topKeyword.entry.label}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({topKeyword.count}건)
                    </span>
                  </h2>
                  <a
                    href={`/keyword/${encodeURIComponent(topKeyword.entry.slug)}`}
                    className="text-xs text-gray-500 transition hover:text-gray-300"
                  >
                    키워드 상세 →
                  </a>
                </div>
                <div className="space-y-3">
                  {topKeywordArticles.slice(0, 8).map((item) => (
                    <NewsCard key={item.id} item={item} showCountry />
                  ))}
                </div>
                <a
                  href={`/keyword/${encodeURIComponent(topKeyword.entry.slug)}`}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 text-base font-semibold transition hover:opacity-80"
                  style={{
                    borderColor: CATEGORY_COLOR[topKeyword.entry.category] ?? '#9ca3af',
                    color: CATEGORY_COLOR[topKeyword.entry.category] ?? '#9ca3af',
                  }}
                >
                  #{topKeyword.entry.labelKo || topKeyword.entry.label} 키워드 상세
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
          </>
        )}
      </div>
    </div>
  )
}
