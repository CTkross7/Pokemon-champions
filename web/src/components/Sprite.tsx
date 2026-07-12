import { useState } from 'react'
import { spriteUrl, type Species } from '@/lib/dex'

interface SpriteProps {
  species: Species
  size?: number
  className?: string
}

/** Pokémon sprite with a monochrome pokeball fallback when unavailable. */
export default function Sprite({ species, size = 64, className = '' }: SpriteProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} className={`opacity-20 ${className}`} aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 12h6.5M14.5 12H21" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      </svg>
    )
  }
  return (
    <img
      src={spriteUrl(species)}
      alt={species.name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`select-none [image-rendering:pixelated] ${className}`}
    />
  )
}
