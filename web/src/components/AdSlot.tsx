import { useEffect, useRef } from 'react'

/**
 * Google AdSense display slot. Renders only on the live site (see lib/ads) and
 * only when a slot id is provided, so dev/preview stay clean. Auto Ads (enabled
 * in the AdSense dashboard) cover anchor + interstitial with no slot needed.
 */
import { ADSENSE_CLIENT, adsEnabled } from '@/lib/ads'

interface AdSlotProps {
  slot: string
  className?: string
}

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

export default function AdSlot({ slot, className = '' }: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null)

  useEffect(() => {
    if (!adsEnabled() || !slot) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* AdSense not loaded yet; ignore */
    }
  }, [slot])

  if (!adsEnabled() || !slot) return null

  return (
    <ins
      ref={ref}
      className={`adsbygoogle block ${className}`}
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
