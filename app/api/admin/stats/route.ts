import { NextRequest, NextResponse } from 'next/server'
import { getTokenStats, getTokenLog } from '@/lib/cache'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    const secret = request.headers.get('x-admin-secret')
    if (secret !== (process.env.ADMIN_SECRET || 'dev-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const [stats, log] = await Promise.all([getTokenStats(), getTokenLog()])

  return NextResponse.json({ stats, log })
}
