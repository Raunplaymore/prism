import type { Metadata } from 'next'
import { getLiveKeywordCounts, type KeywordCount } from '@/lib/keywords/index'
import type { KeywordCategory } from '@/lib/keywords/vocabulary'
import KeywordSphere from '@/components/keyword/KeywordSphere'
import Nav from '@/components/Nav'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '키워드 — Prism',
  description: '지금 우리 사이트에 살아있는 모든 키워드',
}

interface CategoryMeta {
  id: KeywordCategory
  label: string
  emoji: string
}

const CATEGORY_ORDER: CategoryMeta[] = [
  { id: 'person',  label: '인물',     emoji: '👤' },
  { id: 'country', label: '국가·지역', emoji: '🌍' },
  { id: 'org',     label: '조직',     emoji: '🏛' },
  { id: 'company', label: '기업',     emoji: '🏢' },
  { id: 'topic',   label: '토픽',     emoji: '🏷' },
  { id: 'event',   label: '이벤트',   emoji: '📅' },
]

function Chip({ kc }: { kc: KeywordCount }) {
  const display = kc.entry.labelKo || kc.entry.label
  return (
    <a
      href={`/keyword/${encodeURIComponent(kc.entry.slug)}`}
      className="inline-flex items-baseline gap-1.5 rounded-full border border-gray-800 bg-gray-900 px-3 py-1 text-sm text-gray-300 transition hover:border-gray-700 hover:bg-gray-800 hover:text-white"
    >
      <span>{display}</span>
      <span className="text-xs text-gray-500">{kc.count}</span>
    </a>
  )
}

export default async function KeywordIndexPage() {
  const all = await getLiveKeywordCounts()
  const totalArticleHits = all.reduce((sum, kc) => sum + kc.count, 0)

  // Bucket by category (preserve count-desc order within each)
  const byCat = new Map<KeywordCategory, KeywordCount[]>()
  for (const kc of all) {
    const list = byCat.get(kc.entry.category) ?? []
    list.push(kc)
    byCat.set(kc.entry.category, list)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">키워드로 보는 세계 뉴스</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-300">
            Prism은 매일 50여 개국의 현지 언론에서 수집한 기사를 AI가 분류·요약하고,
            인물·국가·조직·기업·토픽·이벤트 6개 분류의 정규화된 키워드로 인덱싱합니다.
            아래 키워드를 누르면 같은 주제를 여러 국가가 어떻게 다루고 있는지 한눈에 비교할 수 있습니다.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            지금 살아있는 키워드 {all.length}개 · 총 {totalArticleHits}건
          </p>
        </div>

        {all.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-800 px-4 py-10 text-center">
            <p className="text-sm text-gray-500">아직 인덱스된 키워드가 없습니다.</p>
            <p className="mt-2 text-xs text-gray-600">
              새 기사가 들어오면 자동으로 표시됩니다.
            </p>
          </div>
        ) : (
          <>
            <div className="relative mb-10 flex h-[190px] items-center justify-center overflow-hidden rounded-2xl border border-gray-900 bg-gradient-to-b from-gray-950 to-gray-900/40 sm:h-[350px] lg:h-[400px]">
              <KeywordSphere items={all} radius={140} />
              <p className="pointer-events-none absolute bottom-3 right-4 text-xs text-gray-600">
                드래그해서 회전 · 클릭해서 들어가기
              </p>
            </div>
            {CATEGORY_ORDER.map((cat) => {
            const items = byCat.get(cat.id) ?? []
            if (items.length === 0) return null
            return (
              <section key={cat.id} className="mb-8">
                <div className="mb-3 flex items-baseline gap-2">
                  <h2 className="text-xl font-semibold">
                    <span className="mr-1.5">{cat.emoji}</span>
                    {cat.label}
                  </h2>
                  <span className="text-sm text-gray-500">{items.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((kc) => (
                    <Chip key={kc.entry.slug} kc={kc} />
                  ))}
                </div>
              </section>
            )
          })}
          </>
        )}
      </div>
    </div>
  )
}
