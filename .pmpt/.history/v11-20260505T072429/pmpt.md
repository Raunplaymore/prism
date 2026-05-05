# Prism

## Product Idea
인터랙티브 세계 지도와 키워드 클라우드 기반 AI 뉴스 브리핑 서비스. 사용자가 지도에서 국가를 클릭하거나 키워드를 선택하면 AI가 50여 개국 현지 언론에서 수집한 뉴스를 한국어로 요약하여 제공합니다.

## Additional Context
주요 뉴스 매체의 RSS 피드를 직접 파싱하여 뉴스를 무료로 수집하고, OpenAI API(gpt-4o-mini)로 번역/요약만 수행하여 토큰 비용을 최소화합니다. Redis(Upstash) 캐시로 인기 국가 히트율 90% 이상을 목표로 하며, 광고(Google AdSense) 단일 수익 모델로 운영합니다. AI 생성 요약만 표시하고 원문 링크를 필수 포함하여 저작권 문제를 회피합니다.

## Features
- [ ] D3.js + TopoJSON 세계 지도(국가 클릭
- [ ] 호버 툴팁
- [ ] 히트맵)
- [ ] OpenAI API 연동 국가별 3카테고리(Society
- [ ] Economy
- [ ] Sports) 뉴스 브리핑
- [ ] Redis 캐시 레이어(TTL 1시간/5분)
- [ ] 모바일 반응형
- [ ] 원문 링크 제공

## Tech Stack
Next.js 14 (App Router); D3.js + TopoJSON; Tailwind CSS; Google News RSS + OpenAI gpt-4o-mini 번역/요약; Redis (Upstash); Cloudflare Pages (Edge Runtime)

## Architecture
Next.js 14 Frontend (D3.js 지도) → Next.js API Routes → RSS 피드 파싱 → OpenAI 번역/요약 → Upstash Redis 캐시
- 프론트엔드: D3.js + TopoJSON 세계 지도, 다크 테마
- API: `/api/news?country={code}` — Redis 캐시 확인 → 미스 시 RSS 수집 + AI 요약 → 캐시 저장
- 뉴스 수집: 국가별 주요 매체 RSS 피드 직접 파싱 (무료, 안정적)
  - 글로벌: Reuters, BBC, Al Jazeera
  - 아시아: NHK, 연합뉴스, CNA
  - 유럽: DW, France24
  - 미주: AP News
- AI: OpenAI gpt-4o-mini — 번역/요약/카테고리 분류만 수행 (토큰 최소화)
- 캐시: Upstash Redis, 뉴스 TTL 4시간, 사용량 TTL 24시간
- 사용량 제한: IP 기반 일일 쿼터(20회/IP) — OpenAI 비용 보호용 (사용자 식별·플랜과 무관)

## Active Work
- 백엔드 API 구현 (lib/cache.ts, lib/rss.ts, lib/news.ts, app/api/news/route.ts)

## Progress
- [ ] Project setup
- [ ] Core features implementation
- [ ] Testing & polish

## Snapshot Log
### v1 — Initial Setup
- Project initialized with pmpt

### v2 — 2026-03-18
- Prism 프로젝트 전체 시스템 구성 계획 수립 완료
- 세계지도(D3.js + TopoJSON 5개 서브컴포넌트, 임페러티브 렌더링), DB/캐시(MVP는 Upstash Redis만 사용, Supabase 없이 쿠키 기반 제한), 백엔드(Claude API Agentic Loop + edge runtime API Routes 6개 lib 모듈) 3개 영역의 아키텍처를 설계했다
- 비용 최적화를 핵심으로 캐시 TTL 4시간 연장, 인기 국가 10개 사전 캐싱, 3카테고리 일괄 요청으로 AI 비용 75% 절감 전략을 수립
- 배포는 Cloudflare Pages(이미 보유, 대역폭 무제한, 30초 타임아웃)로 결정하여 월 고정비 $0, AI 호출료만 ~$30-90/월 구조를 달성
- 하네스 팀(map-specialist, ai-backend, code-reviewer) 3개 에이전트와 4개 스킬도 구성 완료

### v3 — 2026-03-18
- Implemented all D3.js world map components and UI panels for the Prism interactive news map
- Created 11 files total: lib utilities (countryCodeMap with ~195 ISO numeric-to-alpha2 mappings, geoNaturalEarth1 projection factory, d3.scaleSequential color scale), map components (MapSVG with imperative D3 rendering, d3-zoom, ResizeObserver, TopoJSON fetching, and country click/hover handlers; CountryTooltip, MapControls with zoom buttons, MapLegend with gradient bar, WorldMap orchestrator), and UI components (NewsPanel with slide-in animation and category tabs, NewsCard with sentiment badges, PaywallModal with upgrade CTA)
- All components use dark theme Tailwind styling, are marked 'use client', and pass TypeScript type-checking with zero errors

