import { useTranslation } from 'react-i18next'
import { TYPE_COLORS, TYPE_KO, type TypeName } from '@/lib/typechart'

interface TypeBadgeProps {
  type: string
  size?: 'sm' | 'md'
}

export default function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const { i18n } = useTranslation()
  const name = type as TypeName
  const label = i18n.language === 'ko' ? (TYPE_KO[name] ?? type) : type
  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-md font-bold text-white',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
      ].join(' ')}
      style={{ backgroundColor: TYPE_COLORS[name] ?? '#777', textShadow: '0 1px 1px rgb(0 0 0 / 0.35)' }}
    >
      {label}
    </span>
  )
}
