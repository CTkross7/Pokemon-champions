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
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('app.tagline')}</p>
        </div>
      </header>

      <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">{t('about.body')}</p>

      <section className="card p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-volt-100 text-volt-800 dark:bg-volt-400/12 dark:text-volt-300">
            <Icon name="shield" size={18} />
          </span>
          <h2 className="text-[15px] font-bold">{t('about.dataTitle')}</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{t('about.dataBody')}</p>
      </section>

      <section className="card flex items-center gap-3.5 p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-zinc-900 text-sm font-black text-white dark:bg-volt-400 dark:text-black">
          CK
        </span>
        <div>
          <h2 className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">{t('about.developer')}</h2>
          <p className="text-lg font-extrabold tracking-tight">CTkross</p>
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">{t('app.disclaimer')}</p>
    </article>
  )
}
