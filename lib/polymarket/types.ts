// Subset of Polymarket gamma-api response. Only fields used by Prism v2.

export interface PolymarketTag {
  id: string
  label: string
  slug: string
  forceShow?: boolean
  forceHide?: boolean
}

export interface PolymarketSeries {
  id: string
  ticker: string
  slug: string
  title: string
  recurrence?: string
}

export interface PolymarketMarket {
  id: string
  question: string
  slug: string
  conditionId?: string
  outcomes: string
  outcomePrices: string
  groupItemTitle?: string
  volume?: string
  volume24hr?: number
  active: boolean
  closed: boolean
  endDate?: string
  oneHourPriceChange?: number
  oneDayPriceChange?: number
  oneWeekPriceChange?: number
  lastTradePrice?: number
  bestBid?: number
  bestAsk?: number
}

export interface PolymarketEventMetadata {
  context_description?: string
  context_updated_at?: string
}

export interface PolymarketEvent {
  id: string
  ticker?: string
  slug: string
  title: string
  description?: string
  image?: string
  icon?: string
  startDate?: string
  endDate?: string
  active: boolean
  closed: boolean
  archived: boolean
  liquidity?: number
  volume?: number
  volume24hr?: number
  volume1wk?: number
  openInterest?: number
  competitive?: number
  tags?: PolymarketTag[]
  series?: PolymarketSeries[]
  markets?: PolymarketMarket[]
  eventMetadata?: PolymarketEventMetadata
}
