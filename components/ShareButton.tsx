'use client'

import { useState } from 'react'

interface Props {
  /** Share sheet/title used by Web Share API. */
  title: string
  /** Optional URL. Defaults to window.location.href so the link opens the
   *  exact hub the user is viewing. */
  url?: string
  className?: string
}

/**
 * Small share affordance. Web Share API on mobile, clipboard fallback on
 * desktop with a 2s "복사됨" indicator.
 */
export default function ShareButton({ title, url, className = '' }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = url ?? window.location.href
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, text: title, url: shareUrl })
        return
      } catch {
        /* user cancelled or share unsupported in context */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-800 hover:text-white ${className}`}
      aria-label="이 페이지 공유"
    >
      {copied ? (
        <span className="text-[10px] text-green-400">복사됨</span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      )}
    </button>
  )
}
