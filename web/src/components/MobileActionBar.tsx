import type { ReactNode } from 'react'

/**
 * Page-level primary actions, pinned to the bottom of the screen on mobile so
 * they sit within thumb reach (native-app feel), while staying inline on
 * desktop (lg+). One element re-positions across the breakpoint — the buttons
 * are never duplicated in the DOM.
 *
 * The bar floats just above the mobile tab bar (~3.5rem tall). Pages that use
 * it should render a `<MobileActionBarSpacer />` at the end of their content so
 * the last rows aren't hidden behind the floating bar.
 */
export default function MobileActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-[calc(3.5rem+env(safe-area-inset-bottom))] max-lg:z-30 max-lg:mx-auto max-lg:max-w-6xl max-lg:flex-nowrap max-lg:overflow-x-auto max-lg:border-t max-lg:border-zinc-200/70 max-lg:bg-white max-lg:px-4 max-lg:py-2.5 max-lg:shadow-[0_-6px_20px_rgba(0,0,0,0.10)] dark:max-lg:border-white/8 dark:max-lg:bg-surface-dark">
      {children}
    </div>
  )
}

/** Reserves layout space so fixed-bar content doesn't cover the last rows. */
export function MobileActionBarSpacer() {
  return <div aria-hidden className="h-14 lg:hidden" />
}
