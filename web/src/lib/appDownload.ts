/**
 * Android APK download config + platform detection.
 *
 * The Play Store build (AAB) is the primary distribution, but we also offer a
 * direct-download APK for users who want to sideload without the store. The APK
 * itself is hosted outside the git repo (GitHub Releases recommended, or the
 * Pages /public folder) and pointed to via build-time env vars so shipping a
 * new APK never needs a code change — only a redeploy with a new URL.
 *
 *   VITE_APK_URL      full download URL of the .apk (empty ⇒ "coming soon")
 *   VITE_APK_VERSION  version label shown on the button (defaults to APP_VERSION)
 *   VITE_APK_SIZE     human size label, e.g. "8.4 MB" (optional)
 *   VITE_PLAY_URL     Play Store listing URL once published (optional)
 */
import { APP_VERSION } from '@/lib/version'
import { isInApp } from '@/lib/ads'

export const APK_URL = ((import.meta.env.VITE_APK_URL as string) || '').trim()
export const APK_VERSION = ((import.meta.env.VITE_APK_VERSION as string) || APP_VERSION).trim()
export const APK_SIZE = ((import.meta.env.VITE_APK_SIZE as string) || '').trim()
export const PLAY_URL = ((import.meta.env.VITE_PLAY_URL as string) || '').trim()

/** A direct APK download is available to link to. */
export const apkAvailable = (): boolean => APK_URL.length > 0
/** The Play Store listing is live. */
export const playAvailable = (): boolean => PLAY_URL.length > 0

/** Coarse platform sniffing — only used to tailor copy/CTA emphasis, never to gate. */
export function detectPlatform(): 'android' | 'ios' | 'other' {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent || ''
  if (/android/i.test(ua)) return 'android'
  // iPadOS 13+ reports as Mac; the touch check disambiguates a real iPad.
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && 'ontouchend' in document)) return 'ios'
  return 'other'
}

/** Already running inside the ChampsNote Android app — no need to download it. */
export { isInApp }
