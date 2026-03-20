export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getTokenStats, getTokenLog } from '@/lib/cache'
import { verifySessionToken, getSessionFromCookie } from '@/lib/auth'

async function isAdmin(request: NextRequest): Promise<boolean> {
  // Cookie-based (Google OAuth session)
  const token = getSessionFromCookie(request.headers.get('cookie'))
  if (token) {
    const user = await verifySessionToken(token)
    if (user?.isAdmin) return true
  }
  // Header-based (legacy/API)
  const secret = process.env.ADMIN_SECRET
  if (secret && request.headers.get('x-admin-secret') === secret) return true
  return false
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const offset = Number(request.nextUrl.searchParams.get('offset')) || 0
  const limit = Number(request.nextUrl.searchParams.get('limit')) || 20
  const [stats, log] = await Promise.all([getTokenStats(), getTokenLog(offset, limit)])
  return NextResponse.json({ stats, log: log.items, logTotal: log.total, logHasMore: log.hasMore })
}
