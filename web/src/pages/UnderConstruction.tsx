import { useTranslation } from 'react-i18next'

export default function UnderConstruction({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()

  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-slate-300 py-24 text-center dark:border-slate-700">
      <div className="max-w-md space-y-3 px-4">
        <p className="text-4xl">🚧</p>
        <h1 className="text-xl font-bold">{t(titleKey)}</h1>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('common.underConstruction')}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.underConstructionDesc')}</p>
      </div>
    </div>
  )
}
