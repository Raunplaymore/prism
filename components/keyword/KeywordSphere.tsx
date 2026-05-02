'use client'

import { useEffect, useRef, useState } from 'react'
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
 * Each tag is a real anchor that navigates to /keyword/[slug] — no JS-driven
 * state, so screen readers / crawlers can follow the sr-only fallback list.
 *
 * `maxRadius`는 상한이고, 실제 radius는 컨테이너 크기에 비례하여 동적으로
 * 결정 (작은 viewport에서 작게, 큰 viewport에서 커짐).
 */
export default function KeywordSphere({
  items,
  maxRadius = 280,
  maxSpeed = 'normal',
}: {
  items: KeywordCount[]
  maxRadius?: number
  maxSpeed?: 'slow' | 'normal' | 'fast'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [radius, setRadius] = useState(0)

  // Track container size → recompute radius so sphere fills available space.
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => {
      const h = node.offsetHeight
      // 모바일(작은 컨테이너)에선 sphere가 컨테이너 둘레에 거의 차도록 큰
      // 비율, desktop에선 컨테이너의 절반 수준으로 라벨 spacing 확보. 일괄
      // 0.42를 쓰면 모바일에서 sphere가 작아져 라벨이 빽빽하게 모임.
      const ratio = h < 250 ? 0.65 : 0.5
      const r = h * ratio
      const next = Math.max(80, Math.min(maxRadius, Math.round(r)))
      setRadius(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [maxRadius])

  useEffect(() => {
    if (!ref.current || items.length === 0 || radius === 0) return

    let destroyed = false
    let cloudInstance: { destroy: () => void } | null = null
    let rafId = 0

    import('TagCloud').then((mod) => {
      if (destroyed || !ref.current) return
      const TagCloud = (mod as unknown as { default: typeof mod }).default ?? mod

      const texts = items.map((kc) => {
        const label = kc.entry.labelKo || kc.entry.label
        const color = CATEGORY_COLOR[kc.entry.category] ?? '#9ca3af'
        const slug = kc.entry.slug
        const baseStyle = `color:${color};text-shadow:0 0 6px rgba(0,0,0,0.5);cursor:pointer`
        return `<a href="/keyword/${encodeURIComponent(slug)}" style="${baseStyle};text-decoration:none">${label}</a>`
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

      // TagCloud sets `transform: translate3d(x, y, 0) scale(per)` per frame
      // where `per = 2*depth / (2*depth + rz)`. Equator → scale=1, front
      // hemisphere → scale > 1, back hemisphere → scale < 1. Restrict clicks
      // to the front hemisphere so users select only what they actually see.
      const SCALE_THRESHOLD = 1.0
      const scaleRe = /scale\(([\d.]+)\)/
      const sync = () => {
        if (destroyed || !ref.current) return
        const tags = ref.current.querySelectorAll<HTMLElement>('span, a')
        tags.forEach((el) => {
          const m = el.style.transform.match(scaleRe)
          const scale = m ? parseFloat(m[1]) : 1
          el.style.pointerEvents = scale >= SCALE_THRESHOLD ? 'auto' : 'none'
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
        className="flex h-full w-full items-center justify-center"
        aria-hidden="true"
      />
      {/* SSR-visible textual fallback for crawlers and screen readers.
          The 3D sphere is JS-rendered, so this list is the only way bots see
          which keywords the page actually surfaces. */}
      <ul className="sr-only">
        {items.map((kc) => {
          const label = kc.entry.labelKo || kc.entry.label
          return (
            <li key={kc.entry.slug}>
              <a href={`/keyword/${encodeURIComponent(kc.entry.slug)}`}>
                #{label} ({kc.count})
              </a>
            </li>
          )
        })}
      </ul>
    </>
  )
}
