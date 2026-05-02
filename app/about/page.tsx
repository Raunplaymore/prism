import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import { SUPPORTED_COUNT } from '@/lib/rss'

export const metadata: Metadata = {
  title: 'About — Prism',
  description: `Prism은 AI 기반 세계 뉴스 브리핑 서비스입니다. ${SUPPORTED_COUNT}개국의 뉴스를 한국어로 요약하여 제공합니다.`,
  alternates: { canonical: '/about' },
  robots: { index: true, follow: true },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">About Prism</h1>
        <p className="mb-10 text-sm text-gray-400">
          AI가 정제한 세계 뉴스 — Prism / refracted by AI
        </p>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">서비스 소개</h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-300">
            Prism은 전 세계 {SUPPORTED_COUNT}개국의 주요 뉴스를 AI가 수집, 분류, 요약하여 한국어로 제공하는 뉴스 브리핑 서비스입니다.
            Google News RSS를 통해 각국의 현지 언어 뉴스를 실시간으로 수집하고, OpenAI의 gpt-4o-mini 모델을 활용하여
            정치, 경제, 사회, 기술, 외교, 국방, 환경, 건강, 문화 등 다양한 카테고리로 분류하고 요약합니다.
          </p>
          <p className="text-sm leading-relaxed text-gray-300">
            사용자는 인터랙티브 세계 지도를 통해 관심 국가를 선택하거나, 키워드 클라우드에서 주제별로
            여러 국가의 시각을 비교할 수 있습니다. 기사는 24시간 동안 누적되며, 6시간마다 자동으로 최신 뉴스가 추가됩니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">주요 기능</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- {SUPPORTED_COUNT}개국 뉴스를 한국어로 AI 요약</li>
            <li>- D3.js 기반 인터랙티브 세계 지도</li>
            <li>- 키워드 기반 다국가 비교 — 같은 사건을 여러 국가가 어떻게 다루는지 한눈에</li>
            <li>- 현지 언어로 뉴스 수집 (한국어, 일본어, 중국어, 아랍어, 러시아어 등)</li>
            <li>- 24시간 누적 피드 — 최신 기사가 상단에 추가</li>
            <li>- 기사 공유 기능 (링크 복사 및 공유)</li>
            <li>- 감성 분석 (긍정/중립/부정)</li>
            <li>- 전 국가 무료 접근 (로그인 불필요)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">콘텐츠 제작 방식</h2>
          <p className="mb-3 text-sm leading-relaxed text-gray-300">
            Prism은 단순한 기사 모음이 아닙니다. 각 기사에 대해 다음 단계의 처리를 거쳐 독자적인 한국어 브리핑을 만듭니다.
          </p>
          <ol className="space-y-2 text-sm text-gray-300">
            <li>1. <span className="text-white">수집</span> — 각국 Google News RSS에서 현지 언어 원문 수집</li>
            <li>2. <span className="text-white">분류</span> — gpt-4o-mini가 정치/경제/사회/기술 등 9개 카테고리로 분류</li>
            <li>3. <span className="text-white">요약 및 번역</span> — 한국어 제목, 2–3문장 요약, 상세 본문(150–250자)을 생성</li>
            <li>4. <span className="text-white">키워드 추출</span> — 약 65개의 큐레이션된 어휘 사전에 매칭하여 정규화</li>
            <li>5. <span className="text-white">감성 분석</span> — 긍정/중립/부정 라벨링</li>
          </ol>
          <p className="mt-3 text-sm leading-relaxed text-gray-300">
            결과 화면에는 원문 출처와 &quot;원문 보기&quot; 링크가 항상 함께 표기됩니다. 단순 자동 스크래핑 사이트가 되지 않도록
            기사 단위로 사람이 읽을 수 있는 한국어 콘텐츠를 생성하는 것이 핵심입니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">기술 스택</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- Next.js 14 (App Router) + TypeScript</li>
            <li>- Cloudflare Pages (Edge Runtime)</li>
            <li>- OpenAI gpt-4o-mini (뉴스 분류 및 요약)</li>
            <li>- Upstash Redis (캐시 및 피드 저장)</li>
            <li>- D3.js + TopoJSON (세계 지도)</li>
            <li>- Google OAuth (인증)</li>
            <li>- Telegram Bot (관리자 알림)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">지원 국가 ({SUPPORTED_COUNT}개국)</h2>
          <p className="text-sm leading-relaxed text-gray-300">
            한국, 일본, 중국, 대만, 몽골, 북한, 미국, 캐나다, 브라질, 멕시코, 아르헨티나, 콜롬비아, 베네수엘라, 쿠바,
            영국, 프랑스, 독일, 이탈리아, 스페인, 포르투갈, 네덜란드, 폴란드, 스웨덴, 노르웨이, 그리스,
            러시아, 우크라이나, 벨라루스, 카자흐스탄, 조지아,
            이스라엘, 이란, 사우디아라비아, 이집트, 이라크, 시리아, 레바논, 아랍에미리트, 튀르키예,
            인도, 파키스탄, 방글라데시, 태국, 베트남, 인도네시아, 필리핀, 미얀마, 캄보디아,
            호주, 뉴질랜드, 남아프리카공화국, 나이지리아, 케냐, 에티오피아
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">광고 및 콘텐츠 정책</h2>
          <p className="mb-3 text-sm leading-relaxed text-gray-300">
            Prism은 운영 비용 일부를 Google AdSense를 통한 광고로 충당합니다. 다음 원칙을 지킵니다.
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- 광고 영역은 콘텐츠 영역과 명확히 구분되며, 기사처럼 보이도록 위장하지 않습니다.</li>
            <li>- 성인, 도박, 폭력 등 Google 출판사 정책에 위배되는 콘텐츠를 게시하지 않습니다.</li>
            <li>- AI가 생성한 요약본임을 명시하며, 원문 출처와 링크를 항상 함께 제공합니다.</li>
            <li>- 사용자의 개인 식별 정보를 광고주에게 직접 판매하지 않습니다.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">면책 조항</h2>
          <p className="text-sm leading-relaxed text-gray-300">
            Prism에서 제공하는 뉴스 요약은 AI가 생성한 것으로, 정확성을 보장하지 않습니다.
            정확한 정보는 원문 기사를 참고해 주세요. 각 기사 하단의 &quot;원문 보기&quot; 링크를 통해 원본 기사를 확인할 수 있습니다.
            번역 및 요약 과정에서 원문의 뉘앙스가 일부 손실될 수 있습니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">문의</h2>
          <p className="mb-2 text-sm leading-relaxed text-gray-300">
            서비스 관련 문의, 오탈자/오역 제보, 광고 정책 관련 의견은 아래 이메일로 연락 주세요.
          </p>
          <p className="text-sm text-gray-300">
            이메일:{' '}
            <a
              href="mailto:ray.er@kakaocorp.com"
              className="text-blue-400 underline-offset-2 hover:underline"
            >
              ray.er@kakaocorp.com
            </a>
          </p>
          <p className="mt-3 text-sm text-gray-400">
            관련 문서: <a href="/privacy" className="text-blue-400 hover:underline">개인정보 처리방침</a>
          </p>
        </section>

        <div className="mt-12 text-center">
          <a href="/" className="text-sm text-blue-400 hover:text-blue-300">← Back to Prism</a>
        </div>
      </div>
    </div>
  )
}
