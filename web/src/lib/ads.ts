/**
 * AdSense configuration. The publisher id is public (it ships in the ad tag),
 * so it defaults to the project's account and can be overridden via
 * VITE_ADSENSE_CLIENT. Ads load only on the live site — never on localhost
 * (dev / preview / E2E) — so there are no console errors or invalid-traffic
 * pings before deploy.
 */
export const ADSENSE_CLIENT = (import.meta.env.VITE_ADSENSE_CLIENT as string) || 'ca-pub-4878038748315573'

export const AD_BANNER_SLOT = import.meta.env.VITE_ADSENSE_SLOT_BANNER as string | undefined

export const adsEnabled = (): boolean => {
  if (!ADSENSE_CLIENT) return false
  if (typeof location === 'undefined') return false
  return !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname)
}
