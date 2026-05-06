export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, getSessionFromCookie } from '@/lib/auth'
import { extractTag, stripHtml } from '@/lib/rss'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface ArxivItem {
  id: string
  title: string
  summary: string
  published: string
  link: string
  authors: string[]
}

interface LlmOutput {
  i: number
  koTitle: string
  koTagline: string
  koBody: string
}

// ────────────────────────────────────────────────────────────
// Field labels (mirrors page.tsx FIELDS)
// ────────────────────────────────────────────────────────────

const FIELDS_LABEL: Record<string, string> = {
  'astro-ph':      '천체물리·우주',
  'q-bio':         '생명공학·생물',
  'quant-ph':      '양자물리·양자정보',
  'cs.AI':         'AI·머신러닝',
  'cs.LG':         '머신러닝 이론',
  'cs.CL':         '자연어처리·LLM',
  'cond-mat':      '응집물질·재료',
  'physics.ao-ph': '지구·대기과학',
  'q-bio.NC':      '신경과학',
  'stat.ML':       '통계·머신러닝',
  'math.PR':       '확률·수학',
  'cs.RO':         '로보틱스',
}

// ────────────────────────────────────────────────────────────
// Auth helper
// ────────────────────────────────────────────────────────────

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const token = getSessionFromCookie(request.headers.get('cookie'))
  if (token) {
    const user = await verifySessionToken(token)
    if (user?.isAdmin) return true
  }
  const secret = process.env.ADMIN_SECRET
  if (secret && request.headers.get('x-admin-secret') === secret) return true
  return false
}

// ────────────────────────────────────────────────────────────
// arXiv RSS parser
// ────────────────────────────────────────────────────────────

function parseArxivRss(xml: string): ArxivItem[] {
  const items: ArxivItem[] = []
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null

  while ((m = itemRegex.exec(xml)) !== null) {
    const inner = m[1]
    const title = stripHtml(extractTag(inner, 'title'))
    const link = stripHtml(extractTag(inner, 'link'))
    const description = stripHtml(extractTag(inner, 'description'))
    const pubDate = stripHtml(extractTag(inner, 'pubDate'))
    const dcCreator = stripHtml(extractTag(inner, 'dc:creator')) || ''

    if (!title || !link) continue

    const idMatch = link.match(/abs\/([\d.v]+)/)
    items.push({
      id: idMatch ? idMatch[1] : link,
      title,
      summary: description,
      published: pubDate,
      link,
      authors: dcCreator
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
  }
  return items
}

// ────────────────────────────────────────────────────────────
// Step: fetch
// ────────────────────────────────────────────────────────────

async function handleFetch(field: string): Promise<NextResponse> {
  const url = `https://export.arxiv.org/rss/${field}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'PrismScienceLab/1.0' },
    })
  } catch (e) {
    return NextResponse.json({ error: `arXiv network error: ${e}` }, { status: 502 })
  }

  if (!res.ok) {
    return NextResponse.json({ error: `arXiv fetch ${res.status}` }, { status: 502 })
  }

  const xml = await res.text()
  const items = parseArxivRss(xml).slice(0, 5)

  if (items.length === 0) {
    return NextResponse.json({ error: 'arXiv RSS returned no items — feed may be empty or format changed' }, { status: 502 })
  }

  return NextResponse.json({ items, field })
}

// ────────────────────────────────────────────────────────────
// Step: generate
// ────────────────────────────────────────────────────────────

async function handleGenerate(items: ArxivItem[], field: string): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })
  }

  const fieldLabel = FIELDS_LABEL[field] ?? field
  const inputs = items.map((it, i) => ({
    i,
    t: it.title,
    s: it.summary.slice(0, 1500),
  }))

  const systemPrompt = `당신은 한국어 과학 커뮤니케이터입니다. arXiv 논문 abstract를 일반 대중과 학생이 이해할 수 있는 한국어 교육 콘텐츠로 다듬어주세요. 분야: ${fieldLabel}.

각 입력 (배열) 항목 i에 대해 다음 JSON 항목을 생성:
{
  "i": <number, 입력 인덱스>,
  "koTitle": "<호기심을 유발하는 한국어 제목, 30자 내외>",
  "koTagline": "<왜 중요한지 한 줄, 50자 내외>",
  "koBody": "<200-300자 한국어 본문, 쉬운 단어 사용, 전문 용어는 풀어 설명, 실생활/응용 연결, 비유 사용 OK>"
}

CRITICAL:
- 추측·과장 금지. 원문에 없는 결론·예측·함의 추가 금지.
- 학술적 정확성 유지. 모르는 건 모른다고 두기.
- 본문은 자연스러운 한국어 산문, 단락 1-2개. \\n\\n으로 단락 구분 가능.
- 각 항목 koBody는 독립적으로 읽을 수 있어야 함 (다른 항목 참조 X).

응답 JSON: {"items": [...]}`

  let llmRes: Response
  try {
    llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(inputs) },
        ],
      }),
    })
  } catch (e) {
    return NextResponse.json({ error: `OpenAI network error: ${e}` }, { status: 502 })
  }

  if (!llmRes.ok) {
    const e = await llmRes.text()
    return NextResponse.json({ error: `OpenAI ${llmRes.status}: ${e}` }, { status: 502 })
  }

  const data = await llmRes.json()
  const content: string | undefined = data.choices?.[0]?.message?.content
  if (!content) {
    return NextResponse.json({ error: 'empty LLM response' }, { status: 502 })
  }

  let parsed: { items?: LlmOutput[] }
  try {
    parsed = JSON.parse(content)
  } catch {
    return NextResponse.json({ error: 'LLM response is not valid JSON' }, { status: 502 })
  }

  const eduMap = new Map<number, { koTitle: string; koTagline: string; koBody: string }>()
  for (const it of parsed.items ?? []) {
    if (typeof it.i === 'number') {
      eduMap.set(it.i, {
        koTitle: it.koTitle ?? '',
        koTagline: it.koTagline ?? '',
        koBody: it.koBody ?? '',
      })
    }
  }

  const merged = items.map((src, i) => ({
    ...src,
    ...(eduMap.get(i) ?? { koTitle: '', koTagline: '', koBody: '' }),
  }))

  return NextResponse.json({ items: merged })
}

// ────────────────────────────────────────────────────────────
// Route handler
// ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const step = request.nextUrl.searchParams.get('step')

  if (step === 'fetch') {
    const field = request.nextUrl.searchParams.get('field') ?? 'cs.AI'
    return handleFetch(field)
  }

  if (step === 'generate') {
    const body = await request.json() as { items?: ArxivItem[]; field?: string }
    return handleGenerate(body.items ?? [], body.field ?? 'cs.AI')
  }

  return NextResponse.json({ error: 'Unknown step' }, { status: 400 })
}
