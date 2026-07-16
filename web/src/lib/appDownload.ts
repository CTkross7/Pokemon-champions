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
 *   VITE_APK_SIZE     human size label, e.g. "8.4 MB" (optional)
 *   VITE_PLAY_URL     Play Store listing URL once published (optional)
 */
import { APP_VERSION } from '@/lib/version'
import { isInApp } from '@/lib/ads'

// Defaults to the same-origin file we host at web/public/champsnote.apk, so the
// download works with zero config. Override with VITE_APK_URL only if hosting
// the .apk elsewhere.
export const APK_URL = ((import.meta.env.VITE_APK_URL as string) || '/champsnote.apk').trim()
// APK version is always the site version, so the download page and the running
// web app never disagree. Rebuild + re-upload the APK on each release (its
// build.gradle versionName is kept equal to the web package.json version).
export const APK_VERSION = APP_VERSION
// Optional manual size fallback; normally the size is auto-detected (probeApk).
export const APK_SIZE = ((import.meta.env.VITE_APK_SIZE as string) || '').trim()
export const PLAY_URL = ((import.meta.env.VITE_PLAY_URL as string) || '').trim()

/** A direct APK download is available to link to. */
export const apkAvailable = (): boolean => APK_URL.length > 0
/** The Play Store listing is live. */
export const playAvailable = (): boolean => PLAY_URL.length > 0

/** Human-readable byte size, e.g. 7340032 → "7.0 MB". Empty for 0/unknown. */
export function formatBytes(n: number): string {
  if (!n || n <= 0) return ''
  const mb = n / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(n / 1024))} KB`
}

/**
 * Probe the hosted APK: confirms it exists and reads its size from the response
 * headers — so the download page shows the real, current file size with no
 * manual config. Returns { size } when reachable, or null when missing/404.
 */
export async function probeApk(url: string = APK_URL): Promise<{ size: string } | null> {
  const readLen = (res: Response): number => {
    const cl = res.headers.get('content-length')
    if (cl) return Number(cl)
    // Range fallback: "bytes 0-0/12345" → total after the slash.
    const cr = res.headers.get('content-range')
    const total = cr?.split('/')[1]
    return total ? Number(total) : 0
  }
  try {
    const head = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    if (head.ok) return { size: formatBytes(readLen(head)) }
  } catch {
    /* HEAD unsupported/blocked — try a tiny ranged GET below */
  }
  try {
    const ranged = await fetch(url, { headers: { Range: 'bytes=0-0' }, cache: 'no-store' })
    if (ranged.ok || ranged.status === 206) return { size: formatBytes(readLen(ranged)) }
  } catch {
    /* unreachable */
  }
  return null
}

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
