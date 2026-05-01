'use client'

import { useEffect, useRef } from 'react'
import type { KeywordCount } from '@/lib/keywords/index'

const CATEGORY_COLOR: Record<string, string> = {
  person: '#fbbf24',
  country: '#60a5fa',
  org: '#a78bfa',
  company: '#34d399',
  topic: '#f87171',
  event: '#fb923c',
}

/**
 * 3D rotating tag sphere using mcc108/TagCloud (CSS 3D, ~10KB).
 * - When `onSelect` is provided: clicks fire the callback (no navigation).
 *   Used on the home page where selecting a keyword updates the listing in place.
 * - Otherwise: each tag is a real anchor that navigates to /keyword/[slug].
 */
export default function KeywordSphere({
  items,
  radius = 180,
  maxSpeed = 'normal',
  onSelect,
}: {
  items: KeywordCount[]
  radius?: number
  maxSpeed?: 'slow' | 'normal' | 'fast'
  onSelect?: (slug: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onSelectRef = useRef(onSelect)
  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    if (!ref.current || items.length === 0) return

    let destroyed = false
    let cloudInstance: { destroy: () => void } | null = null

    import('TagCloud').then((mod) => {
      if (destroyed || !ref.current) return
      const TagCloud = (mod as unknown as { default: typeof mod }).default ?? mod
      const useCallback = onSelectRef.current !== undefined

      const texts = items.map((kc) => {
        const label = kc.entry.labelKo || kc.entry.label
        const color = CATEGORY_COLOR[kc.entry.category] ?? '#9ca3af'
        const slug = kc.entry.slug
        const baseStyle = `color:${color};text-shadow:0 0 6px rgba(0,0,0,0.5);cursor:pointer`
        return useCallback
          ? `<span class="kw-tag" data-slug="${slug}" style="${baseStyle}">${label}</span>`
          : `<a href="/keyword/${encodeURIComponent(slug)}" style="${baseStyle};text-decoration:none">${label}</a>`
      })

      cloudInstance = (TagCloud as unknown as (
        el: Element,
        texts: string[],
        opts: Record<string, unknown>,
      ) => { destroy: () => void })(ref.current, texts, {
        radius,
        maxSpeed,
        initSpeed: 'normal',
        keep: true,
        useHTML: true,
      })
    })

    // Click delegation — fire onSelect when any .kw-tag inside the sphere is clicked
    const node = ref.current
    const handler = (e: MouseEvent) => {
      const cb = onSelectRef.current
      if (!cb) return
      const target = e.target as HTMLElement | null
      const tag = target?.closest('.kw-tag') as HTMLElement | null
      if (!tag || !tag.dataset.slug) return
      e.preventDefault()
      cb(tag.dataset.slug)
    }
    node.addEventListener('click', handler)

    return () => {
      destroyed = true
      node.removeEventListener('click', handler)
      try {
        cloudInstance?.destroy()
      } catch {
        // ignore
      }
    }
  }, [items, radius, maxSpeed])

  return (
    <div
      ref={ref}
      className="flex items-center justify-center"
      style={{ minHeight: radius * 2 }}
    />
  )
}
