/**
 * GET /api/og/social?article=KR-abc123&card=1
 *
 * Edge OG endpoint that renders one of the 3 social cards as a 1080×1080 PNG.
 * card=1 → Hook (also used by Threads)
 * card=2 → Body
 * card=3 → CTA
 *
 * Same admin gate as /api/admin/article. Korean glyphs need a real font, so
 * Pretendard regular/bold is fetched from jsDelivr at first cold start; the
 * Cloudflare CDN caches subsequent ImageResponse output.
 */

export const runtime = 'edge'

import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { getFeed } from '@/lib/cache'
import { isSupported } from '@/lib/rss'
import { verifySessionToken, getSessionFromCookie } from '@/lib/auth'
import { CATEGORY_META, isValidCategory } from '@/lib/categories'
import { countryFlag, getCountryNameKo } from '@/lib/countries'
import type { NewsItem } from '@/types/news'

const SIZE = { width: 1080, height: 1080 }

const FONT_BOLD =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff/Pretendard-Bold.woff'
const FONT_REGULAR =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/woff/Pretendard-Regular.woff'

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET
  if (secret && request.headers.get('x-admin-secret') === secret) return true
  const token = getSessionFromCookie(request.headers.get('cookie'))
  if (token) {
    const user = await verifySessionToken(token)
    if (user?.isAdmin) return true
  }
  return false
}

async function fetchArticle(id: string): Promise<NewsItem | null> {
  const m = id.match(/^([A-Za-z]{2})-/)
  if (!m) return null
  const country = m[1].toUpperCase()
  if (!isSupported(country)) return null
  for (const lang of ['ko', 'en'] as const) {
    const feed = await getFeed(country, lang)
    if (!feed) continue
    const items = feed.items as unknown as NewsItem[]
    const found = items.find((i) => i.id === id)
    if (found) return found
  }
  return null
}

function trim(s: string, max: number): string {
  if (!s) return ''
  if (s.length <= max) return s
  return s.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

interface Ctx {
  item: NewsItem
  flag: string
  koCountry: string
  catKo: string
  catColor: string
}

function buildCtx(item: NewsItem): Ctx {
  const country = item.country.toUpperCase()
  const cat = item.category && isValidCategory(item.category) ? item.category : null
  return {
    item,
    flag: countryFlag(country),
    koCountry: getCountryNameKo(country),
    catKo: cat ? CATEGORY_META[cat].ko : item.category,
    catColor: cat ? CATEGORY_META[cat].color : '#6b7280',
  }
}

const FRAME_PADDING = 64

function Header({ pageNum }: { pageNum: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          P
        </div>
        <span style={{ color: 'white', fontSize: 32, fontWeight: 700 }}>Prism</span>
      </div>
      <div
        style={{
          display: 'flex',
          padding: '8px 18px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.8)',
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 1.5,
        }}
      >
        {pageNum} / 3
      </div>
    </div>
  )
}

function FooterBar({ left, right, rightColor }: { left: string; right: string; rightColor?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingTop: 24,
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 24 }}>{left}</span>
      <span style={{ color: rightColor ?? 'rgba(255,255,255,0.55)', fontSize: 24, fontWeight: 600 }}>
        {right}
      </span>
    </div>
  )
}

function Card1({ item, flag, koCountry, catKo, catColor }: Ctx) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: FRAME_PADDING,
        background: `linear-gradient(135deg, #050505 0%, #0a0a0a 40%, ${catColor}66 100%)`,
        color: 'white',
      }}
    >
      <Header pageNum={1} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <span style={{ fontSize: 180, lineHeight: 1, marginBottom: 36 }}>{flag}</span>
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            padding: '10px 22px',
            borderRadius: 999,
            background: `${catColor}33`,
            color: catColor,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 36,
          }}
        >
          {koCountry} · {catKo}
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.2, color: 'white' }}>
          {trim(item.title, 80)}
        </div>
      </div>
      <FooterBar left="" right="▶ Swipe" />
    </div>
  )
}

function Card2({ item, flag, koCountry, catKo, catColor }: Ctx) {
  const hasDetail = Boolean(item.detail) && item.detail.trim() !== item.summary.trim()
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: FRAME_PADDING,
        background: 'linear-gradient(135deg, #050505 0%, #1a1a1a 100%)',
        color: 'white',
      }}
    >
      <Header pageNum={2} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-start', paddingTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <span style={{ fontSize: 40, lineHeight: 1 }}>{flag}</span>
          <span style={{ color: catColor, fontSize: 24, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            {koCountry} · {catKo}
          </span>
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.25, color: 'white', marginBottom: 28 }}>
          {trim(item.title, 100)}
        </div>
        <div style={{ fontSize: 30, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', marginBottom: hasDetail ? 24 : 0 }}>
          {item.summary}
        </div>
        {hasDetail && (
          <div style={{ fontSize: 26, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)' }}>
            {trim(item.detail, 350)}
          </div>
        )}
      </div>
      <FooterBar left="" right="▶ 더 보기" />
    </div>
  )
}

function Card3({ item, catColor }: Ctx) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: FRAME_PADDING,
        background: `linear-gradient(135deg, ${catColor}40 0%, #0a0a0a 50%, #050505 100%)`,
        color: 'white',
      }}
    >
      <Header pageNum={3} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.15, color: 'white', marginBottom: 36 }}>
          85개국,
          <br />
          같은 사건을
          <br />
          <span style={{ color: catColor }}>다르게 본다</span>
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)', marginBottom: 40 }}>
          한 나라의 시선만으로는 보이지 않던 흐름.
          <br />
          Prism에서 다국가 뉴스를 한 화면으로.
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, letterSpacing: 2, textTransform: 'uppercase' }}>
            출처
          </span>
          <span style={{ color: 'white', fontSize: 28, fontWeight: 600, marginTop: 4 }}>{item.source}</span>
        </div>
      </div>
      <FooterBar left="prismglobe.com" right="→ 바로가기" rightColor={catColor} />
    </div>
  )
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return new Response('Unauthorized', { status: 401 })
  }
  const id = request.nextUrl.searchParams.get('article')
  const cardParam = request.nextUrl.searchParams.get('card') ?? '1'
  if (!id) return new Response('missing article', { status: 400 })
  const cardNum = cardParam === '2' ? 2 : cardParam === '3' ? 3 : 1

  const item = await fetchArticle(id)
  if (!item) return new Response('not found', { status: 404 })

  const ctx = buildCtx(item)

  let element: React.ReactElement
  if (cardNum === 1) element = <Card1 {...ctx} />
  else if (cardNum === 2) element = <Card2 {...ctx} />
  else element = <Card3 {...ctx} />

  const [bold, regular] = await Promise.all([
    fetch(FONT_BOLD).then((r) => r.arrayBuffer()),
    fetch(FONT_REGULAR).then((r) => r.arrayBuffer()),
  ])

  return new ImageResponse(element, {
    ...SIZE,
    fonts: [
      { name: 'Pretendard', data: bold, weight: 700, style: 'normal' },
      { name: 'Pretendard', data: regular, weight: 400, style: 'normal' },
    ],
  })
}
