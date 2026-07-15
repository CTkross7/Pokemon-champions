/**
 * Native AdMob ads for the Android launcher.
 *
 * When the site runs inside the ChampsNote Capacitor shell (isInApp), web
 * AdSense is disabled (see ads.ts) and this shows native AdMob instead —
 * Capacitor injects the native bridge into the WebView, so the plugin calls
 * here reach the Android AdMob SDK bundled in the app. On the plain website
 * these functions no-op, and the plugin is only ever dynamically imported
 * in-app so the regular web bundle isn't affected.
 *
 * The ids below are Google's PUBLIC TEST units — safe to ship, but they earn
 * nothing. Set the real AdMob unit ids via env for production:
 *   VITE_ADMOB_BANNER, VITE_ADMOB_INTERSTITIAL, VITE_ADMOB_TESTING=false
 */
import { isInApp } from '@/lib/ads'

const BANNER_ID = (import.meta.env.VITE_ADMOB_BANNER as string) || 'ca-app-pub-3940256099942544/6300978111'
const INTERSTITIAL_ID =
  (import.meta.env.VITE_ADMOB_INTERSTITIAL as string) || 'ca-app-pub-3940256099942544/1033173712'
const TESTING = (import.meta.env.VITE_ADMOB_TESTING as string) !== 'false'

let started = false

/** Initialize AdMob and show the bottom banner. Safe to call anywhere. */
export async function initAppAds(): Promise<void> {
  if (!isInApp() || started) return
  started = true
  try {
    const { AdMob, BannerAdPosition, BannerAdSize } = await import('@capacitor-community/admob')
    await AdMob.initialize({ initializeForTesting: TESTING })
    await AdMob.showBanner({
      adId: BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: TESTING,
    })
  } catch {
    // Bridge not ready / not actually in the app — leave web ads path alone.
    started = false
  }
}

let navCount = 0

/** Show an interstitial every Nth navigation — light touch, non-intrusive. */
export async function maybeShowInterstitial(everyN = 10): Promise<void> {
  if (!isInApp()) return
  navCount += 1
  if (navCount % everyN !== 0) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID, isTesting: TESTING })
    await AdMob.showInterstitial()
  } catch {
    /* ignore — never block navigation on an ad */
  }
}
