import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Icon from '@/components/Icon'

export default function UnderConstruction({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()

  return (
    <div className="grid place-items-center py-16 sm:py-24">
      <div className="card w-full max-w-md space-y-5 p-8 text-center sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-violet-glow text-white shadow-lift">
          <Icon name="sparkles" size={28} />
        </span>
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold tracking-tight">{t(titleKey)}</h1>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('common.underConstruction')}</p>
          <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            {t('common.underConstructionDesc')}
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex h-10 items-center gap-1 rounded-full bg-slate-900 px-5 text-sm font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.98] dark:bg-white dark:text-slate-900"
        >
          {t('common.backHome')}
        </Link>
      </div>
    </div>
  )
}
