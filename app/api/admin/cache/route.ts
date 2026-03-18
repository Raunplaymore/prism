import { NextRequest, NextResponse } from 'next/server'
import { deleteCachedNewsAllLangs } from '@/lib/cache'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dev-admin'

function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const auth = request.headers.get('x-admin-secret')
  return auth === ADMIN_SECRET
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
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
