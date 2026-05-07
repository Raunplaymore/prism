export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, getSessionFromCookie } from '@/lib/auth'
import { extractTag, stripHtml } from '@/lib/rss'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type SourceId = 'arxiv' | 'sciencedaily'

interface SourceField {
  id: string
  emoji: string
  label: string
  rssPath: string
}

interface SourceConfig {
  label: string
  rssBase: string
  fields: SourceField[]
}

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
// Sources
// ────────────────────────────────────────────────────────────

const SOURCES: Record<SourceId, SourceConfig> = {
  arxiv: {
    label: 'arXiv',
    rssBase: 'https://export.arxiv.org/rss/',
    fields: [
      { id: 'astro-ph',      emoji: '🚀', label: '천체물리·우주',     rssPath: 'astro-ph' },
      { id: 'q-bio',         emoji: '🧬', label: '생명공학·생물',     rssPath: 'q-bio' },
      { id: 'quant-ph',      emoji: '⚛️', label: '양자물리',          rssPath: 'quant-ph' },
      { id: 'cs.AI',         emoji: '🤖', label: 'AI·머신러닝',       rssPath: 'cs.AI' },
      { id: 'cs.LG',         emoji: '📚', label: '머신러닝 이론',     rssPath: 'cs.LG' },
      { id: 'cs.CL',         emoji: '💬', label: '자연어처리·LLM',    rssPath: 'cs.CL' },
      { id: 'cond-mat',      emoji: '🧪', label: '응집물질·재료',     rssPath: 'cond-mat' },
      { id: 'physics.ao-ph', emoji: '🌍', label: '지구·대기과학',     rssPath: 'physics.ao-ph' },
      { id: 'q-bio.NC',      emoji: '🧠', label: '신경과학',          rssPath: 'q-bio.NC' },
      { id: 'stat.ML',       emoji: '📊', label: '통계·머신러닝',     rssPath: 'stat.ML' },
      { id: 'math.PR',       emoji: '🔢', label: '확률·수학',         rssPath: 'math.PR' },
      { id: 'cs.RO',         emoji: '🦾', label: '로보틱스',          rssPath: 'cs.RO' },
    ],
  },
  sciencedaily: {
    label: 'ScienceDaily',
    rssBase: 'https://www.sciencedaily.com/rss/',
    fields: [
      { id: 'all',            emoji: '🌐', label: '전체',       rssPath: 'all.xml' },
      { id: 'space_time',     emoji: '🚀', label: '우주·시간', rssPath: 'space_time.xml' },
      { id: 'matter_energy',  emoji: '⚛️', label: '물질·에너지', rssPath: 'matter_energy.xml' },
      { id: 'computers_math', emoji: '🤖', label: '컴퓨터·수학', rssPath: 'computers_math.xml' },
      { id: 'health_medicine',emoji: '💊', label: '건강·의학', rssPath: 'health_medicine.xml' },
      { id: 'mind_brain',     emoji: '🧠', label: '뇌·심리',   rssPath: 'mind_brain.xml' },
      { id: 'plants_animals', emoji: '🌱', label: '식물·동물', rssPath: 'plants_animals.xml' },
      { id: 'earth_climate',  emoji: '🌍', label: '지구·기후', rssPath: 'earth_climate.xml' },
      { id: 'fossils_ruins',  emoji: '🦴', label: '화석·고고학', rssPath: 'fossils_ruins.xml' },
      { id: 'strange_offbeat',emoji: '🎭', label: '특이·유머', rssPath: 'strange_offbeat.xml' },
    ],
  },
}

