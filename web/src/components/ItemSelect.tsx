import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadItems, groupItems, ITEM_CAT_LABEL, type ItemEntry } from '@/lib/items'

/**
 * Item picker offering every Champions-legal held item (grouped by category),
 * localized. `value`/`onChange` use the Showdown display name (empty = none),
 * matching what the damage engine and saved teams expect.
 */
export default function ItemSelect({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (name: string) => void
  className?: string
}) {
  const { t, i18n } = useTranslation()
  const ko = i18n.language === 'ko'
  const [items, setItems] = useState<ItemEntry[]>([])

  useEffect(() => {
    loadItems().then(setItems)
  }, [])

  const groups = groupItems(items)

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">{t('calc.itemNone')}</option>
      {/* Keep the current value selectable even if items are still loading. */}
      {items.length === 0 && value && <option value={value}>{value}</option>}
      {groups.map((g) => (
        <optgroup key={g.cat} label={ko ? ITEM_CAT_LABEL[g.cat].ko : ITEM_CAT_LABEL[g.cat].en}>
          {g.items.map((it) => (
            <option key={it.id} value={it.name}>
              {ko ? it.ko : it.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
