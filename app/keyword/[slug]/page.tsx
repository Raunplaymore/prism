import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import NewsCard from '@/components/NewsCard'
import Nav from '@/components/Nav'
import { findEntry, getArticlesByKeyword } from '@/lib/keywords/index'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const entry = findEntry(decodeURIComponent(params.slug))
  if (!entry) return { title: 'Keyword not found — Prism' }
  const display = entry.labelKo || entry.label
  return {
    title: `#${entry.slug} · ${display} — Prism`,
    description: `${display} 관련 모든 국가의 최신 기사`,
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

  // Group by country for the country chip strip
  const byCountry = new Map<string, number>()
  for (const a of articles) {
    byCountry.set(a.country, (byCountry.get(a.country) ?? 0) + 1)
  }
  const countryChips = Array.from(byCountry.entries()).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <div className="mb-6">
          <p className="text-sm text-gray-500">#{entry.slug}</p>
          <h1 className="mt-1 text-3xl font-bold">{entry.labelKo || entry.label}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {articles.length}건 · {countryChips.length}개 국가
            <span className="ml-2 rounded bg-gray-900 px-1.5 py-0.5 text-xs text-gray-500">
              {entry.category}
            </span>
          </p>
        </div>

        {countryChips.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {countryChips.map(([country, n]) => (
              <span
                key={country}
                className="rounded-full border border-gray-800 bg-gray-900 px-2 py-0.5 text-xs text-gray-400"
              >
                {country} <span className="text-gray-600">{n}</span>
              </span>
            ))}
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
          <ul className="space-y-3">
            {articles.map((a) => (
              <li key={a.id}>
                <NewsCard item={a} showCountry />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
