import { useTranslation } from 'react-i18next'
import Icon, { type IconName } from '@/components/Icon'
import Logo from '@/components/Logo'

const DEV_EMAIL = 'ctkross.dev@gmail.com'

interface Item {
  t: string
  d: string
}

const FEATURE_ICONS: IconName[] = ['book', 'calc', 'users', 'zap', 'sparkles', 'bell']

const WHY_ICONS: IconName[] = ['shield', 'sparkles', 'zap', 'book']

export default function About() {
  const { t } = useTranslation()
  const features = t('about.features', { returnObjects: true }) as unknown as Item[]
  const sources = t('about.dataSources', { returnObjects: true }) as unknown as Item[]
  const why = t('about.why', { returnObjects: true }) as unknown as Item[]
  const how = t('about.how', { returnObjects: true }) as unknown as Item[]

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center gap-4">
        <Logo size={52} />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t('about.title')}</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('app.tagline')}</p>
        </div>
      </header>

      <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">{t('about.intro')}</p>

      {/* Features */}
      <section className="cv-section">
        <h2 className="mb-3 text-[15px] font-bold">{t('about.featuresTitle')}</h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(Array.isArray(features) ? features : []).map((f, i) => (
            <div key={f.t} className="card flex items-start gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-volt-100 text-volt-800 dark:bg-volt-400/12 dark:text-volt-300">
                <Icon name={FEATURE_ICONS[i] ?? 'sparkles'} size={17} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold">{f.t}</h3>
                <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why ChampsNote — differentiation */}
      <section className="cv-section">
        <h2 className="mb-3 text-[15px] font-bold">{t('about.whyTitle')}</h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(Array.isArray(why) ? why : []).map((w, i) => (
            <div key={w.t} className="card flex items-start gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-400/12 dark:text-sky-300">
                <Icon name={WHY_ICONS[i] ?? 'shield'} size={17} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold">{w.t}</h3>
                <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{w.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How to use — numbered flow */}
      <section className="cv-section card p-6">
        <h2 className="text-[15px] font-bold">{t('about.howTitle')}</h2>
        <ol className="mt-4 space-y-3">
          {(Array.isArray(how) ? how : []).map((h) => (
            <li key={h.t} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-volt-400 text-[11px] font-black text-black">
                {h.t.match(/^\d+/)?.[0] ?? '•'}
              </span>
              <div>
                <p className="text-sm font-bold">{h.t.replace(/^\d+\.\s*/, '')}</p>
                <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{h.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Data update policy */}
      <section className="cv-section card p-6">
        <h2 className="text-[15px] font-bold">{t('about.updateTitle')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{t('about.updateBody')}</p>
      </section>

      {/* Data sources */}
      <section className="cv-section card p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-400/12 dark:text-sky-300">
            <Icon name="shield" size={18} />
          </span>
          <h2 className="text-[15px] font-bold">{t('about.dataTitle')}</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{t('about.dataBody')}</p>
        <ul className="mt-4 space-y-2.5">
          {(Array.isArray(sources) ? sources : []).map((s) => (
            <li key={s.t} className="flex gap-3">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-volt-500" />
              <div>
                <p className="text-sm font-bold">{s.t}</p>
                <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{s.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Contact + developer */}
      <section className="cv-section card p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-400/12 dark:text-violet-300">
            <Icon name="mail" size={18} />
          </span>
          <h2 className="text-[15px] font-bold">{t('about.contactTitle')}</h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{t('about.contactBody')}</p>
        <a
          href={`mailto:${DEV_EMAIL}?subject=${encodeURIComponent('[챔스노트] 문의')}`}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-volt-400 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-volt-300"
        >
          <Icon name="mail" size={15} />
          {DEV_EMAIL}
        </a>
        <div className="mt-5 flex items-center gap-3.5 border-t border-zinc-100 pt-5 dark:border-white/6">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-zinc-900 text-sm font-black text-white dark:bg-volt-400 dark:text-black">
            CK
          </span>
          <div>
            <h3 className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">{t('about.developer')}</h3>
            <p className="text-lg font-extrabold tracking-tight">CTkross</p>
          </div>
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">{t('app.disclaimer')}</p>
    </article>
  )
}
