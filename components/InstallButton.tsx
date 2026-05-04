'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Global PWA install affordance. Mounted in Nav so every page exposes it.
 * - Captures `beforeinstallprompt` and replays it on click (Chrome/Edge/Android).
 * - Falls back to a manual instruction modal when the event never fires
 *   (Safari / iOS, browsers that already installed, etc.).
 */
const SITE_URL = 'https://prismglobe.com'

export default function InstallButton() {
  const promptRef = useRef<{ prompt: () => void } | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [copied, setCopied] = useState(false)
  // Portal target only exists after mount; gate createPortal on this so SSR
  // doesn't try to render into document.body.
  const [mounted, setMounted] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — user can long-press the URL text instead */
    }
  }

  useEffect(() => {
    setMounted(true)
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      promptRef.current = e as unknown as { prompt: () => void }
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const handleClick = () => {
    if (promptRef.current) {
      promptRef.current.prompt()
      promptRef.current = null
    } else {
      setShowGuide(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 text-gray-400 transition hover:border-gray-600 hover:text-white"
        aria-label="Install app"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      {mounted && showGuide && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={() => setShowGuide(false)}
          role="dialog"
          aria-modal="true"
          aria-label="앱 설치 안내"
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl border border-gray-600 bg-gray-900 p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Prism Globe" className="h-12 w-12 rounded-lg" />
            </div>
            <h3 className="mb-4 text-lg font-bold text-white">홈 화면에 추가</h3>
            <div className="mb-4 space-y-3 text-left text-sm text-gray-300">
              <div className="rounded-lg bg-gray-800 p-3">
                <p className="mb-1 font-medium text-blue-400">iPhone / iPad</p>
                <p className="text-xs text-gray-400">
                  Safari 하단 공유 버튼(↑) → &quot;홈 화면에 추가&quot;
                </p>
              </div>
              <div className="rounded-lg bg-gray-800 p-3">
                <p className="mb-1 font-medium text-green-400">Android</p>
                <p className="text-xs text-gray-400">
                  Chrome 메뉴(⋮) → &quot;홈 화면에 추가&quot;
                </p>
              </div>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              앱처럼 빠르게 접속할 수 있습니다
            </p>
            <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 p-3 text-left">
              <p className="mb-1.5 text-[11px] font-medium text-gray-400">
                사이트 주소
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 select-all break-all rounded bg-gray-950 px-2 py-1.5 text-xs text-blue-300">
                  {SITE_URL}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
                  aria-label="주소 복사"
                >
                  {copied ? '✓ 복사됨' : '복사'}
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-gray-500">
                카카오톡 / 네이버 등 인앱 브라우저라면 주소 복사 후 Safari에 붙여넣어 열어주세요.
              </p>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              확인
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
