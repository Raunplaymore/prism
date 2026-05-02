'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  /** Match exactly (true) or by prefix (false). Default: prefix. */
  exact?: boolean
  icon: JSX.Element
}

const ICON_PROPS = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const ITEMS: NavItem[] = [
  {
    href: '/keyword',
    label: 'Keywords',
    icon: (
      <svg {...ICON_PROPS}>
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
        <line x1="10" y1="3" x2="8" y2="21" />
        <line x1="16" y1="3" x2="14" y2="21" />
      </svg>
    ),
  },
  {
    href: '/category',
    label: 'Categories',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/map',
    label: 'Global Map',
    exact: true,
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname() ?? ''
  const isActive = (it: NavItem) =>
    it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + '/')

  return (
    <nav
      role="navigation"
      aria-label="primary navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-gray-950/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-3">
        {ITEMS.map((it) => {
          const active = isActive(it)
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'relative flex flex-col items-center gap-0.5 py-2 text-xs text-white'
                  : 'flex flex-col items-center gap-0.5 py-2 text-xs text-gray-500 transition hover:text-gray-300'
              }
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-white"
                />
              )}
              {it.icon}
              <span>{it.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
