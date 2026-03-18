<!-- This file is for AI tools only. Do not edit manually. -->
<!-- Paste this into Claude Code, Codex, Cursor, or any AI coding tool. -->

# Prism — Product Development Request

## What I Want to Build
인터랙티브 세계 지도 기반 AI 뉴스 브리핑 서비스. 사용자가 지도에서 국가를 클릭하면 AI가 해당 국가의 사회·경제·스포츠 뉴스를 실시간 검색·요약하고, 다양한 언론 시각(Prism 다시각 뷰)을 함께 제공합니다.

## Additional Context
Claude API의 web_search 툴을 활용한 Agentic Loop 처리로 최신 뉴스를 검색합니다. Redis(Upstash) 캐시로 인기 국가 히트율 90% 이상을 목표로 하며, Free/Pro/Team 3단계 플랜으로 페이월을 운영합니다. AI 생성 요약만 표시하고 원문 링크를 필수 포함하여 저작권 문제를 회피합니다.

## Key Features
- D3.js + TopoJSON 세계 지도(국가 클릭
- 호버 툴팁
- 히트맵)
- Claude API 연동 국가별 3카테고리(Society
- Economy
- Sports) 뉴스 브리핑
- Redis 캐시 레이어(TTL 1시간/5분)
- Prism 다시각 뷰(US/EU/Arab/Asian Media 시각 비교)
- Free 플랜 일일 5클릭 제한 및 페이월 모달
- Supabase Auth + Stripe 결제
- 모바일 반응형
- 원문 링크 제공

## Tech Stack Preferences
Next.js 14 (App Router); D3.js + TopoJSON; Tailwind CSS; Claude API (Sonnet) with web_search; Redis (Upstash); Supabase Auth + Stripe; Vercel; Sentry + Vercel Analytics

---

Please help me build this product based on the requirements above.

1. First, review the requirements and ask if anything is unclear.
2. Propose a technical architecture.
3. Outline the implementation steps.
4. Start coding from the first step.

I'll confirm progress at each step before moving to the next.

## Documentation Rule

**Important:** When you make progress, update `.pmpt/docs/pmpt.md` (the human-facing project document) at these moments:
- When architecture or tech decisions are finalized
- When a feature is implemented (mark as done)
- When a development phase is completed
- When requirements change or new decisions are made

Keep the Progress and Snapshot Log sections in pmpt.md up to date.
After significant milestones, save a snapshot using the method below.

### Saving Snapshots

**Always save proactively after milestones — do not wait for the user to ask.**

Try the pmpt MCP tool first:
- Claude Code: call `mcp__pmpt__pmpt_save` with a descriptive `summary`
- Other MCP clients: call `pmpt_save` with a descriptive `summary`

If no MCP tool is available, run `pmpt save` in the terminal.

### Per-Feature Checklist
After completing each feature above:
1. Mark the feature done in `.pmpt/docs/pmpt.md` (change `- [ ]` to `- [x]`)
2. Add a brief note to the Snapshot Log section
3. Call `mcp__pmpt__pmpt_save` (or `pmpt save` in terminal) with a summary

### What to Record in pmpt.md

pmpt.md is the **single source of truth** for this project. AI tools read it to understand context before every session. Keep it accurate.

**## Architecture** — High-level structure. Update when the architecture changes.
- Example: `Next.js (SSG) → Cloudflare Workers API → D1 database`
- Include the WHY if the stack choice was non-obvious

**## Active Work** — What's currently being built. One or two items max.
- Clear this section when done, then move to Snapshot Log
- Example: `- Implementing user auth (started 2025-03-17)`

**## Decisions** — Record WHY, not just WHAT. Include what led to the decision.
- Bad: "Switched to SQLite"
- Good: "Switched SQLite → Postgres: deploy target moved to serverless, needed connection pooling"

**## Constraints** — Platform or library limitations discovered during development.
- Format: `- [Platform/Tool]: what doesn't work → workaround used`
- Example: `- Cloudflare Workers: no native fs access → use KV for file storage`

**## Lessons** — Anti-patterns and "tried X, broke because Y" discoveries.
- Format: `- [What failed] → [Root cause] → [Fix applied]`
- Example: `- JWT refresh on mobile broke → tokens expired before retry → added sliding expiry`
