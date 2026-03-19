import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Prism',
  description: 'Prism은 AI 기반 세계 뉴스 브리핑 서비스입니다. 51개국의 뉴스를 한국어로 요약하여 제공합니다.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-2xl font-bold">About Prism</h1>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">서비스 소개</h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-300">
            Prism은 전 세계 51개국의 주요 뉴스를 AI가 수집, 분류, 요약하여 한국어로 제공하는 뉴스 브리핑 서비스입니다.
            Google News RSS를 통해 각국의 현지 언어 뉴스를 실시간으로 수집하고, OpenAI의 gpt-4o-mini 모델을 활용하여
            정치, 경제, 사회, 기술, 외교, 국방, 환경, 건강, 문화 등 다양한 카테고리로 분류하고 요약합니다.
          </p>
          <p className="text-sm leading-relaxed text-gray-300">
            사용자는 인터랙티브 세계 지도를 통해 관심 국가를 선택하거나, Quick Access와 Hot Zones에서
            주요 국가의 뉴스를 빠르게 확인할 수 있습니다. 기사는 24시간 동안 누적되며, 6시간마다 자동으로 최신 뉴스가 추가됩니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-blue-400">주요 기능</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>- 51개국 뉴스를 한국어로 AI 요약</li>
            <li>- D3.js 기반 인터랙티브 세계 지도</li>
            <li>- 현지 언어로 뉴스 수집 (한국어, 일본어, 중국어, 아랍어, 러시아어 등)</li>
            <li>- 24시간 누적 피드 — 최신 기사가 상단에 추가</li>
            <li>- 기사 공유 기능 (링크 복사 및 공유)</li>
            <li>- 감성 분석 (긍정/중립/부정)</li>
            <li>- Google 계정 로그인으로 전체 국가 접근</li>
          </ul>
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
          <h2 className="mb-3 text-lg font-semibold text-blue-400">지원 국가 (51개국)</h2>
          <p className="text-sm leading-relaxed text-gray-300">
            한국, 일본, 중국, 대만, 몽골, 북한, 미국, 캐나다, 브라질, 멕시코, 아르헨티나, 콜롬비아, 베네수엘라, 쿠바,
            영국, 프랑스, 독일, 이탈리아, 스페인, 포르투갈, 네덜란드, 폴란드, 스웨덴, 노르웨이, 그리스,
            러시아, 우크라이나, 벨라루스, 카자흐스탄, 조지아,
            이스라엘, 이란, 사우디아라비아, 이집트, 이라크, 시리아, 레바논, 아랍에미리트, 튀르키예,
            인도, 파키스탄, 방글라데시, 태국, 베트남, 인도네시아, 필리핀, 미얀마, 캄보디아,
            호주, 뉴질랜드, 남아프리카공화국, 나이지리아, 케냐, 에티오피아
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-blue-400">면책 조항</h2>
          <p className="text-sm leading-relaxed text-gray-300">
            Prism에서 제공하는 뉴스 요약은 AI가 생성한 것으로, 정확성을 보장하지 않습니다.
            정확한 정보는 원문 기사를 참고해 주세요. 각 기사 하단의 &quot;Read original&quot; 링크를 통해 원본 기사를 확인할 수 있습니다.
          </p>
        </section>

        <div className="mt-12 text-center">
          <a href="/" className="text-sm text-blue-400 hover:text-blue-300">← Back to Prism</a>
        </div>
      </div>
    </div>
  )
}