### v4 — 2026-03-18
- 백엔드 API 전체 구현 완료
- 아키텍처를 Claude API web_search에서 RSS 피드 파싱 + OpenAI 번역/요약 방식으로 전환하여 비용을 대폭 절감했다
- lib/rss.ts에 국가별 주요 매체(Reuters, BBC, NHK, 연합뉴스, Al Jazeera 등) RSS 피드 파싱 로직을 구현하고, lib/news.ts에서 OpenAI gpt-4o-mini로 카테고리 분류(Society/Economy/Sports) 및 요약만 수행하도록 설계했다
- lib/cache.ts에 Upstash Redis 캐시(뉴스 TTL 4시간, 사용량 TTL 24시간)와 IP 기반 일일 사용량 추적을 구현했으며, app/api/news/route.ts에서 캐시 확인 → RSS 수집 → AI 요약 → 캐시 저장 파이프라인을 완성했다
- TypeScript 컴파일과 Next.js 빌드 모두 에러 없이 통과

### v5 — 2026-03-18
- 뉴스 소스를 국가별 RSS 피드 + OpenAI web_search 하이브리드에서 Google News RSS 단일 소스로 전면 전환했다
- Google News RSS는 무료이고 API 키 불필요하며 전 세계 모든 국가를 커버한다
- 기존 COUNTRY_FEEDS 11개국 하드코딩과 web_search 폴백 코드를 모두 제거하고, 국가명 기반 Google News 검색 URL 하나로 통일했다
- AI는 OpenAI gpt-4o-mini로 카테고리 분류와 요약만 수행하여 호출당 ~$0.0003으로 비용을 최소화했다
- 또한 스포츠 카테고리를 제거하여 Society/Economy 2개 탭으로 변경하고, 토큰 사용량 추적 시스템(Redis 누적 통계 + 호출별 로그)과 어드민 대시보드를 추가했다

### v6 — 2026-03-18
- Prism 프로젝트 v5 이후 안정화 스냅샷
- 세계 지도(D3.js + TopoJSON) 프론트엔드, Google News RSS 기반 뉴스 수집, OpenAI gpt-4o-mini 번역/요약, Upstash Redis 캐시(TTL 4시간), IP 기반 일일 사용량 제한, 토큰 사용량 추적 및 어드민 대시보드까지 전체 MVP 파이프라인이 구현된 상태
- Society/Economy 2카테고리 뉴스 브리핑과 countries.ts 국가 매핑, errors.ts 에러 핸들링 등 유틸리티 모듈도 정비 완료

### v7 — 2026-03-18
- Prism v1 개발 진행 중 — 뉴스 API 캐시 레이어, 관리자 페이지, 지도 컴포넌트 등 다수의 파일이 수정된 상태
- NewsPanel 컴포넌트를 제거하고 NewsStand로 통합하는 리팩토링 진행
- .npmrc 추가 및 scripts 디렉토리 신규 생성으로 빌드/배포 자동화 기반 마련
- 캐시 관리 API와 통계 API 엔드포인트 업데이트 완료

### v8 — 2026-03-21
- Prism v4 안정화 및 유지보수 단계
- prismglobe.com 도메인 기반 카테고리별 뉴스 브리핑 서비스가 운영 중이며, Claude API 연동 agentic loop, Redis 캐시 레이어, D3.js 세계 지도 인터랙션, RSS 피드 등 핵심 기능이 안정적으로 동작하고 있다
- 최근에는 502 타임아웃 방지를 위한 API 속도 최적화, 캐시 워밍 스케줄 조정(KST 00/06/12/18 4회), RSS 제한 30건 확대, Refresh Pinned 버튼 UX 개선 등 운영 품질 향상 작업을 진행했다

### v9 — 2026-03-23
- Prism v4 안정화 및 운영 품질 향상 단계 기록
- prismglobe.com 도메인 기반 카테고리별 뉴스 브리핑 서비스가 안정적으로 운영 중이며, Claude API agentic loop, Redis 캐시 레이어, D3.js 세계 지도, RSS 피드 등 핵심 기능이 모두 정상 동작하고 있다
- 최근 502 타임아웃 방지를 위한 API 속도 최적화, 캐시 워밍 스케줄을 KST 06/12/18 3회로 조정, Telegram 알림 연동, RSS 제한 30건 확대, Refresh Pinned 버튼 UX 개선 등 운영 안정성과 사용자 경험 향상 작업을 진행했다
- CI/CD 파이프라인에 GitHub Actions 기반 캐시 워밍 자동화와 Telegram 노티피케이션이 추가되어 운영 모니터링 체계가 강화되었다

