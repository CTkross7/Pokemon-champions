/**
 * Renders a team as a shareable image (SVG → PNG). Sprites are fetched and
 * embedded as data URIs so the resulting canvas is never tainted and the image
 * works offline. Layout mirrors the in-app cards: sprite, name, types, item,
 * ability, moves, and the SP spread.
 */
import type { Species } from '@/lib/dex'

export interface ImageMon {
  species: Species
  item: string // localized
  ability: string // localized
  nature: string // localized
  spTotal: number
  sp: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number } // per-stat SP
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number } // final Lv50 stats
  moves: string[] // localized
  sprite: string // /sprites/{id}.png
}

// Stat rows: key, Korean label, bar color (matches the in-app detail page).
const STAT_ROWS: ReadonlyArray<[keyof ImageMon['stats'], string, string]> = [
  ['hp', 'HP', '#34d399'],
  ['atk', '공격', '#fb7185'],
  ['def', '방어', '#fbbf24'],
  ['spa', '특공', '#38bdf8'],
  ['spd', '특방', '#a78bfa'],
  ['spe', '스피드', '#e879f9'],
]

const TYPE_HEX: Record<string, string> = {
  Normal: '#9099a1', Fire: '#ff9c54', Water: '#4d90d5', Electric: '#f3d23b', Grass: '#63bd5a',
  Ice: '#74cec0', Fighting: '#ce4069', Poison: '#ab6ac8', Ground: '#d97746', Flying: '#8fa8dd',
  Psychic: '#f97176', Bug: '#90c12c', Rock: '#c7b78b', Ghost: '#5269ac', Dragon: '#0a6dc4',
  Dark: '#5a5366', Steel: '#5a8ea1', Fairy: '#ec8fe6',
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function spriteDataUri(m: ImageMon): Promise<string> {
  // Champions-exclusive Megas have no own sprite → fall back to base species.
  const candidates = [m.sprite]
  if (m.species.baseSpecies) candidates.push(`/sprites/${m.species.baseSpecies}.png`)
  for (const url of candidates) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const blob = await res.blob()
      const uri = await new Promise<string>((resolve) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = () => resolve('')
        r.readAsDataURL(blob)
      })
      if (uri) return uri
    } catch {
      /* try next candidate */
    }
  }
  return ''
}

const CARD_W = 360
const CARD_H = 248
const GAP = 12
const PAD = 20
const HEADER = 64

/** Builds the team image SVG (with embedded sprites). */
export async function buildTeamSvg(title: string, mons: ImageMon[], brand = 'ChampsNote'): Promise<string> {
  const sprites = await Promise.all(mons.map((m) => spriteDataUri(m)))
  const cols = 2
  const rows = Math.ceil(mons.length / cols)
  const W = PAD * 2 + CARD_W * cols + GAP
  const H = PAD * 2 + HEADER + rows * CARD_H + (rows - 1) * GAP

  const cards = mons
    .map((m, i) => {
      const x = PAD + (i % cols) * (CARD_W + GAP)
      const y = PAD + HEADER + Math.floor(i / cols) * (CARD_H + GAP)
      const types = m.species.types
        .map((tp, j) => {
          const tx = x + 88 + j * 52
          return `<rect x="${tx}" y="${y + 40}" width="46" height="17" rx="8.5" fill="${TYPE_HEX[tp] ?? '#888'}"/>
            <text x="${tx + 23}" y="${y + 52}" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">${esc(tp)}</text>`
        })
        .join('')
      // Stat block: label · SP badge · bar (final stat) · final value.
      const BAR_X = x + 78
      const BAR_W = 176
      const stats = STAT_ROWS.map(([key, label, color], j) => {
        const sy = y + 76 + j * 15
        const val = m.stats[key]
        const spv = m.sp[key]
        const w = Math.max(3, Math.round((Math.min(val, 230) / 230) * BAR_W))
        return `<text x="${x + 14}" y="${sy + 8.5}" font-size="9.5" font-weight="700" fill="#9aa1ab">${label}</text>
          <text x="${x + 64}" y="${sy + 8.5}" font-size="9" font-weight="700" fill="${spv > 0 ? '#c7f236' : '#565b64'}" text-anchor="end">${spv}</text>
          <rect x="${BAR_X}" y="${sy + 2}" width="${BAR_W}" height="7" rx="3.5" fill="#20242c"/>
          <rect x="${BAR_X}" y="${sy + 2}" width="${w}" height="7" rx="3.5" fill="${color}"/>
          <text x="${x + CARD_W - 14}" y="${sy + 8.5}" font-size="9.5" font-weight="800" fill="#e6e9ee" text-anchor="end">${val}</text>`
      }).join('')
      const moves = m.moves
        .slice(0, 4)
        .map((mv, j) => {
          const mx = x + 14 + (j % 2) * 172
          const my = y + 172 + Math.floor(j / 2) * 24
          return `<rect x="${mx}" y="${my}" width="160" height="19" rx="9.5" fill="#20242c"/>
            <text x="${mx + 10}" y="${my + 13.5}" font-size="10.5" font-weight="600" fill="#d9dde3">${esc(mv)}</text>`
        })
        .join('')
      const sprite = sprites[i]
        ? `<image href="${sprites[i]}" x="${x + 10}" y="${y + 10}" width="60" height="60" style="image-rendering:pixelated"/>`
        : ''
      return `<g>
        <rect x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" rx="16" fill="#14161b" stroke="#262a31"/>
        ${sprite}
        <text x="${x + 78}" y="${y + 28}" font-size="16" font-weight="800" fill="#fff">${esc(m.species.ko)}</text>
        ${types}
        <text x="${x + CARD_W - 14}" y="${y + 26}" font-size="10.5" font-weight="700" fill="#c7f236" text-anchor="end">${esc(m.nature)}</text>
        ${stats}
        ${moves}
        <text x="${x + 14}" y="${y + 230}" font-size="10.5" fill="#8b929c">지닌물건 <tspan font-weight="700" fill="#cdd2d8">${esc(m.item || '-')}</tspan></text>
        <text x="${x + CARD_W - 14}" y="${y + 230}" font-size="10.5" fill="#8b929c" text-anchor="end">특성 <tspan font-weight="700" fill="#cdd2d8">${esc(m.ability || '-')}</tspan></text>
      </g>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Esamanru, Pretendard, sans-serif">
    <rect width="${W}" height="${H}" fill="#0a0b0e"/>
    <text x="${PAD}" y="${PAD + 30}" font-size="22" font-weight="900" fill="#fff">${esc(title)}</text>
    <text x="${W - PAD}" y="${PAD + 28}" font-size="13" font-weight="800" fill="#c7f236" text-anchor="end">${esc(brand)}</text>
    ${cards}
  </svg>`
}

/** Rasterizes an SVG string to a PNG blob via canvas. */
export async function svgToPngBlob(svg: string, scale = 2): Promise<Blob | null> {
  const wMatch = svg.match(/width="(\d+)"/)
  const hMatch = svg.match(/height="(\d+)"/)
  const w = wMatch ? Number(wMatch[1]) : 720
  const h = hMatch ? Number(hMatch[1]) : 720
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  const img = new Image()
  const loaded = new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
  })
  img.src = url
  if (!(await loaded)) return null
  const canvas = document.createElement('canvas')
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0)
  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
