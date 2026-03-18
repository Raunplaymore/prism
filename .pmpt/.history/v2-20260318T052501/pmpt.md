# Prism

## Product Idea
인터랙티브 세계 지도 기반 AI 뉴스 브리핑 서비스. 사용자가 지도에서 국가를 클릭하면 AI가 해당 국가의 사회·경제·스포츠 뉴스를 실시간 검색·요약하고, 다양한 언론 시각(Prism 다시각 뷰)을 함께 제공합니다.

## Additional Context
Claude API의 web_search 툴을 활용한 Agentic Loop 처리로 최신 뉴스를 검색합니다. Redis(Upstash) 캐시로 인기 국가 히트율 90% 이상을 목표로 하며, Free/Pro/Team 3단계 플랜으로 페이월을 운영합니다. AI 생성 요약만 표시하고 원문 링크를 필수 포함하여 저작권 문제를 회피합니다.

## Features
- [ ] D3.js + TopoJSON 세계 지도(국가 클릭
- [ ] 호버 툴팁
- [ ] 히트맵)
- [ ] Claude API 연동 국가별 3카테고리(Society
- [ ] Economy
- [ ] Sports) 뉴스 브리핑
- [ ] Redis 캐시 레이어(TTL 1시간/5분)
- [ ] Prism 다시각 뷰(US/EU/Arab/Asian Media 시각 비교)
- [ ] Free 플랜 일일 5클릭 제한 및 페이월 모달
- [ ] Supabase Auth + Stripe 결제
- [ ] 모바일 반응형
- [ ] 원문 링크 제공

## Tech Stack
Next.js 14 (App Router); D3.js + TopoJSON; Tailwind CSS; Claude API (Sonnet) with web_search; Redis (Upstash); Supabase Auth + Stripe; Vercel; Sentry + Vercel Analytics

## Architecture
<!-- High-level structure. Update as it evolves. -->
<!-- Example: "Next.js frontend → Express API → PostgreSQL" -->

## Active Work
<!-- What's currently being built. Clear when done, move to Snapshot Log. -->

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

## Decisions
<!-- WHY, not just WHAT. Include what led to the decision. -->
<!-- Format: - [Decision] → [Reason / data that led to it] -->

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
