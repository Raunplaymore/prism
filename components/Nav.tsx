'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  /** Match exactly (true) or by prefix (false). Default: prefix. */
  exact?: boolean
}

const ITEMS: NavItem[] = [
  { href: '/keyword', label: 'Keywords' },
  { href: '/', label: 'Map', exact: true },
]

export default function Nav() {
  const pathname = usePathname() ?? ''
  const isActive = (it: NavItem) =>
    it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + '/')

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800/50 bg-gray-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:gap-5">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Prism" className="h-7 w-7 rounded-md" />
          <div className="hidden flex-col leading-none sm:flex">
            <span className="text-base font-bold tracking-tight text-white">Prism</span>
            <span className="text-[10px] text-gray-500">refracted by AI</span>
          </div>
        </Link>
        <nav className="flex flex-1 items-center gap-0.5 sm:gap-1">
          {ITEMS.map((it) => {
            const active = isActive(it)
            return (
              <Link
                key={it.href}
                href={it.href}
                className={
                  active
                    ? 'rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-white'
                    : 'rounded-md px-3 py-1.5 text-sm text-gray-400 transition hover:bg-gray-900 hover:text-white'
                }
              >
                {it.label}
              </Link>
            )
          })}
        </nav>
        <Link
          href="/admin"
          className="text-xs text-gray-500 transition hover:text-gray-300"
        >
          Admin
        </Link>
      </div>
    </header>
  )
}
