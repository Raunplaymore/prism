import { getCountryName } from '@/lib/countries'

export interface RssArticle {
  title: string
  link: string
  description: string
  pubDate: string
  source: string
}

/** Country → locale + local-language search queries */
interface CountryRssConfig {
  hl: string
  gl: string
  ceid: string
  queries: string[] // local-language search terms
}

const COUNTRY_RSS: Record<string, CountryRssConfig> = {
  // East Asia
  KR: { hl: 'ko', gl: 'KR', ceid: 'KR:ko', queries: ['한국 뉴스', '한국 정치 경제'] },
  JP: { hl: 'ja', gl: 'JP', ceid: 'JP:ja', queries: ['日本 ニュース', '日本 政治 経済'] },
  CN: { hl: 'zh-CN', gl: 'CN', ceid: 'CN:zh-Hans', queries: ['中国 新闻', '中国 政治 经济'] },
  TW: { hl: 'zh-TW', gl: 'TW', ceid: 'TW:zh-Hant', queries: ['台灣 新聞', '台灣 政治 經濟'] },
  MN: { hl: 'mn', gl: 'MN', ceid: 'MN:mn', queries: ['Монгол мэдээ', 'Mongolia news'] },
  KP: { hl: 'ko', gl: 'KR', ceid: 'KR:ko', queries: ['북한 뉴스', 'North Korea news'] },
  // CIS / Eastern Europe
  RU: { hl: 'ru', gl: 'RU', ceid: 'RU:ru', queries: ['Россия новости', 'Россия политика экономика'] },
  UA: { hl: 'uk', gl: 'UA', ceid: 'UA:uk', queries: ['Україна новини', 'Україна політика'] },
  BY: { hl: 'ru', gl: 'BY', ceid: 'BY:ru', queries: ['Беларусь новости', 'Belarus news'] },
  KZ: { hl: 'ru', gl: 'KZ', ceid: 'KZ:ru', queries: ['Казахстан новости', 'Қазақстан жаңалықтар'] },
  GE: { hl: 'ka', gl: 'GE', ceid: 'GE:ka', queries: ['საქართველო ახალი ამბები', 'Georgia news'] },
  // Western Europe
  DE: { hl: 'de', gl: 'DE', ceid: 'DE:de', queries: ['Deutschland Nachrichten', 'Deutschland Politik Wirtschaft'] },
  FR: { hl: 'fr', gl: 'FR', ceid: 'FR:fr', queries: ['France actualités', 'France politique économie'] },
  ES: { hl: 'es', gl: 'ES', ceid: 'ES:es', queries: ['España noticias', 'España política economía'] },
  IT: { hl: 'it', gl: 'IT', ceid: 'IT:it', queries: ['Italia notizie', 'Italia politica economia'] },
  PT: { hl: 'pt-PT', gl: 'PT', ceid: 'PT:pt-150', queries: ['Portugal notícias', 'Portugal política economia'] },
  NL: { hl: 'nl', gl: 'NL', ceid: 'NL:nl', queries: ['Nederland nieuws', 'Nederland politiek economie'] },
  PL: { hl: 'pl', gl: 'PL', ceid: 'PL:pl', queries: ['Polska wiadomości', 'Polska polityka gospodarka'] },
  SE: { hl: 'sv', gl: 'SE', ceid: 'SE:sv', queries: ['Sverige nyheter', 'Sverige politik ekonomi'] },
  NO: { hl: 'no', gl: 'NO', ceid: 'NO:no', queries: ['Norge nyheter', 'Norge politikk økonomi'] },
  GB: { hl: 'en', gl: 'GB', ceid: 'GB:en', queries: ['United Kingdom news', 'UK politics economy'] },
  GR: { hl: 'el', gl: 'GR', ceid: 'GR:el', queries: ['Ελλάδα ειδήσεις', 'Ελλάδα πολιτική οικονομία'] },
  BE: { hl: 'nl', gl: 'BE', ceid: 'BE:nl', queries: ['België nieuws', 'Belgique actualités'] },
  AT: { hl: 'de', gl: 'AT', ceid: 'AT:de', queries: ['Österreich Nachrichten', 'Austria news'] },
  CH: { hl: 'de', gl: 'CH', ceid: 'CH:de', queries: ['Schweiz Nachrichten', 'Switzerland news'] },
  DK: { hl: 'da', gl: 'DK', ceid: 'DK:da', queries: ['Danmark nyheder', 'Denmark news'] },
  FI: { hl: 'fi', gl: 'FI', ceid: 'FI:fi', queries: ['Suomi uutiset', 'Finland news'] },
  IE: { hl: 'en', gl: 'IE', ceid: 'IE:en', queries: ['Ireland news', 'Ireland politics economy'] },
  CZ: { hl: 'cs', gl: 'CZ', ceid: 'CZ:cs', queries: ['Česko zprávy', 'Czech Republic news'] },
  RO: { hl: 'ro', gl: 'RO', ceid: 'RO:ro', queries: ['România știri', 'Romania news'] },
  HU: { hl: 'hu', gl: 'HU', ceid: 'HU:hu', queries: ['Magyarország hírek', 'Hungary news'] },
  RS: { hl: 'sr', gl: 'RS', ceid: 'RS:sr', queries: ['Србија вести', 'Serbia news'] },
  HR: { hl: 'hr', gl: 'HR', ceid: 'HR:hr', queries: ['Hrvatska vijesti', 'Croatia news'] },
  BG: { hl: 'bg', gl: 'BG', ceid: 'BG:bg', queries: ['България новини', 'Bulgaria news'] },
  SK: { hl: 'sk', gl: 'SK', ceid: 'SK:sk', queries: ['Slovensko správy', 'Slovakia news'] },
  LT: { hl: 'lt', gl: 'LT', ceid: 'LT:lt', queries: ['Lietuva naujienos', 'Lithuania news'] },
  LV: { hl: 'lv', gl: 'LV', ceid: 'LV:lv', queries: ['Latvija ziņas', 'Latvia news'] },
  EE: { hl: 'et', gl: 'EE', ceid: 'EE:et', queries: ['Eesti uudised', 'Estonia news'] },
  MD: { hl: 'ro', gl: 'MD', ceid: 'MD:ro', queries: ['Moldova știri', 'Moldova news'] },
  // Middle East
  IL: { hl: 'he', gl: 'IL', ceid: 'IL:he', queries: ['ישראל חדשות', 'ישראל פוליטיקה כלכלה'] },
  JO: { hl: 'ar', gl: 'JO', ceid: 'JO:ar', queries: ['الأردن أخبار', 'Jordan news'] },
  QA: { hl: 'ar', gl: 'QA', ceid: 'QA:ar', queries: ['قطر أخبار', 'Qatar news'] },
  IR: { hl: 'fa', gl: 'IR', ceid: 'IR:fa', queries: ['ایران اخبار', 'ایران سیاست اقتصاد'] },
  SA: { hl: 'ar', gl: 'SA', ceid: 'SA:ar', queries: ['السعودية أخبار', 'السعودية سياسة اقتصاد'] },
  EG: { hl: 'ar', gl: 'EG', ceid: 'EG:ar', queries: ['مصر أخبار', 'مصر سياسة اقتصاد'] },
  IQ: { hl: 'ar', gl: 'IQ', ceid: 'IQ:ar', queries: ['العراق أخبار', 'Iraq news'] },
  SY: { hl: 'ar', gl: 'SY', ceid: 'SY:ar', queries: ['سوريا أخبار', 'Syria news'] },
  LB: { hl: 'ar', gl: 'LB', ceid: 'LB:ar', queries: ['لبنان أخبار', 'Lebanon news'] },
  AE: { hl: 'ar', gl: 'AE', ceid: 'AE:ar', queries: ['الإمارات أخبار', 'UAE news'] },
  TR: { hl: 'tr', gl: 'TR', ceid: 'TR:tr', queries: ['Türkiye haberleri', 'Türkiye siyaset ekonomi'] },
  // South / Southeast Asia
  IN: { hl: 'en', gl: 'IN', ceid: 'IN:en', queries: ['India news today', 'India politics economy'] },
  PK: { hl: 'ur', gl: 'PK', ceid: 'PK:ur', queries: ['پاکستان خبریں', 'Pakistan news'] },
  BD: { hl: 'bn', gl: 'BD', ceid: 'BD:bn', queries: ['বাংলাদেশ সংবাদ', 'Bangladesh news'] },
  TH: { hl: 'th', gl: 'TH', ceid: 'TH:th', queries: ['ไทย ข่าว', 'ประเทศไทย การเมือง เศรษฐกิจ'] },
  VN: { hl: 'vi', gl: 'VN', ceid: 'VN:vi', queries: ['Việt Nam tin tức', 'Việt Nam chính trị kinh tế'] },
  ID: { hl: 'id', gl: 'ID', ceid: 'ID:id', queries: ['Indonesia berita', 'Indonesia politik ekonomi'] },
  PH: { hl: 'en', gl: 'PH', ceid: 'PH:en', queries: ['Philippines news', 'Philippines politics economy'] },
  SG: { hl: 'en', gl: 'SG', ceid: 'SG:en', queries: ['Singapore news', 'Singapore politics economy'] },
  MY: { hl: 'ms', gl: 'MY', ceid: 'MY:ms', queries: ['Malaysia berita', 'Malaysia politik ekonomi'] },
  MM: { hl: 'my', gl: 'MM', ceid: 'MM:my', queries: ['မြန်မာ သတင်း', 'Myanmar news'] },
  // Americas
  US: { hl: 'en', gl: 'US', ceid: 'US:en', queries: ['United States news', 'US politics economy'] },
  CA: { hl: 'en', gl: 'CA', ceid: 'CA:en', queries: ['Canada news', 'Canada politics economy'] },
  BR: { hl: 'pt-BR', gl: 'BR', ceid: 'BR:pt-419', queries: ['Brasil notícias', 'Brasil política economia'] },
  MX: { hl: 'es', gl: 'MX', ceid: 'MX:es-419', queries: ['México noticias', 'México política economía'] },
  AR: { hl: 'es', gl: 'AR', ceid: 'AR:es-419', queries: ['Argentina noticias', 'Argentina política economía'] },
  CO: { hl: 'es', gl: 'CO', ceid: 'CO:es-419', queries: ['Colombia noticias', 'Colombia política economía'] },
  VE: { hl: 'es', gl: 'VE', ceid: 'VE:es-419', queries: ['Venezuela noticias', 'Venezuela crisis'] },
  CU: { hl: 'es', gl: 'CU', ceid: 'CU:es-419', queries: ['Cuba noticias', 'Cuba news'] },
  // Oceania
  AU: { hl: 'en', gl: 'AU', ceid: 'AU:en', queries: ['Australia news', 'Australia politics economy'] },
  NZ: { hl: 'en', gl: 'NZ', ceid: 'NZ:en', queries: ['New Zealand news', 'New Zealand politics economy'] },
  // Americas
  CL: { hl: 'es', gl: 'CL', ceid: 'CL:es-419', queries: ['Chile noticias', 'Chile política economía'] },
  PE: { hl: 'es', gl: 'PE', ceid: 'PE:es-419', queries: ['Perú noticias', 'Perú política economía'] },
  // Africa
  MA: { hl: 'ar', gl: 'MA', ceid: 'MA:ar', queries: ['المغرب أخبار', 'Morocco news'] },
  SD: { hl: 'ar', gl: 'SD', ceid: 'SD:ar', queries: ['السودان أخبار', 'Sudan news war'] },
  CD: { hl: 'fr', gl: 'CD', ceid: 'CD:fr', queries: ['Congo RDC actualités', 'DR Congo news'] },
  GH: { hl: 'en', gl: 'GH', ceid: 'GH:en', queries: ['Ghana news', 'Ghana politics economy'] },
  TN: { hl: 'ar', gl: 'TN', ceid: 'TN:ar', queries: ['تونس أخبار', 'Tunisia news'] },
  LY: { hl: 'ar', gl: 'LY', ceid: 'LY:ar', queries: ['ليبيا أخبار', 'Libya news'] },
  NG: { hl: 'en', gl: 'NG', ceid: 'NG:en', queries: ['Nigeria news', 'Nigeria politics economy'] },
  ZA: { hl: 'en', gl: 'ZA', ceid: 'ZA:en', queries: ['South Africa news', 'South Africa politics economy'] },
  KE: { hl: 'en', gl: 'KE', ceid: 'KE:en', queries: ['Kenya news', 'Kenya politics economy'] },
  ET: { hl: 'am', gl: 'ET', ceid: 'ET:am', queries: ['ኢትዮጵያ ዜና', 'Ethiopia news'] },
}

