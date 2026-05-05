import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { SUPPORTED_COUNT } from '@/lib/rss'
import BottomNav from '@/components/BottomNav'
import ScrollToTop from '@/components/ScrollToTop'
import Footer from '@/components/Footer'
import { socialSameAs } from '@/lib/social'

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
  title: 'Prism Globe — AI 세계 뉴스 브리핑',
  description: `${desc} 인터랙티브 세계 지도에서 관심 국가의 최신 뉴스를 확인하세요.`,
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/icon-192.png' },
  keywords: ['뉴스', '세계 뉴스', 'AI 뉴스', '뉴스 요약', '국제 뉴스', 'world news', 'Prism Globe'],
  openGraph: {
    title: 'Prism Globe — AI 세계 뉴스 브리핑',
    description: desc,
    url: 'https://prismglobe.com',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Prism Globe',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prism Globe — AI 세계 뉴스 브리핑',
    description: desc,
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  verification: { google: 'QY09AFQmbMM0PxNDQg7eRaVx-ouDrjLWChRp1KTPaXU' },
}

/** 사이트 전체 entity — Google이 brand search 시 site name, 검색박스, 로고를
 *  SERP에 직접 노출하도록 명시. WebSite/Organization는 모든 페이지에 하나만
 *  있으면 충분해서 layout에 inline.
 *  sameAs는 서버 env에서 읽으므로 RootLayout 함수 안에서 빌드. */
function buildSiteJsonLd(sameAs: string[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://prismglobe.com/#website',
        url: 'https://prismglobe.com',
        name: 'Prism Globe',
        description: 'AI 세계 뉴스 브리핑',
        inLanguage: 'ko',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://prismglobe.com/keyword/{search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://prismglobe.com/#organization',
        name: 'Prism Globe',
        url: 'https://prismglobe.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://prismglobe.com/icon-512.png',
          width: 512,
          height: 512,
        },
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
    ],
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // GA4 Measurement ID는 client-side로 노출되는 public 식별자 (secret 아님).
  // 기본값을 코드에 박아두고 env로 override 허용 — staging/dev에서 별도 GA
  // property를 쓰고 싶을 때만 env 설정.
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-8BFTN9EE24'
  const siteJsonLd = buildSiteJsonLd(socialSameAs())
  return (
    <html lang="ko">
      <head>
        <meta property="fb:app_id" content="3828444140798151" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body className="bg-gray-950 text-white antialiased pb-[calc(56px+env(safe-area-inset-bottom))]">
        {children}
        <Footer />
        <ScrollToTop />
        <BottomNav />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8772509301822103"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
