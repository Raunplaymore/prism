export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, getSessionFromCookie } from '@/lib/auth'
import { testSend } from '@/lib/telegram'

export async function GET(request: NextRequest) {
  // Admin only
  const token = getSessionFromCookie(request.headers.get('cookie'))
  if (token) {
    const user = await verifySessionToken(token)
    if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } else {
    const secret = process.env.ADMIN_SECRET
    if (!secret || request.headers.get('x-admin-secret') !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const result = await testSend()
  return NextResponse.json(result)
}
