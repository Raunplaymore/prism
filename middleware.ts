import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Emergency service pause.
 *
 * Keep this at true until the RSS ingestion incident is resolved and the
 * existing feed has been checked. This blocks every page and API route before
 * any route handler can mutate cache or call the LLM.
 */
const MAINTENANCE_MODE = true

export function middleware(_request: NextRequest) {
  if (!MAINTENANCE_MODE) return NextResponse.next()

  return new NextResponse(
    `<!doctype html>
<html lang="ko">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Prism Globe · 점검 중</title></head>
  <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#030712;color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
    <main style="max-width:32rem;padding:2rem;text-align:center">
      <p style="margin:0 0 .75rem;color:#60a5fa;font-weight:700">Prism Globe</p>
      <h1 style="margin:0;font-size:1.65rem">서비스 점검 중입니다</h1>
      <p style="margin:1rem 0 0;color:#9ca3af;line-height:1.65">뉴스 수집 데이터의 신뢰성을 점검하고 있습니다. 확인이 끝나는 대로 서비스를 재개하겠습니다.</p>
    </main>
  </body>
</html>`,
    {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'Retry-After': '3600',
      },
    },
  )
}

export const config = {
  matcher: '/:path*',
}
