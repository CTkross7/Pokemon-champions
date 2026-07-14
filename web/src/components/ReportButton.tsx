import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/auth'
import { createReport, type ReportReason, type ReportTarget } from '@/lib/reports'

const REASONS: ReportReason[] = ['spam', 'abuse', 'inappropriate', 'other']

/** Flag-style report button with a reason modal. Requires sign-in. */
export default function ReportButton({
  targetType,
  targetId,
  className = '',
}: {
  targetType: ReportTarget
  targetId: string
  className?: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('spam')
  const [detail, setDetail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'banned' | 'fail'>('idle')

  const openModal = () => {
    if (!user) return navigate('/login')
    setState('idle')
    setOpen(true)
  }

  const submit = async () => {
    setState('busy')
    const r = await createReport({ targetType, targetId, reason, detail: detail.trim() || undefined })
    if (r === 'ok') setState('done')
    else if (r === 'auth') navigate('/login')
    else if (r === 'banned') setState('banned')
    else setState('fail')
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`text-[11px] font-bold text-zinc-400 transition-colors hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 ${className}`}
      >
        🚩 {t('report.button')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-sm space-y-3 p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[15px] font-bold">{t('report.title')}</h2>

            {state === 'done' ? (
              <>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('report.done')}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl bg-volt-400 py-2.5 text-sm font-bold text-black"
                >
                  {t('report.close')}
                </button>
              </>
            ) : (
              <>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('report.desc')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={[
                        'rounded-lg border px-3 py-2 text-xs font-bold transition-colors',
                        reason === r
                          ? 'border-red-400 bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'border-zinc-200 text-zinc-500 dark:border-white/10 dark:text-zinc-400',
                      ].join(' ')}
                    >
                      {t(`report.reason_${r}`)}
                    </button>
                  ))}
                </div>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder={t('report.detail')}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 dark:border-white/10 dark:bg-white/5"
                />
                {state === 'banned' && <p className="text-[12px] font-bold text-red-500">{t('report.banned')}</p>}
                {state === 'fail' && <p className="text-[12px] font-bold text-red-500">{t('report.fail')}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={state === 'busy'}
                    onClick={submit}
                    className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition-colors enabled:hover:bg-red-400 disabled:opacity-50"
                  >
                    {state === 'busy' ? t('report.submitting') : t('report.submit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-500 dark:border-white/10"
                  >
                    {t('report.close')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
