import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { spriteUrl, STAT_KEYS, type MoveData, type Species } from '@/lib/dex'
import { spTotal, natureLabel, statAtLevel50 } from '@/lib/champions'
import { loadItems } from '@/lib/items'
import { buildTeamSvg, svgToPngBlob, type ImageMon } from '@/lib/teamImage'
import type { TeamMon } from '@/store/teams'
import Icon from '@/components/Icon'

/**
 * "Save as image" for a team/sample: builds an SVG card grid (sprites, names,
 * items, abilities, moves, spreads), previews it, and lets the user download a
 * PNG or share it via the Web Share API.
 */
export default function ShareImageButton({
  title,
  mons,
  speciesById,
  moves,
}: {
  title: string
  mons: (TeamMon | null)[]
  speciesById: Map<string, Species>
  moves: Record<string, MoveData> | null
}) {
  const { t, i18n } = useTranslation()
  const ko = i18n.language === 'ko'
  const [busy, setBusy] = useState(false)
  const [svg, setSvg] = useState<string | null>(null)

  const build = async () => {
    setBusy(true)
    const items = await loadItems()
    const itemKo = new Map(items.map((it) => [it.name, it.ko]))
    const imageMons: ImageMon[] = []
    for (const mon of mons) {
      if (!mon) continue
      const species = speciesById.get(mon.speciesId)
      if (!species) continue
      const ability = species.abilities.find((a) => a.name === mon.ability)
      const stats = Object.fromEntries(
        STAT_KEYS.map((k) => [k, statAtLevel50(species.baseStats[k], k, mon.sp[k], mon.nature)]),
      ) as ImageMon['stats']
      imageMons.push({
        species,
        item: mon.item ? (ko ? (itemKo.get(mon.item) ?? mon.item) : mon.item) : '',
        ability: ability ? (ko ? ability.ko : ability.name) : mon.ability,
        nature: natureLabel(mon.nature, i18n.language),
        spTotal: spTotal(mon.sp),
        sp: mon.sp,
        stats,
        moves: mon.moves.map((id) => (ko ? (moves?.[id]?.ko ?? id) : (moves?.[id]?.name ?? id))),
        sprite: spriteUrl(species),
      })
    }
    if (imageMons.length === 0) {
      setBusy(false)
      return
    }
    setSvg(await buildTeamSvg(title, imageMons))
    setBusy(false)
  }

  const download = async () => {
    if (!svg) return
    const blob = await svgToPngBlob(svg)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'team'}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  const share = async () => {
    if (!svg) return
    const blob = await svgToPngBlob(svg)
    if (!blob) return
    const file = new File([blob], `${title || 'team'}.png`, { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title })
      } catch {
        /* cancelled */
      }
    } else {
      download()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={build}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-bold text-zinc-600 transition-colors hover:border-volt-500 disabled:opacity-50 dark:border-white/15 dark:text-zinc-300"
      >
        <Icon name="sparkles" size={14} />
        {busy ? t('shareImage.building') : t('shareImage.asImage')}
      </button>

      {svg && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="dialog"
          onClick={() => setSvg(null)}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-3 dark:bg-surface-dark" onClick={(e) => e.stopPropagation()}>
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
              alt={title}
              className="w-full rounded-lg"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={share}
                className="flex-1 rounded-xl bg-volt-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-volt-300"
              >
                {t('shareImage.share')}
              </button>
              <button
                type="button"
                onClick={download}
                className="flex-1 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-bold text-zinc-700 transition-colors hover:border-volt-500 dark:border-white/15 dark:text-zinc-200"
              >
                {t('shareImage.save')}
              </button>
              <button
                type="button"
                onClick={() => setSvg(null)}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-bold text-zinc-500 dark:border-white/15"
              >
                {t('shareImage.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
