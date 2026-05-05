export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { listCachedCountries } from '@/lib/cache'
import { getAllCountries } from '@/lib/countries'
import { isSupported } from '@/lib/rss'

/** Quick Access expansion for the map page.
 *  Returns ISO codes (uppercase) of countries whose Korean feed cache is
 *  currently populated. NewsStand merges these with TOP_COUNTRIES so a
 *  country the user previously selected stays one click away on return.
 *
 *  Anonymous, soft-cached at the edge for 5 minutes — staleness is fine,
 *  the dropdown still covers the full SUPPORTED set. */
export async function GET() {
  const all = getAllCountries()
    .map((c) => c.code.toUpperCase())
    .filter((code) => isSupported(code))

  const codes = await listCachedCountries(all, 'ko')

  return NextResponse.json(
    { codes },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    },
  )
}
