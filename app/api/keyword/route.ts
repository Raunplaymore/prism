export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { findEntry, getArticlesByKeyword } from '@/lib/keywords/index'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 })
  }
  const entry = findEntry(slug)
  if (!entry) {
    return NextResponse.json({ items: [], slug, label: null, unknown: true }, { status: 200 })
  }
  const items = await getArticlesByKeyword(entry.slug)
  return NextResponse.json({
    slug: entry.slug,
    label: entry.labelKo || entry.label,
    category: entry.category,
    items,
  })
}
