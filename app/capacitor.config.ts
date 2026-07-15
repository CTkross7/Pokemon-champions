import type { CapacitorConfig } from '@capacitor/cli'

/**
 * ChampsNote Android launcher.
 *
 * This is a thin Capacitor WebView shell that loads the LIVE site
 * (champsnote.pages.dev) so the app always reflects the latest web deploy —
 * no store update needed for content changes. Native pieces the web can't do:
 *   • AdMob ads (Google forbids AdSense inside a WebView/app)
 *   • splash screen + status-bar theming
 *   • Android hardware back-button handling
 *
 * The WebView user-agent gets "ChampsNoteApp" appended so the web app can
 * detect it (see web/src/lib/ads.ts → isInApp) and suppress web AdSense,
 * letting native AdMob own the ad slots instead.
 */
const config: CapacitorConfig = {
  appId: 'dev.champsnote.app',
  appName: '챔스노트',
  // Capacitor requires a webDir with an index.html even when loading a remote
  // server.url — www/index.html is the offline/first-paint fallback.
  webDir: 'www',
  server: {
    url: 'https://champsnote.pages.dev',
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    // Detected by the web app to swap AdSense → native AdMob.
    appendUserAgent: 'ChampsNoteApp',
    backgroundColor: '#050505',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: '#050505',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    // AdMob's *App ID* is set in AndroidManifest (see README); ad-unit ids live
    // in the web app's app-ads config so they can be tuned without a rebuild.
  },
}

export default config
