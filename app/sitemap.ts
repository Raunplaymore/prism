import type { MetadataRoute } from 'next'
import { CATEGORY_KEYS, slugForCategory } from '@/lib/categories'
import { getLiveKeywordCounts } from '@/lib/keywords/index'
import { getAllCountries } from '@/lib/countries'
import { isSupported } from '@/lib/rss'

export const runtime = 'edge'
// 1시간마다 재생성 — 새 키워드(slug)가 vocabulary에 추가되거나 cron이 새
// 슬러그를 인덱싱하면 다음 revalidate 사이클에 자동 반영.
export const revalidate = 3600

const SITE = 'https://prismglobe.com'

/**
 * Dynamic sitemap.
 *
 * - Static surfaces (home, about, privacy, category index, keyword index, map)
 * - 9 category hub pages (always present)
 * - Live keyword slugs from getLiveKeywordCounts (count > 0 — thin content auto-excluded)
 *
 * URL 변형(?country=)은 포함하지 않음 — 각 hub가 자기 자신을 canonical로
 * 가리키므로 변형은 색인되지 않아야 함.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE}/`,         changeFrequency: 'hourly',  priority: 1.0, lastModified: now },
    { url: `${SITE}/category`, changeFrequency: 'hourly',  priority: 0.9, lastModified: now },
    { url: `${SITE}/keyword`,  changeFrequency: 'hourly',  priority: 0.9, lastModified: now },
    { url: `${SITE}/map`,      changeFrequency: 'daily',   priority: 0.7, lastModified: now },
    { url: `${SITE}/about`,    changeFrequency: 'monthly', priority: 0.5, lastModified: now },
    { url: `${SITE}/privacy`,  changeFrequency: 'monthly', priority: 0.5, lastModified: now },
  ]

  const categoryEntries: MetadataRoute.Sitemap = CATEGORY_KEYS.map((key) => ({
    url: `${SITE}/category/${slugForCategory(key)}`,
    changeFrequency: 'daily',
    priority: 0.8,
    lastModified: now,
  }))

  // Keyword 슬러그 — Redis가 비어있거나 실패하면 sitemap을 죽이지 않고 비어둠.
  let keywordEntries: MetadataRoute.Sitemap = []
  try {
    const counts = await getLiveKeywordCounts()
    keywordEntries = counts.map(({ entry }) => ({
      url: `${SITE}/keyword/${encodeURIComponent(entry.slug)}`,
      changeFrequency: 'daily',
      priority: 0.7,
      lastModified: now,
    }))
  } catch {
    // ignore — 정적 + 카테고리만으로도 sitemap은 valid
  }

  const countryEntries: MetadataRoute.Sitemap = getAllCountries()
    .filter(({ code }) => isSupported(code))
    .map(({ code }) => ({
      url: `${SITE}/country/${code}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
      lastModified: now,
    }))

  return [...staticEntries, ...categoryEntries, ...countryEntries, ...keywordEntries]
}
