import { useTranslation } from 'react-i18next'

/**
 * Privacy policy — required for AdSense approval and app-store submission.
 * Reflects the app's actual behavior: local-first storage, no accounts by
 * default, optional community samples stored server-side, and ads only when
 * explicitly enabled.
 */
export default function Privacy() {
  const { t } = useTranslation()
  const sections = t('privacy.sections', { returnObjects: true }) as { h: string; p: string }[]

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">{t('privacy.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('privacy.updated')}</p>
      </header>
      {sections.map((s, i) => (
        <section key={i} className="space-y-1.5">
          <h2 className="text-[15px] font-bold">{s.h}</h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{s.p}</p>
        </section>
      ))}
      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">{t('app.disclaimer')}</p>
    </article>
  )
}
