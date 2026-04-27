import { redisGet, redisSetEx } from './redis'
import {
  translateMarketContentKo,
  type MarketContentTranslation,
  type MarketTranslationInput,
} from './summarize'

const CTX_TTL = 24 * 60 * 60 // 24h

export interface MarketContentResult {
  titleKo: string
  contextKo: string
  /** marketId → Korean short label */
  marketLabelsKo: Record<string, string>
  cached: boolean
}

function ctxCacheKey(eventId: string): string {
  return `polymarket:ctx:${eventId}`
}

function asLabelMap(items: { id: string; labelKo: string }[] | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of items ?? []) out[m.id] = m.labelKo
  return out
}

export async function fetchTranslatedMarketContent(
  args: { eventId: string } & MarketTranslationInput,
): Promise<MarketContentResult> {
  const { eventId, title, context, markets } = args
  const key = ctxCacheKey(eventId)

  const cached = await redisGet(key)
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as MarketContentTranslation
      if (parsed.titleKo || parsed.contextKo || (parsed.markets && parsed.markets.length > 0)) {
        return {
          titleKo: parsed.titleKo || title,
          contextKo: parsed.contextKo || context,
          marketLabelsKo: asLabelMap(parsed.markets),
          cached: true,
        }
      }
    } catch {
      // Stale schema — fall through to retranslate
    }
  }

  const result = await translateMarketContentKo({ title, context, markets })
  if (result) {
    await redisSetEx(key, JSON.stringify(result), CTX_TTL)
    return {
      titleKo: result.titleKo || title,
      contextKo: result.contextKo || context,
      marketLabelsKo: asLabelMap(result.markets),
      cached: false,
    }
  }

  // Translation failed — return English originals; do not poison the cache.
  return { titleKo: title, contextKo: context, marketLabelsKo: {}, cached: false }
}
