'use client'

import { useEffect, useState } from 'react'

/**
 * Global scroll-to-top button. Mounted once in RootLayout so every page
 * gets the same affordance. Sits above BottomNav (bottom 72px + safe area).
 */
export default function ScrollToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-gray-700/90 text-white shadow-lg transition hover:bg-gray-600"
      aria-label="Scroll to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  )
}
