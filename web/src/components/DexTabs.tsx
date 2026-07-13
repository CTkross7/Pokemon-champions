import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-4 py-1.5 text-sm font-bold transition-colors',
    isActive
      ? 'bg-zinc-900 text-white dark:bg-volt-400 dark:text-black'
      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
  ].join(' ')

export default function DexTabs() {
  const { t } = useTranslation()
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200/80 bg-white p-1 dark:border-white/8 dark:bg-white/4">
      <NavLink to="/dex" end className={tabClass}>
        {t('dex.tabPokemon')}
      </NavLink>
      <NavLink to="/dex/types" className={tabClass}>
        {t('dex.tabTypes')}
      </NavLink>
      <NavLink to="/stats" className={tabClass}>
        {t('dex.tabStats')}
      </NavLink>
    </div>
  )
}
