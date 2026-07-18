/**
 * AdSense configuration. The publisher id is public (it ships in the ad tag),
 * so it defaults to the project's account and can be overridden via
 * VITE_ADSENSE_CLIENT. Ads load only on the live site — never on localhost
 * (dev / preview / E2E) — so there are no console errors or invalid-traffic
 * pings before deploy.
 */
export const ADSENSE_CLIENT = (import.meta.env.VITE_ADSENSE_CLIENT as string) || 'ca-pub-5919918265532990'

export const AD_BANNER_SLOT = import.meta.env.VITE_ADSENSE_SLOT_BANNER as string | undefined

/**
 * True when the site is running inside the ChampsNote Android launcher app.
 * The Capacitor shell appends "ChampsNoteApp" to the WebView user-agent
 * (see app/capacitor.config.ts). Inside the app we must NOT load AdSense —
 * Google prohibits AdSense in WebView/app containers, and the app shows native
 * AdMob ads instead.
 */
export const isInApp = (): boolean =>
  typeof navigator !== 'undefined' && /ChampsNoteApp/.test(navigator.userAgent)

export const adsEnabled = (): boolean => {
  if (!ADSENSE_CLIENT) return false
  if (typeof location === 'undefined') return false
  if (isInApp()) return false // native AdMob handles ads in the app
  return !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname)
}
