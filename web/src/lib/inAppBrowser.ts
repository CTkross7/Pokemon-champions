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

  // Our own Capacitor app WebView. An `intent://` URL is NOT resolved by the
  // Capacitor WebView (that's a Chrome feature), which is why the old approach
  // did nothing here. Capacitor routes window.open(_blank) to the OS, and a
  // final ACTION_VIEW intent lets the OS pick the default browser.
  if (/ChampsNoteApp/i.test(ua)) {
    try {
      const w = window.open(url, '_blank')
      if (w) return true
    } catch {
      /* fall through to the intent attempt */
    }
    try {
      const u = new URL(url)
      location.href =
        `intent://${u.host}${u.pathname}${u.search}` +
        `#Intent;scheme=https;action=android.intent.action.VIEW;` +
        `S.browser_fallback_url=${encodeURIComponent(url)};end`
      return true
    } catch {
      return false
    }
  }
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
  // Android (Instagram/Facebook/Naver/etc.): open in a full browser via an
  // ACTION_VIEW intent (default browser, with a fallback URL if none resolves).
  if (/Android/i.test(ua)) {
    try {
      const u = new URL(url)
      location.href =
        `intent://${u.host}${u.pathname}${u.search}` +
        `#Intent;scheme=https;action=android.intent.action.VIEW;` +
        `S.browser_fallback_url=${encodeURIComponent(url)};end`
      return true
    } catch {
      return false
    }
  }
  // iOS in-app browsers can't be forced out programmatically.
  return false
}

/** True for our own Capacitor app WebView (vs a third-party in-app browser). */
export const isOwnApp = (): boolean =>
  typeof navigator !== 'undefined' && /ChampsNoteApp/i.test(navigator.userAgent)
