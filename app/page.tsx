export const runtime = 'edge'

import ClientHome from '@/components/ClientHome'

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

  return <ClientHome initialLatestItems={initialItems as Parameters<typeof ClientHome>[0]['initialLatestItems']} />
}
