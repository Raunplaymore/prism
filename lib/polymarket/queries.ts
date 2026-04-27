import type { PolymarketEvent } from './types'
import { CATEGORY_QUERY_TERMS, type PrismCategory } from './categories'

// Tag labels too broad (or too operational) to anchor a news search.
// We prefer specific tags like "Iran" or "Trump" over generic ones.
const NON_SUBJECT_LABELS = new Set<string>([
  // Category-level — too broad to anchor
  'Politics', 'Geopolitics', 'Economy', 'Sports', 'Crypto', 'Tech',
  'Technology', 'Culture', 'Pop Culture', 'World', 'Games',
  'Business', 'Finance', 'Commodities', 'Markets',
  // Operational/structural metadata
  'Recurring', 'Weekly', 'Daily', 'Monthly', 'Hide From New', 'Featured',
  'Airdrops', 'Multi Strikes', 'Multi-Strikes', 'Single Strikes', 'Strikes',
  'Earn 4%', 'Earn 4', 'Hit Price', 'Updown', 'Finance Updown',
  'Pre-Market', 'PreMarket', 'Macro',
  // Election aggregators — defer to candidate names instead
  'Elections', 'Global Elections', 'World Elections', 'Main Election',
  // Topic aggregators overlapping with category
  'Economic Policy', 'Crypto Prices', 'Fed Rates',
])

export interface NewsQuery {
  /** Full boolean query, e.g. `"Iran Trump" (ceasefire OR peace)` */
  query: string
  /** Quoted-phrase subjects (anchor tokens). */
  subjects: string[]
  /** OR-terms (category-specific keyword expansion). */
  terms: string[]
}

function pickSubjects(event: PolymarketEvent): string[] {
  const labels = (event.tags || [])
    .map((t) => t.label.trim())
    .filter((l) => l.length > 0 && !NON_SUBJECT_LABELS.has(l))

  const seen = new Set<string>()
  const unique: string[] = []
  for (const label of labels) {
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(label)
  }

  // Drop substring duplicates: if "Iran" and "Iran Ceasefire" both appear,
  // keep only the longer (more specific) one.
  const filtered: string[] = []
  for (const label of unique) {
    const lower = label.toLowerCase()
    const subsumedBy = filtered.find((f) => f.toLowerCase().includes(lower))
    if (subsumedBy) continue
    for (let i = filtered.length - 1; i >= 0; i--) {
      if (lower.includes(filtered[i].toLowerCase())) filtered.splice(i, 1)
    }
    filtered.push(label)
  }

  return filtered.slice(0, 2)
}

function fallbackSubjectFromTitle(title: string): string {
  // Strip trailing question marks / "by..." patterns to get a cleaner phrase.
  return title
    .replace(/\?+\s*$/, '')
    .replace(/\s+by[\s.…]*$/i, '')
    .trim()
    .slice(0, 60)
}

export function buildNewsQuery(
  event: PolymarketEvent,
  category: PrismCategory,
): NewsQuery {
  const subjects = pickSubjects(event)
  const terms = CATEGORY_QUERY_TERMS[category]

  const subjectPhrase = subjects.length > 0
    ? subjects.join(' ')
    : fallbackSubjectFromTitle(event.title)

  const subjectPart = `"${subjectPhrase}"`
  const termsPart = `(${terms.join(' OR ')})`

  return {
    query: `${subjectPart} ${termsPart}`,
    subjects,
    terms,
  }
}

/** RSS feed URL for the Google News search. */
export function googleNewsRssUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    hl: 'en-US',
    gl: 'US',
    ceid: 'US:en',
  })
  return `https://news.google.com/rss/search?${params.toString()}`
}
