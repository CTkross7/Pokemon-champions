import { useState } from 'react'
import { spriteUrl, type Species } from '@/lib/dex'

interface SpriteProps {
  species: Species
  size?: number
  className?: string
}

/**
 * Pokémon sprite. Champions-exclusive Megas have no PokéAPI artwork, so a
 * missing sprite first falls back to the base species' sprite, then to a
 * monochrome pokeball.
 */
export default function Sprite({ species, size = 64, className = '' }: SpriteProps) {
  // 0 = own sprite, 1 = base-species sprite, 2 = pokeball placeholder
  const [stage, setStage] = useState(0)

  const src =
    stage === 0
      ? spriteUrl(species)
      : stage === 1 && species.baseSpecies
        ? `/sprites/${species.baseSpecies}.png`
        : null

  if (!src) {
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
      src={src}
      alt={species.name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setStage(stage === 0 && species.baseSpecies ? 1 : 2)}
      className={`select-none [image-rendering:pixelated] ${className}`}
    />
  )
}
