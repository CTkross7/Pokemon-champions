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
  moves: string[] // localized
  sprite: string // /sprites/{id}.png
}

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

const CARD_W = 348
const CARD_H = 150
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
      const moves = m.moves
        .slice(0, 4)
        .map((mv, j) => {
          const mx = x + 14 + (j % 2) * 162
          const my = y + 74 + Math.floor(j / 2) * 24
          return `<rect x="${mx}" y="${my}" width="152" height="19" rx="9.5" fill="#20242c"/>
            <text x="${mx + 10}" y="${my + 13.5}" font-size="10.5" font-weight="600" fill="#d9dde3">${esc(mv)}</text>`
        })
        .join('')
      const sprite = sprites[i]
        ? `<image href="${sprites[i]}" x="${x + 10}" y="${y + 10}" width="64" height="64" style="image-rendering:pixelated"/>`
        : ''
      return `<g>
        <rect x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" rx="16" fill="#14161b" stroke="#262a31"/>
        ${sprite}
        <text x="${x + 88}" y="${y + 30}" font-size="16" font-weight="800" fill="#fff">${esc(m.species.ko)}</text>
        ${types}
        ${moves}
        <text x="${x + 14}" y="${y + 128}" font-size="10.5" fill="#8b929c">지닌물건 <tspan font-weight="700" fill="#cdd2d8">${esc(m.item || '-')}</tspan></text>
        <text x="${x + 14}" y="${y + 142}" font-size="10.5" fill="#8b929c">특성 <tspan font-weight="700" fill="#cdd2d8">${esc(m.ability || '-')}</tspan>  ·  <tspan fill="#8b929c">SP</tspan> <tspan font-weight="700" fill="#cdd2d8">${m.spTotal}/66</tspan></text>
        <text x="${x + CARD_W - 14}" y="${y + 128}" font-size="10.5" font-weight="700" fill="#c7f236" text-anchor="end">${esc(m.nature)}</text>
      </g>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Pretendard, sans-serif">
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
