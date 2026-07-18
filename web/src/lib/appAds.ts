/**
 * Native AdMob ads for the Android launcher.
 *
 * Ad split by platform (Google policy — AdSense is forbidden inside a WebView):
 *   • Website in a browser → Google AdSense   (see main.tsx / ads.ts)
 *   • Inside the ChampsNote app (isInApp)      → native AdMob (this file)
 * Both accounts stay active; each serves its own surface. AdSense is never
 * loaded in the app, and AdMob is never loaded on the plain website.
 *
 * Capacitor injects the native bridge into the WebView, so these plugin calls
 * reach the Android AdMob SDK bundled in the app. The plugin is only ever
 * dynamically imported in-app, so the regular web bundle is unaffected.
 *
 * The ids below are Google's PUBLIC TEST units — safe to ship but earn nothing.
 * Set real AdMob ids via env for production revenue:
 *   VITE_ADMOB_BANNER=ca-app-pub-XXXX/BBBB
 *   VITE_ADMOB_INTERSTITIAL=ca-app-pub-XXXX/IIII
 *   VITE_ADMOB_TESTING=false        (serve live ads)
 *   VITE_ADMOB_TEST_DEVICE=ABCD1234 (optional: your device's test id)
 * The AdMob *App ID* lives in android/app/src/main/AndroidManifest.xml.
 */
import { isInApp } from '@/lib/ads'

const BANNER_ID = (import.meta.env.VITE_ADMOB_BANNER as string) || 'ca-app-pub-5919918265532990/8995827229'
const INTERSTITIAL_ID =
  (import.meta.env.VITE_ADMOB_INTERSTITIAL as string) || 'ca-app-pub-5919918265532990/3184831417'
// Real ad-unit ids above, but test mode stays ON until you set
// VITE_ADMOB_TESTING=false — so the app shows Google test ads (never your live
// ads) during development, avoiding invalid-traffic strikes on your account.
const TESTING = (import.meta.env.VITE_ADMOB_TESTING as string) !== 'false'
const TEST_DEVICE = (import.meta.env.VITE_ADMOB_TEST_DEVICE as string) || undefined

let started = false

/**
 * Initialize consent (UMP) + AdMob, then show the bottom banner.
 * Safe to call anywhere; no-op outside the app.
 */
export async function initAppAds(): Promise<void> {
  if (!isInApp() || started) return
  started = true
  try {
    const { AdMob, BannerAdPosition, BannerAdSize, BannerAdPluginEvents, AdmobConsentStatus } =
      await import('@capacitor-community/admob')

    // Reserve layout space for the banner ONLY once it actually renders, using
    // its real reported height. Until then (and if it fails to fill) the tab bar
    // stays flush at the bottom — no empty gap. See --champs-ad-h in index.css.
    const root = document.documentElement
    const setAdHeight = (h: number) =>
      root.style.setProperty('--champs-ad-h', `${Math.max(0, Math.round(h))}px`)
    void AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: { height?: number }) =>
      setAdHeight(size?.height ?? 0),
    )
    void AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => setAdHeight(0))

    // 1) EEA/UK consent (Google User Messaging Platform). Required before ads
    //    can serve to consented-region users; a no-op elsewhere.
    try {
      const info = await AdMob.requestConsentInfo()
      if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
        await AdMob.showConsentForm()
      }
    } catch {
      /* consent unavailable — continue; non-EEA users are unaffected */
    }

    // 2) Initialize the SDK (test mode registers this device for test ads).
    await AdMob.initialize({
      initializeForTesting: TESTING,
      testingDevices: TEST_DEVICE ? [TEST_DEVICE] : [],
    })

    // 3) Adaptive bottom banner. The web layout reserves space for it via the
    //    `champs-in-app` class (see main.tsx + index.css).
    await AdMob.showBanner({
      adId: BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: TESTING,
    })
  } catch {
    // Bridge not ready / not actually in the app — leave the web ad path alone.
    started = false
  }
}

let navCount = 0

/** Show an interstitial every Nth navigation — light touch, never blocks nav. */
export async function maybeShowInterstitial(everyN = 10): Promise<void> {
  if (!isInApp()) return
  navCount += 1
  if (navCount % everyN !== 0) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID, isTesting: TESTING })
    await AdMob.showInterstitial()
  } catch {
    /* ignore — an ad must never interrupt the app */
  }
}
