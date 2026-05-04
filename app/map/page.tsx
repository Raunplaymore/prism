export const runtime = 'edge'

import type { Metadata } from 'next'
import ClientHome from '@/components/ClientHome'

export const metadata: Metadata = {
  title: '세계 지도로 보는 뉴스 — Prism Globe',
  description:
    '인터랙티브 세계 지도에서 국가를 클릭해 그 나라의 최신 뉴스를 한국어로 확인하세요. 50여 개국 실시간 브리핑.',
  alternates: { canonical: '/map' },
  robots: { index: true, follow: true },
  openGraph: {
    title: '세계 지도로 보는 뉴스 — Prism Globe',
    description:
      '인터랙티브 세계 지도에서 국가를 클릭해 50여 개국의 최신 뉴스를 한국어로 확인.',
    type: 'website',
    locale: 'ko_KR',
    images: ['/og-image.png'],
  },
}

export default async function MapPage() {
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

  return (
    <ClientHome
      initialLatestItems={
        initialItems as Parameters<typeof ClientHome>[0]['initialLatestItems']
      }
    />
  )
}
