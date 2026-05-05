# Project Instructions

<!-- pmpt-index -->
See `.pmpt/index.md` for project context. Single source of truth: `.pmpt/docs/pmpt.md`.
<!-- /pmpt-index -->

<!-- pmpt -->
## pmpt MCP Tools

This project uses [pmpt](https://pmptwiki.com) to track development progress.

**If pmpt MCP is available in this session**, use these tools proactively — do not wait for the user to ask:
- `mcp__pmpt__pmpt_save` — save a snapshot after milestones (always include a `summary`)
- `mcp__pmpt__pmpt_status` — check project status
- `mcp__pmpt__pmpt_read_context` — read project context at session start

Save after: feature completion, architecture decisions, bug fixes, or any significant progress.

If pmpt MCP is not available, run `pmpt save` in terminal instead.
<!-- /pmpt -->

## Branch / deploy workflow (required)

prism은 **Cloudflare Pages**로 배포된다.
- `main` = production (prismglobe.com)
- `dev` = preview (CF Pages auto preview URL)
- Upstash Redis는 production·preview 공유

**작업 분기 룰:**
1. **작은 fix (1-2 file, low-risk)** — copy 변경, 오타, 1줄 fix 등은 `main` 직접 push OK.
2. **위험·실험·다파일·디자인 리워크·데이터 파이프라인 변경** — 반드시 `dev` 브랜치에서 작업:
   - `git checkout dev` → 작업 → commit → `git push origin dev`
   - CF Pages가 dev preview URL에 자동 배포
   - 사용자가 preview URL에서 검증
   - 검증 OK → PR (`gh pr create --base main --head dev`) → 사용자 승인 → `gh pr merge <PR> --merge`
3. **destructive 액션 차단**: cache mutation, LLM 호출 endpoint는 `lib/env.ts`의 `isProductionRuntime()` guard로 main에서만 동작. 새 destructive route 추가 시 같은 guard 박는 게 default.
4. **자동 merge 금지**: 사용자가 명시 승인할 때만 PR merge. CF Pages가 main 빌드 → production 자동 배포까지가 한 사이클.

애매하면 dev 거치는 쪽으로 기운다. AdSense 트래픽이 메인 수익이라 prod 깨지면 회복 lag 큼.

<!-- MY-AGENT-CREWS-START -->
## My Agent Crews Routing (required)

`.claude/crews-routing.md`가 존재하면 **세션에서 첫 번째 요청을 받는 즉시 이 파일을
Read 도구로 읽어라**. Read 전에는 어떤 코드 변경이나 에이전트 호출도 하지 않는다.

- "간단한 수정이니 건너뛰어도 되겠지"라는 자기 판단 금지
- "어차피 별 내용 없겠지"라는 추측 금지
- 이미 설치된 프로젝트에서 Read를 건너뛰는 것은 **프로젝트 규칙 위반**이다

crews-routing.md는 이 프로젝트의 에이전트 라우팅/Quick Plan/small fix 규칙을
정의한다. Read 없이는 규칙을 알 수 없으므로 반드시 먼저 읽는다.

파일이 없으면 이 섹션 전체를 무시하고 기본 동작 — my-agent-crews 미설치 환경에서는 정상.

> 설치 방법: <repo-url>
<!-- MY-AGENT-CREWS-END -->
