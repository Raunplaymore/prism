export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, getSessionFromCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = getSessionFromCookie(request.headers.get('cookie'))
  if (!token) {
    return NextResponse.json({ user: null })
  }

  const user = await verifySessionToken(token)
  return NextResponse.json({ user })
}
