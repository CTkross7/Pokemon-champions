/**
 * Current ranked-battle regulation / season info for the Home page.
 *
 * The regulation label and its season dates come from a curated JSON file
 * (public/data/regulation.json) that the operator keeps in sync with the
 * OFFICIAL Champions ranked schedule — never guessed. When a verified endDate
 * is present the Home page renders a live D-day countdown; while it is null the
 * label shows without any fabricated date.
 */
export interface Regulation {
  regulation: string
  label: { ko: string; en: string }
  season: string | null
  startDate: string | null
  endDate: string | null
  source: string
}

let promise: Promise<Regulation | null> | null = null
export function loadRegulation(): Promise<Regulation | null> {
  promise ??= fetch('/data/regulation.json')
    .then((r) => (r.ok ? (r.json() as Promise<Regulation>) : null))
    .catch(() => null)
  return promise
}

/** Whole days from now until an end date (YYYY-MM-DD, treated as end of day). */
export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const end = new Date(`${dateStr}T23:59:59+09:00`).getTime()
  if (Number.isNaN(end)) return null
  return Math.ceil((end - Date.now()) / 86_400_000)
}
