import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  return (
    <article className="prose-slate max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('about.title')}</h1>
      <p className="leading-relaxed text-slate-700 dark:text-slate-300">{t('about.body')}</p>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t('about.dataTitle')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t('about.dataBody')}</p>
      </section>

      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t('app.disclaimer')}</p>
    </article>
  )
}
