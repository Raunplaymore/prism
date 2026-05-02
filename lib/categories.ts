/**
 * Category Single Source of Truth.
 *
 * 9 canonical news categories used across NewsCard, KeywordSynthesis,
 * /api/news/latest filtering, and the upcoming /category/[slug] hub pages.
 *
 * Colors mirror components/NewsCard.tsx categoryColors so badges stay in sync.
 *
 * NOTE: This module must remain edge-runtime safe — no Node-only imports,
 * no React, no fs/path. Pure data + pure helpers only, so it can be imported
 * by both server (route handlers) and client (NewsCard, KeywordSynthesis) code
 * without circular dependency risk.
 */

export const CATEGORY_KEYS = [
  'Politics',
  'Economy',
  'Society',
  'Tech',
  'Defense',
  'Diplomacy',
  'Environment',
  'Health',
  'Culture',
] as const

export type CategoryKey = (typeof CATEGORY_KEYS)[number]

export interface CategoryMeta {
  /** Canonical English label (PascalCase enum value). */
  en: string
  /** Korean display label. */
  ko: string
  /** Hex color string (matches NewsCard categoryColors). */
  color: string
  /** Korean SEO description sentence used on the hub page. */
  description: string
}

export const CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  Politics: {
    en: 'Politics',
    ko: '정치',
    color: '#3b82f6',
    description: '정부·선거·입법 등 각국 정치 이슈를 다국가 시각으로',
  },
  Economy: {
    en: 'Economy',
    ko: '경제',
    color: '#22c55e',
    description: '거시경제·금융·무역·산업 동향을 50여 개국 보도로',
  },
  Society: {
    en: 'Society',
    ko: '사회',
    color: '#6b7280',
    description: '사회 이슈·인구·범죄·교육 분야 다국가 비교',
  },
  Tech: {
    en: 'Tech',
    ko: '기술',
    color: '#a855f7',
    description: 'AI·반도체·플랫폼·스타트업 글로벌 기술 흐름',
  },
  Defense: {
    en: 'Defense',
    ko: '국방',
    color: '#ef4444',
    description: '군사·안보·분쟁·방산 산업 다국가 보도',
  },
  Diplomacy: {
    en: 'Diplomacy',
    ko: '외교',
    color: '#eab308',
    description: '정상회담·조약·외교 분쟁의 국가별 시각',
  },
  Environment: {
    en: 'Environment',
    ko: '환경',
    color: '#10b981',
    description: '기후·에너지·재생가능 정책 국제 동향',
  },
  Health: {
    en: 'Health',
    ko: '건강',
    color: '#06b6d4',
    description: '공중보건·의료·전염병 글로벌 이슈',
  },
  Culture: {
    en: 'Culture',
    ko: '문화',
    color: '#ec4899',
    description: '문화·예술·미디어 산업 다국가 흐름',
  },
}

/** Type guard: is this string one of the canonical PascalCase keys? */
export function isValidCategory(s: string): s is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(s)
}

/**
 * Map a lowercase URL slug (e.g. "economy") to its canonical PascalCase
 * CategoryKey (e.g. "Economy"). Returns null for unknown slugs so callers
 * can render notFound().
 */
export function categoryFromSlug(slug: string): CategoryKey | null {
  if (!slug) return null
  const lo = slug.toLowerCase()
  for (const key of CATEGORY_KEYS) {
    if (key.toLowerCase() === lo) return key
  }
  return null
}

/** Map a canonical PascalCase CategoryKey back to its lowercase URL slug. */
export function slugForCategory(key: CategoryKey): string {
  return key.toLowerCase()
}
