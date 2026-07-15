/**
 * In-app browser (embedded WebView) detection + "escape to a real browser".
 *
 * Google OAuth blocks sign-in from embedded WebViews with `403
 * disallowed_useragent` (its "secure browser use" policy). This hits users who
 * open the site from KakaoTalk / Instagram / Facebook / Line / Naver in-app
 * browsers, and our own Capacitor app WebView. The fix is to detect those and
 * either bounce the page out to the system browser (where Google works) or fall
 * back to email/password login (which has no such restriction).
 */
const PATTERNS: ReadonlyArray<[RegExp, string]> = [
  [/KAKAOTALK/i, 'KakaoTalk'],
  [/\bLine\//i, 'LINE'],
  [/Instagram/i, 'Instagram'],
  [/FBAN|FBAV|FB_IAB/i, 'Facebook'],
  [/NAVER\(inapp|NAVER\b/i, 'Naver'],
  [/DaumApps|DaumDevice/i, 'Daum'],
  [/\bBAND\//i, 'BAND'],
  [/everytimeApp/i, 'Everytime'],
  [/ChampsNoteApp/i, 'ChampsNote'], // our own Android launcher WebView
]

export interface InApp {
  isInApp: boolean
  name: string
}

/** Detects common in-app browsers (and our own app WebView). */
export function detectInAppBrowser(): InApp {
  if (typeof navigator === 'undefined') return { isInApp: false, name: '' }
  const ua = navigator.userAgent
  for (const [re, name] of PATTERNS) if (re.test(ua)) return { isInApp: true, name }
  return { isInApp: false, name: '' }
}

export const isIOS = (): boolean =>
  typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)

/**
 * Try to reopen `url` in the device's default browser. Returns false when it
 * can't be forced (mainly iOS in-app browsers) so the caller can show manual
 * "open in browser" guidance instead.
 */
export function openInExternalBrowser(url: string = location.href): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent

  // KakaoTalk has a dedicated scheme to open the system browser.
  if (/KAKAOTALK/i.test(ua)) {
    location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url)
    return true
  }
  // LINE: append the documented flag to escape its in-app browser.
  if (/\bLine\//i.test(ua)) {
    location.href = url + (url.includes('?') ? '&' : '?') + 'openExternalBrowser=1'
    return true
  }
  // Android (Instagram/Facebook/Naver/etc.): force Chrome via an intent URL.
  if (/Android/i.test(ua)) {
    try {
      const u = new URL(url)
      location.href =
        `intent://${u.host}${u.pathname}${u.search}` +
        `#Intent;scheme=https;package=com.android.chrome;end`
      return true
    } catch {
      return false
    }
  }
  // iOS in-app browsers can't be forced out programmatically.
  return false
}
