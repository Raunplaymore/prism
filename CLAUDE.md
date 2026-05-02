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
