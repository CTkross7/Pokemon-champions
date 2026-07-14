import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listSamples, likeSample, getSample, type SampleMeta } from '@/lib/api'
import { decodeTeam } from '@/lib/share'
import { useTeams } from '@/store/teams'
import { useAuth } from '@/lib/auth'
import ReportButton from '@/components/ReportButton'
import Icon from '@/components/Icon'

export default function Gallery() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { importTeam } = useTeams()
  const user = useAuth((s) => s.user)
  const [state, setState] = useState<'loading' | 'ready' | 'unconfigured'>('loading')
  const [samples, setSamples] = useState<SampleMeta[]>([])
  const [liked, setLiked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    listSamples().then((r) => {
      if (!r.configured) return setState('unconfigured')
      setSamples(r.data.samples)
      setState('ready')
    })
  }, [])

  const onLike = async (id: string) => {
    if (!user) return navigate('/login')
    if (liked[id]) return
    const r = await likeSample(id)
    if (r.configured) {
      setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, likes: r.data.likes } : s)))
      setLiked((prev) => ({ ...prev, [id]: true }))
    }
  }

  const onImport = async (id: string, title: string) => {
    if (!user) return navigate('/login')
    const r = await getSample(id)
    if (!r.configured) return
    const decoded = decodeTeam(r.data.sample.team)
    if (!decoded) return
    importTeam({ id: crypto.randomUUID(), name: title, mons: decoded.mons, updatedAt: Date.now() })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">{t('gallery.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('gallery.subtitle')}</p>
      </div>

      {state === 'loading' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      )}

      {state === 'unconfigured' && (
        <div className="card space-y-3 p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-white/5">
            <Icon name="users" size={26} />
          </span>
          <h2 className="text-lg font-bold">{t('gallery.notReady')}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('gallery.notReadyNote')}</p>
          <Link to="/teams" className="inline-block text-sm font-bold text-volt-600 dark:text-volt-400">
            {t('gallery.shareVia')} →
          </Link>
        </div>
      )}

      {state === 'ready' && samples.length === 0 && (
        <div className="card p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">{t('gallery.empty')}</div>
      )}

      {state === 'ready' && samples.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {samples.map((s) => (
            <div key={s.id} className="card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{s.title}</p>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-600">
                  {s.author} · {t('gallery.views', { count: s.views })}
                </p>
                <ReportButton targetType="sample" targetId={s.id} className="mt-1" />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onLike(s.id)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${liked[s.id] ? 'bg-volt-400/20 text-volt-700 dark:text-volt-300' : 'bg-zinc-100 text-zinc-500 dark:bg-white/6 dark:text-zinc-400'}`}
                >
                  ♥ {s.likes}
                </button>
                <button
                  type="button"
                  onClick={() => onImport(s.id, s.title)}
                  className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white dark:bg-volt-400 dark:text-black"
                >
                  {t('gallery.import')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">{t('gallery.note')}</p>
    </div>
  )
}
