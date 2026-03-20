'use client'

import { useEffect, useRef } from 'react'

interface AdSlotProps {
  slot: string
  type?: 'banner' | 'inline'
  className?: string
}

/**
 * Google AdSense ad slot component.
 * - banner: thin horizontal (320x50 mobile / 728x90 pc)
 * - inline: thin horizontal between articles (320x50 mobile / 468x60 pc)
 *
 * Requires: NEXT_PUBLIC_ADSENSE_CLIENT + NEXT_PUBLIC_ADSENSE_APPROVED
 */
export default function AdSlot({ slot, type = 'inline', className = '' }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null)
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

  useEffect(() => {
    if (!client || !adRef.current) return
    try {
      const w = window as unknown as { adsbygoogle: unknown[] }
      w.adsbygoogle = w.adsbygoogle || []
      w.adsbygoogle.push({})
    } catch {
      // AdSense not loaded
    }
  }, [client])

  if (!client || !process.env.NEXT_PUBLIC_ADSENSE_APPROVED) return null

  const isBanner = type === 'banner'

  return (
    <div className={`my-3 flex justify-center ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: isBanner ? 728 : 468,
          height: isBanner ? 90 : 60,
          overflow: 'hidden',
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="horizontal"
        data-full-width-responsive="false"
      />
    </div>
  )
}
