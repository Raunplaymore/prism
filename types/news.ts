export type NewsCategory = string

export type Sentiment = 'positive' | 'neutral' | 'negative'

export interface NewsItem {
  id: string
  country: string
  category: NewsCategory
  title: string
  summary: string
  detail: string
  sentiment: Sentiment
  source: string
  url: string
  pubDate: string
  cachedAt: string
  isRealtime: boolean
}

export interface NewsResponse {
  items: NewsItem[]
  cached: boolean
  cachedAt: string | null
}

export interface PrismPerspective {
  region: string
  perspective: string
  tone: string
  key_points: string[]
}

export interface PrismResponse {
  topic: string
  country: string
  perspectives: PrismPerspective[]
  generatedAt: string
  cached: boolean
}

export interface UsageState {
  clicksToday: number
  lastClickDate: string
  clickedCountries: string[]
}

export interface ApiError {
  error: string
  code: string
  retryable: boolean
}