/** Set of supported country codes */
export const SUPPORTED_COUNTRIES = new Set(Object.keys(COUNTRY_RSS))
export const SUPPORTED_COUNT = SUPPORTED_COUNTRIES.size

export function isSupported(countryCode: string): boolean {
  return SUPPORTED_COUNTRIES.has(countryCode.toUpperCase())
}

const DEFAULT_LOCALE = { hl: 'en', gl: 'US', ceid: 'US:en' }

/**
 * Google News RSS — local-language + English queries for better coverage
 */
function buildGoogleNewsUrls(countryCode: string): string[] {
  const countryName = getCountryName(countryCode)
  const config = COUNTRY_RSS[countryCode]
  const urls: string[] = []

  if (config) {
    // Local-language queries
    for (const q of config.queries) {
      urls.push(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${config.hl}&gl=${config.gl}&ceid=${config.ceid}`)
    }
    // English fallback if not already English
    if (config.hl !== 'en') {
      urls.push(`https://news.google.com/rss/search?q=${encodeURIComponent(`${countryName} news`)}&hl=en&gl=US&ceid=US:en`)
    }
  } else {
    // No config — English only with multiple queries
    urls.push(`https://news.google.com/rss/search?q=${encodeURIComponent(`${countryName} news today`)}&hl=en&gl=US&ceid=US:en`)
    urls.push(`https://news.google.com/rss/search?q=${encodeURIComponent(`${countryName} politics economy`)}&hl=en&gl=US&ceid=US:en`)
  }

  return urls
}

/** Parse RSS XML into articles */
export function parseRss(xml: string): RssArticle[] {
  const articles: RssArticle[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]
    const titleRaw = extractTag(item, 'title')
    const link = extractTag(item, 'link')
    const description = extractTag(item, 'description')
    const pubDate = extractTag(item, 'pubDate')

    if (!titleRaw || !link) continue

    // Google News title format: "Headline - Source Name"
    const dashIdx = titleRaw.lastIndexOf(' - ')
    const title = dashIdx > 0 ? titleRaw.slice(0, dashIdx).trim() : titleRaw
    const source = dashIdx > 0 ? titleRaw.slice(dashIdx + 3).trim() : 'Google News'

    articles.push({
      title: stripHtml(title),
      link,
      description: stripHtml(description),
      pubDate: pubDate || '',
      source,
    })
  }

  return articles
}

function extractTag(xml: string, tag: string): string {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i')
  const cdataMatch = xml.match(cdataRegex)
  if (cdataMatch) return cdataMatch[1].trim()

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : ''
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/** Fetch from a single RSS URL */
export async function fetchOneRss(url: string): Promise<RssArticle[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'PrismNewsBot/1.0' },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRss(xml)
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

/** Fetch articles from multiple Google News RSS queries, dedup, return up to 15 */
export async function fetchRssArticles(countryCode: string): Promise<RssArticle[]> {
  const urls = buildGoogleNewsUrls(countryCode)

  // Fetch all queries in parallel
  const results = await Promise.all(urls.map(fetchOneRss))
  const all = results.flat()

  // Dedup by link
  const seen = new Set<string>()
  const unique = all.filter((a) => {
    if (seen.has(a.link)) return false
    seen.add(a.link)
    return true
  })

  // Sort by date (newest first) and limit
  return unique
    .sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return db - da
    })
    .slice(0, 30)
}
