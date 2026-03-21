import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { SUPPORTED_COUNT } from '@/lib/rss'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

const desc = `${SUPPORTED_COUNT}개국의 뉴스를 AI가 한국어로 요약하여 제공합니다.`

export const metadata: Metadata = {
  title: 'Prism — AI 세계 뉴스 브리핑',
  description: `${desc} 인터랙티브 세계 지도에서 관심 국가의 최신 뉴스를 확인하세요.`,
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/icon-192.png' },
  keywords: ['뉴스', '세계 뉴스', 'AI 뉴스', '뉴스 요약', '국제 뉴스', 'world news', 'Prism'],
  openGraph: {
    title: 'Prism — AI 세계 뉴스 브리핑',
    description: desc,
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Prism',
    images: [{ url: 'https://prismglobe.com/og-image.png', width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  verification: { google: 'QY09AFQmbMM0PxNDQg7eRaVx-ouDrjLWChRp1KTPaXU' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

  return (
    <html lang="ko">
      <body className="bg-gray-950 text-white antialiased">
        {children}
        {adsenseClient && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  )
}
