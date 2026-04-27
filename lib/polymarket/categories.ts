export type PrismCategory =
  | 'geopolitics'
  | 'economy'
  | 'politics'
  | 'elections'
  | 'crypto'
  | 'energy'
  | 'tech'

export interface PrismCategoryMeta {
  id: PrismCategory
  label: string
  emoji: string
  description: string
  /** Polymarket gamma-api `tag_slug` used to fetch events for this category. */
  slug: string
}

export const PRISM_CATEGORIES: PrismCategoryMeta[] = [
  { id: 'geopolitics', slug: 'geopolitics', label: 'Geopolitics / Conflict', emoji: '🌍', description: '국제 분쟁·외교·전쟁' },
  { id: 'economy',     slug: 'economy',     label: 'Economy',                emoji: '📈', description: '거시 경제·중앙은행·금리' },
  { id: 'politics',    slug: 'politics',    label: 'Politics',               emoji: '🏛',  description: '정치·정책·인물' },
  { id: 'elections',   slug: 'elections',   label: 'Elections',              emoji: '🗳', description: '선거·후보·여론조사' },
  { id: 'crypto',      slug: 'crypto',      label: 'Crypto',                 emoji: '💰', description: '암호화폐·블록체인' },
  { id: 'energy',      slug: 'commodities', label: 'Energy / Commodities',   emoji: '⚡',  description: '에너지·원자재' },
  { id: 'tech',        slug: 'tech',        label: 'Tech / AI',              emoji: '🤖', description: 'AI·반도체·테크' },
]

export const ALL_CATEGORY_IDS: PrismCategory[] = PRISM_CATEGORIES.map((c) => c.id)

// Per-category OR-terms used when synthesizing a Google News query for a market.
export const CATEGORY_QUERY_TERMS: Record<PrismCategory, string[]> = {
  'geopolitics': ['ceasefire', 'peace', 'war', 'strike', 'sanctions', 'military', 'nuclear'],
  'economy':     ['rate', 'Fed', 'inflation', 'recession', 'GDP', 'policy'],
  'politics':    ['policy', 'tariff', 'congress', 'sanction', 'bill'],
  'elections':   ['election', 'vote', 'poll', 'candidate', 'campaign'],
  'crypto':      ['price', 'ETF', 'regulation', 'SEC'],
  'energy':      ['price', 'supply', 'OPEC', 'output'],
  'tech':        ['regulation', 'chip', 'OpenAI', 'China'],
}
