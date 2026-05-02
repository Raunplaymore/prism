import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { SUPPORTED_COUNT } from '@/lib/rss'
import BottomNav from '@/components/BottomNav'
import ScrollToTop from '@/components/ScrollToTop'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover' as const,
}

const desc = `${SUPPORTED_COUNT}개국의 뉴스를 AI가 한국어로 요약하여 제공합니다.`

export const metadata: Metadata = {
  // 모든 alternates.canonical / openGraph.url 등 상대 경로의 base.
  // 이게 없으면 Next.js가 빌드 환경에 따라 origin을 추론해 정확하지 않을 수 있음.
  metadataBase: new URL('https://prismglobe.com'),
  title: 'Prism — AI 세계 뉴스 브리핑',
  description: `${desc} 인터랙티브 세계 지도에서 관심 국가의 최신 뉴스를 확인하세요.`,
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/icon-192.png' },
  keywords: ['뉴스', '세계 뉴스', 'AI 뉴스', '뉴스 요약', '국제 뉴스', 'world news', 'Prism'],
  openGraph: {
    title: 'Prism — AI 세계 뉴스 브리핑',
    description: desc,
    url: 'https://prismglobe.com',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Prism',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prism — AI 세계 뉴스 브리핑',
    description: desc,
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  verification: { google: 'QY09AFQmbMM0PxNDQg7eRaVx-ouDrjLWChRp1KTPaXU' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <meta property="fb:app_id" content="3828444140798151" />
      </head>
      <body className="bg-gray-950 text-white antialiased pb-[calc(56px+env(safe-area-inset-bottom))]">
        {children}
        <ScrollToTop />
        <BottomNav />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8772509301822103"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
