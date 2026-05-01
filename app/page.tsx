export const runtime = 'edge'

import ClientHome from '@/components/ClientHome'
import { getLiveKeywordCounts } from '@/lib/keywords/index'

export default async function Home() {
  let initialItems: unknown[] = []
  try {
    const res = await fetch('https://prism-4gy.pages.dev/api/news/latest?lang=ko&limit=20', {
      next: { revalidate: 300 },
    })
    if (res.ok) {
      const data = await res.json()
      initialItems = data.items ?? []
    }
  } catch {
    // fallback to client-side fetch
  }

  // Prefetch live keyword index for the keyword-mode navigation
  let keywords: Awaited<ReturnType<typeof getLiveKeywordCounts>> = []
  try {
    keywords = await getLiveKeywordCounts()
  } catch {
    // empty cloud is OK
  }

  return (
    <ClientHome
      initialLatestItems={
        initialItems as Parameters<typeof ClientHome>[0]['initialLatestItems']
      }
      keywordCounts={keywords}
    />
  )
}
