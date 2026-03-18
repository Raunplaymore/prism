export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { deleteCachedNewsAllLangs } from '@/lib/cache'
import { verifySessionToken, getSessionFromCookie } from '@/lib/auth'

async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = getSessionFromCookie(request.headers.get('cookie'))
  if (token) {
    const user = await verifySessionToken(token)
    if (user?.isAdmin) return true
  }
  const secret = process.env.ADMIN_SECRET
  if (secret && request.headers.get('x-admin-secret') === secret) return true
  return false
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const country = request.nextUrl.searchParams.get('country')

  if (!country || !/^[A-Z]{2}$/i.test(country)) {
    return NextResponse.json({ error: 'Valid country code required' }, { status: 400 })
  }

  const deleted = await deleteCachedNewsAllLangs(country.toUpperCase())

  return NextResponse.json({
    country: country.toUpperCase(),
    deleted,
    message: `Cleared ${deleted} cache entries for ${country.toUpperCase()}`,
  })
}
