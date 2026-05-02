'use client'

import { useEffect, useRef } from 'react'

export interface CategorySphereItem {
  slug: string
  ko: string
  color: string
  count: number
}

/**
 * 3D rotating tag sphere for the /category index, mirroring KeywordSphere
 * but specialised for the 9 fixed news categories. Each tag is rendered as
 * a real anchor that navigates to /category/{slug} so the sphere works
 * without JS-driven state and screen readers / crawlers can follow the
 * sr-only fallback list.
 */
export default function CategorySphere({
  items,
  radius = 120,
  maxSpeed = 'normal',
}: {
  items: CategorySphereItem[]
  radius?: number
  maxSpeed?: 'slow' | 'normal' | 'fast'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || items.length === 0) return

    let destroyed = false
    let cloudInstance: { destroy: () => void } | null = null
    let rafId = 0

    import('TagCloud').then((mod) => {
      if (destroyed || !ref.current) return
      const TagCloud = (mod as unknown as { default: typeof mod }).default ?? mod

      const texts = items.map((it) => {
        const baseStyle = `color:${it.color};text-shadow:0 0 6px rgba(0,0,0,0.5);cursor:pointer`
        return `<a href="/category/${encodeURIComponent(it.slug)}" style="${baseStyle};text-decoration:none">${it.ko}</a>`
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

      // Mirror per-frame opacity → pointer-events so back-of-sphere tags
      // can't be clicked through the front (same fix as KeywordSphere).
      const sync = () => {
        if (destroyed || !ref.current) return
        const tags = ref.current.querySelectorAll<HTMLElement>('span, a')
        tags.forEach((el) => {
          const op = parseFloat(el.style.opacity || '1')
          el.style.pointerEvents = op < 0.5 ? 'none' : 'auto'
        })
        rafId = requestAnimationFrame(sync)
      }
      rafId = requestAnimationFrame(sync)
    })

    return () => {
      destroyed = true
      if (rafId) cancelAnimationFrame(rafId)
      try {
        cloudInstance?.destroy()
      } catch {
        // ignore
      }
    }
  }, [items, radius, maxSpeed])

  return (
    <>
      <div
        ref={ref}
        className="flex items-center justify-center"
        style={{ minHeight: radius * 2 }}
        aria-hidden="true"
      />
      {/* SSR-visible textual fallback for crawlers and screen readers.
          The 3D sphere is JS-rendered, so this list is the only way bots see
          which categories the page surfaces. */}
      <ul className="sr-only">
        {items.map((it) => (
          <li key={it.slug}>
            <a href={`/category/${encodeURIComponent(it.slug)}`}>
              {it.ko} ({it.count})
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}
