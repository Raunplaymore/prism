import { getAliasIndex, type KeywordEntry } from './vocabulary'

export interface MatchResult {
  /** entries matched to canonical slugs */
  matched: KeywordEntry[]
  /** raw keywords that did not match any vocabulary alias */
  unknown: string[]
}

/**
 * Light normalization for matching. We do NOT lemmatize or stem —
 * the vocabulary itself encodes alias variants.
 */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^['"\s]+|['"\s]+$/g, '')
}

/**
 * Match a list of free-form keywords (in any language) against the curated
 * vocabulary. Returns canonical entries + unknowns for curator review.
 *
 * Matching strategy (light, deterministic):
 *   1. Exact alias match (lowercased)
 *   2. Substring containment — alias appears anywhere in the keyword,
 *      or keyword appears anywhere in an alias (longer-match preferred)
 *   3. Otherwise, unknown
 */
export function matchKeywords(rawKeywords: string[]): MatchResult {
  const index = getAliasIndex()
  const matched = new Map<string, KeywordEntry>() // dedup by slug
  const unknown: string[] = []

  for (const raw of rawKeywords) {
    const k = normalize(raw)
    if (!k) continue

    // 1. exact alias match
    const exact = index.get(k)
    if (exact) {
      matched.set(exact.slug, exact)
      continue
    }

    // 2. substring — find longest alias contained in (or containing) the keyword
    let bestEntry: KeywordEntry | null = null
    let bestLen = 0
    index.forEach((entry, alias) => {
      if (alias.length < 3) return // skip tiny aliases to avoid noise
      if (k.includes(alias) || alias.includes(k)) {
        const len = Math.min(alias.length, k.length)
        if (len > bestLen) {
          bestLen = len
          bestEntry = entry
        }
      }
    })
    if (bestEntry) {
      const e = bestEntry as KeywordEntry
      matched.set(e.slug, e)
      continue
    }

    // 3. unknown — record raw form for curator review
    unknown.push(raw.trim())
  }

  const matchedArr: KeywordEntry[] = []
  matched.forEach((entry) => matchedArr.push(entry))
  return { matched: matchedArr, unknown }
}