### v10 — 2026-05-03
- v9 이후 큰 폭의 방향 정렬과 인프라 강화
- 2026-05-01 결정으로 USP를 "다국가 뉴스 탐험"으로 좁히고 다시각 뷰·markets v2·Pro/Stripe 흔적을 모두 폐기하면서 광고 단일 수익 모델로 정합
- 정보 아키텍처를 3-surface(Categories / Keywords / Global Map)로 재구성해 BottomNav 3-tab + 인덱스 sphere + 상세 hub(평탄 latest list + country chip filter) 흐름으로 일관화했고, 홈은 /category로 redirect되어 진입 즉시 가장 활발한 분야의 articles preview를 노출
- 운영 인프라로 Cloudflare Pages 자동 배포(GitHub Actions + dev branch staging-first), 글로벌 ScrollToTop·InstallButton(portal modal) 컴포넌트, IP 쿼터 기반 OpenAI 비용 보호, fire-and-forget 회귀 hotfix(`await indexBatch`) 등을 갖춤
- SEO 측면에선 동적 sitemap(65 entries), metadataBase + canonical + Twitter card + 페이지별 og:image, BreadcrumbList/WebSite/Organization/ItemList JSON-LD까지 P0/P1 모두 적용
- 측정 인프라로 GA4(G-8BFTN9EE24)와 Search Console 등록 완료
- 결정론적 메타데이터 집계 기반의 KeywordSynthesis/CategorySynthesis로 추가 LLM 호출 0 유지하며 hub 페이지 컨텐츠 풍부화
- 코드베이스 정리(dead code -180줄, util 통합, @upstash/redis 의존성 제거)와 sphere 앞쪽 반구만 클릭 가능 fix(스케일 기반 pointer-events 토글)도 포함

### v10 - Progress
- LLM 프롬프트의 detail 필드 룰 완화: 5-7개 문단(단문) → 3개 문단(2-3문장 자연스러운 흐름)
- 한국어 특성상 과도하게 토막난 구조로 인한 글흐름 끊김 해결
- 파라미터 구조(paragraph 1-3: 배경·이해관계자·파급영향) 명확화, "Do not output paragraph numbers or labels" 추가하여 mini가 라벨 생성 금지

### v11 — 2026-05-05
- LLM 프롬프트의 detail 필드 규칙을 완전히 완화했다
- 기존의 강제 3문단 구조(배경·이해관계자·파급영향)와 "요약과 중복 금지"라는 비중복 룰을 모두 제거하고, 원문(description)에만 기반한 자연스러운 2-4 문장 요약으로 변경했다
- 핵심은 정보 풍성도(depth)보다 신뢰성(faithfulness) 우선이라는 결정으로, 사용자 피드백 "Prism이 기사를 왜곡할 수 있다"는 지적을 반영했다
- 프롬프트에 "CRITICAL: 입력에 없는 배경·파급·예측·분석을 추가하지 말 것" 명시와 "짧은 정보 + 짧은 detail은 OK" 룰을 추가하여 hallucination risk를 명확히 제거했다

## Decisions
- Claude API → RSS + OpenAI 전환 → RSS 피드로 무료 뉴스 수집, OpenAI는 번역/요약만 수행하여 토큰 비용 최소화. web_search 불필요
- MVP에서 Supabase Auth 제외 → Redis IP 기반 사용량 추적으로 단순화
- 다시각 뷰 폐기 (2026-05-01) → 미구현 6주+ 방치 + PMF는 다국가 커버리지(85+개국)에 집중. .claude memory의 project_direction.md 참조.
- 광고 단일 수익 모델 (2026-05-01) → Pro/Team/Stripe 미도입. 비용 보호는 IP 쿼터 + 캐시. project_direction.md 참조.

## Constraints
<!-- Platform or library limitations discovered during development. -->
<!-- Format: - [Platform/Tool]: what doesn't work → workaround used -->

## Lessons
<!-- Anti-patterns and "tried X, broke because Y" discoveries. -->
<!-- Format: - [What failed] → [Root cause] → [Fix applied] -->

---
*This document is the single source of truth for this project.*
*AI tools read this to understand context, constraints, and current state.*
*AI instructions are in `pmpt.ai.md` — paste that into your AI tool to get started.*
