import { SOCIAL_LINKS } from '@/lib/social'

export default function Footer() {
  const year = new Date().getFullYear()
  const ig = SOCIAL_LINKS.instagram
  const threads = SOCIAL_LINKS.threads

  return (
    <footer className="mt-12 border-t border-gray-900 bg-gray-950 px-4 pt-6 pb-24 text-sm text-gray-500 sm:px-8 sm:py-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* 좌: copyright */}
        <p className="text-xs text-gray-600">
          © {year} Prism Globe
        </p>

        {/* 가운데: 정책 링크 */}
        <nav className="flex items-center gap-4 text-xs">
          <a href="/about" className="text-gray-500 transition hover:text-gray-300">
            소개
          </a>
          <a href="/privacy" className="text-gray-500 transition hover:text-gray-300">
            개인정보
          </a>
        </nav>

        {/* 우: SNS 아이콘 */}
        {(ig || threads) && (
          <div className="flex items-center gap-3">
            {ig && (
              <a
                href={ig}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Prism Globe Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-900 hover:text-white"
              >
                {/* Instagram glyph (inline SVG, no library) */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
                </svg>
              </a>
            )}
            {threads && (
              <a
                href={threads}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Prism Globe Threads"
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-900 hover:text-white"
              >
                {/* Threads glyph (custom — inline SVG) */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M9 9c1-1.5 2-2 3-2s3 .5 3 2.5-1.5 2.5-3 2.5-2 .5-2 1.5 1 1.5 2 1.5 2-.5 2.5-1.5" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </footer>
  )
}
