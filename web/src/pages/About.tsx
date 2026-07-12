import { useTranslation } from 'react-i18next'
import Icon from '@/components/Icon'
import Logo from '@/components/Logo'

export default function About() {
  const { t } = useTranslation()

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center gap-4">
        <Logo size={52} />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t('about.title')}</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('app.tagline')}</p>
        </div>
      </header>

      <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{t('about.body')}</p>

      <section className="card p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-300">
            <Icon name="shield" size={18} />
          </span>
          <h2 className="text-[15px] font-bold">{t('about.dataTitle')}</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t('about.dataBody')}</p>
      </section>

      <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">{t('app.disclaimer')}</p>
    </article>
  )
}
