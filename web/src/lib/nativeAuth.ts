/**
 * Native Google Sign-In for the ChampsNote Android app.
 *
 * Google blocks OAuth inside a WebView (disallowed_useragent), and an external
 * browser / custom tab won't carry the session back into the app (separate
 * cookie jars). The fix: use the native Google SDK to get an id_token, then POST
 * it to our Worker (`/api/auth/google/native`) FROM the app WebView. The Worker
 * verifies it and replies with the session cookie — same-origin, so it lands in
 * the app and it stays signed in. No browser bounce.
 *
 * We reach the native plugin via Capacitor's registerPlugin (by name) so the
 * plain-web bundle never needs the plugin's JS. The native module ships in the
 * APK via app/package.json (@codetrix-studio/capacitor-google-auth) + cap sync.
 *
 * Requires VITE_GOOGLE_CLIENT_ID (the *Web* OAuth client id — public; must equal
 * the Worker's GOOGLE_CLIENT_ID so the id_token audience matches). When unset,
 * nativeGoogleAvailable() is false and callers fall back to the browser path.
 */
import { registerPlugin } from '@capacitor/core'
import { isOwnApp } from '@/lib/inAppBrowser'

const CLIENT_ID = ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '').trim()

interface GoogleAuthPlugin {
  initialize(options: { clientId: string; scopes: string[]; grantOfflineAccess: boolean }): Promise<void>
  signIn(): Promise<{ authentication?: { idToken?: string } }>
  signOut(): Promise<void>
}

const GoogleAuth = registerPlugin<GoogleAuthPlugin>('GoogleAuth')

/** True only inside our app AND when a Web client id is configured. */
export const nativeGoogleAvailable = (): boolean => isOwnApp() && CLIENT_ID.length > 0

let initialized = false

/**
 * Run the native Google sign-in and exchange the id_token for a session cookie.
 * Returns true on success (caller should refresh auth), false to fall back.
 */
export async function nativeGoogleLogin(): Promise<boolean> {
  if (!nativeGoogleAvailable()) return false
  try {
    if (!initialized) {
      await GoogleAuth.initialize({ clientId: CLIENT_ID, scopes: ['profile', 'email'], grantOfflineAccess: false })
      initialized = true
    }
    const res = await GoogleAuth.signIn()
    const idToken = res?.authentication?.idToken
    if (!idToken) return false
    const r = await fetch('/api/auth/google/native', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    })
    return r.ok
  } catch {
    return false
  }
}