function fieldLabel(source: SourceId, fieldId: string): string {
  return SOURCES[source]?.fields.find((f) => f.id === fieldId)?.label ?? fieldId
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
// RSS parser (source-agnostic)
// ────────────────────────────────────────────────────────────

function parseRss(xml: string, source: SourceId): ArxivItem[] {
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

    // arXiv: extract numeric id from URL; others: use link itself
    const idMatch = source === 'arxiv' ? link.match(/abs\/([\d.v]+)/) : null
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

async function handleFetch(source: SourceId, field: string): Promise<NextResponse> {
  const cfg = SOURCES[source]
  const fieldDef = cfg.fields.find((f) => f.id === field)
  if (!fieldDef) {
    return NextResponse.json({ error: 'Unknown field' }, { status: 400 })
  }

  const url = cfg.rssBase + fieldDef.rssPath
  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'PrismScienceLab/1.0' },
    })
  } catch (e) {
    return NextResponse.json({ error: `RSS network error: ${e}` }, { status: 502 })
  }

  if (!res.ok) {
    return NextResponse.json({ error: `RSS fetch ${res.status}` }, { status: 502 })
  }

  const xml = await res.text()
  const items = parseRss(xml, source).slice(0, 5)

  if (items.length === 0) {
    return NextResponse.json(
      { error: 'RSS returned no items — feed may be empty or format changed' },
      { status: 502 },
    )
  }

  return NextResponse.json({ items, field, source })
}

// ────────────────────────────────────────────────────────────
// Step: generate
// ────────────────────────────────────────────────────────────

async function handleGenerate(items: ArxivItem[], source: SourceId, field: string): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })
  }

  const fLabel = fieldLabel(source, field)
  // CF Pages function 30s wallclock + ICN→US OpenAI latency 변동성으로
  // 5건 한 번에 처리하면 502 위험. 3건으로 cap. 사용자가 더 보고 싶으면
  // 분야 다시 선택하거나 다음 cycle.
  const capped = items.slice(0, 3)
  const inputs = capped.map((it, i) => ({
    i,
    t: it.title,
    s: it.summary.slice(0, 1500),
  }))

  const sourceHint =
    source === 'sciencedaily'
      ? 'ScienceDaily의 과학 뉴스 기사 (이미 일반 대중 친화적으로 정리됨)'
      : 'arXiv 학술 논문 abstract'

  const systemPrompt = `당신은 한국어 과학 커뮤니케이터입니다. 입력은 ${sourceHint}이며, 분야는 ${fLabel}입니다.

각 입력 항목 i에 대해 다음 JSON 항목을 생성:
{
  "i": <number, 입력 인덱스>,
  "koTitle": "<호기심을 유발하는 한국어 제목, 30자 내외>",
  "koTagline": "<왜 중요한지 한 줄, 50자 내외>",
  "koBody": "<200-300자 한국어 본문, 일반 대중·고등학생도 이해할 수 있는 쉬운 단어, 전문 용어는 풀어 설명, 비유·실생활 연결 OK>"
}

CRITICAL:
- 추측·과장 금지. 원문에 없는 결론·예측·함의 추가 금지.
- 학술적 정확성 유지.
- 본문은 자연스러운 한국어 산문, 단락 1-2개. \\n\\n으로 단락 구분 가능.
- 각 항목 koBody는 독립적으로 읽을 수 있어야 함.

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
        max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(inputs) },
        ],
      }),
      // CF Pages function 30s 한도 안에 끝내기 위한 명시적 timeout
      signal: AbortSignal.timeout(25000),
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

  const merged = capped.map((src, i) => ({
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
  const rawSource = request.nextUrl.searchParams.get('source') ?? 'arxiv'
  if (!(rawSource in SOURCES)) {
    return NextResponse.json({ error: 'Unknown source' }, { status: 400 })
  }
  const source = rawSource as SourceId

  if (step === 'fetch') {
    const field = request.nextUrl.searchParams.get('field') ?? SOURCES[source].fields[0].id
    return handleFetch(source, field)
  }

  if (step === 'generate') {
    const body = (await request.json()) as { items?: ArxivItem[]; field?: string }
    return handleGenerate(body.items ?? [], source, body.field ?? SOURCES[source].fields[0].id)
  }

  return NextResponse.json({ error: 'Unknown step' }, { status: 400 })
}
