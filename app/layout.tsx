import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prism',
  description: 'AI-powered world news briefing on an interactive map',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
