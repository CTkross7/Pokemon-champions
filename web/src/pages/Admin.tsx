import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth'
import {
  listAdminReports,
  resolveReport,
  warnUser,
  banUser,
  unbanUser,
  adminDeleteSample,
  type AdminReport,
} from '@/lib/reports'
import Icon from '@/components/Icon'

const STATUS_STYLE: Record<AdminReport['status'], string> = {
  open: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  resolved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  dismissed: 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400',
}

export default function Admin() {
  const { t, i18n } = useTranslation()
  const { user, init } = useAuth()
  const [reports, setReports] = useState<AdminReport[] | 'forbidden' | null>(null)
  const [msg, setMsg] = useState('')

  const reload = () => listAdminReports().then(setReports)
  useEffect(() => {
    void init()
    reload()
  }, [init])

  const flash = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 2500)
  }
  const after = async (ok: boolean) => {
    if (ok) {
      flash(t('admin.actionDone'))
      await reload()
    }
  }

  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (!user?.isAdmin || reports === 'forbidden') {
    return (
      <div className="mx-auto max-w-md">
        <div className="card grid place-items-center gap-3 p-10 text-center">
          <Icon name="shield" size={26} className="text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-bold">{t('admin.forbidden')}</p>
          <Link to="/" className="text-sm font-bold text-volt-600 dark:text-volt-400">
            ← {t('nav.home')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">{t('admin.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('admin.subtitle')}</p>
      </div>

      {msg && (
        <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {msg}
        </div>
      )}

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold">{t('admin.reports')}</h2>
          <Link to="/notices" className="text-[11px] font-bold text-sky-600 hover:underline dark:text-sky-400">
            {t('admin.noticeCompose')}
          </Link>
        </div>

        {reports === null && <div className="mt-4 h-32 animate-pulse rounded-xl bg-zinc-100 dark:bg-white/5" />}

        {Array.isArray(reports) && reports.length === 0 && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            {t('admin.empty')} <span className="text-[11px] text-zinc-400">({t('admin.needBackend')})</span>
          </p>
        )}

        <div className="mt-3 space-y-3">
          {Array.isArray(reports) &&
            reports.map((r) => (
              <article key={r.id} className="rounded-xl border border-zinc-200 p-3.5 dark:border-white/8">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                  <span className={`rounded-md px-2 py-0.5 ${STATUS_STYLE[r.status]}`}>{t(`admin.status_${r.status}`)}</span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-white/8 dark:text-zinc-300">
                    {t(`admin.target_${r.target_type}`)} · {r.target_id}
                  </span>
                  <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-red-500">{t(`report.reason_${r.reason}`)}</span>
                  <span className="ml-auto text-zinc-400 dark:text-zinc-600">{fmtDate(r.created_at)}</span>
                </div>
                {r.detail && <p className="mt-2 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">{r.detail}</p>}
                <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-600">
                  {t('admin.reporter')}: @{r.reporter_username}
                </p>

                {r.status === 'open' && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {r.target_type === 'sample' && (
                      <ActionBtn
                        danger
                        label={t('admin.deleteContent')}
                        onClick={async () => {
                          if (!confirm(t('admin.confirmDelete'))) return
                          if (await adminDeleteSample(r.target_id)) await after(await resolveReport(r.id, 'resolved'))
                        }}
                      />
                    )}
                    {r.target_type === 'user' && (
                      <>
                        <ActionBtn label={t('admin.warn')} onClick={async () => after(await warnUser(r.target_id))} />
                        <ActionBtn label={t('admin.ban3')} onClick={async () => after(await banUser(r.target_id, 3))} />
                        <ActionBtn label={t('admin.ban7')} onClick={async () => after(await banUser(r.target_id, 7))} />
                        <ActionBtn danger label={t('admin.ban30')} onClick={async () => after(await banUser(r.target_id, 30))} />
                        <ActionBtn label={t('admin.unban')} onClick={async () => after(await unbanUser(r.target_id))} />
                      </>
                    )}
                    <span className="ml-auto flex gap-1.5">
                      <ActionBtn primary label={t('admin.resolve')} onClick={async () => after(await resolveReport(r.id, 'resolved'))} />
                      <ActionBtn label={t('admin.dismiss')} onClick={async () => after(await resolveReport(r.id, 'dismissed'))} />
                    </span>
                  </div>
                )}
              </article>
            ))}
        </div>
      </section>
    </div>
  )
}

function ActionBtn({
  label,
  onClick,
  danger,
  primary,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors',
        primary
          ? 'border-volt-500 bg-volt-400/15 text-volt-700 dark:text-volt-300'
          : danger
            ? 'border-red-300 text-red-500 hover:bg-red-500/10 dark:border-red-500/40'
            : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-white/10 dark:text-zinc-300',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
