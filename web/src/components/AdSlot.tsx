import { useEffect, useRef } from 'react'

/**
 * Google AdSense slot, gated on configuration. Renders nothing until BOTH
 * VITE_ADSENSE_CLIENT (ca-pub-...) and a slot id are set, so the app ships
 * ad-free by default and monetization is a one-line env change later — no
 * placeholder boxes, no layout shift, and reviewers see a clean site.
 *
 * To enable: set VITE_ADSENSE_CLIENT in the build env, load the AdSense script
 * in index.html, and pass a real `slot`. See docs/DEPLOYMENT.md (monetization).
 */
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined

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
    if (!ADSENSE_CLIENT || !slot) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* AdSense not loaded yet; ignore */
    }
  }, [slot])

  if (!ADSENSE_CLIENT || !slot) return null

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
