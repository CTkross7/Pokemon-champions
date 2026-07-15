/**
 * App version + live deploy-detection.
 *
 * The running bundle bakes in `__APP_VERSION__` (from package.json at build
 * time). A tiny `/version.json` is emitted alongside the build carrying the
 * *deployed* version. Comparing the two lets a long-lived tab notice that a
 * newer build shipped while the user was mid-session, so we can offer a
 * "save & reload" prompt instead of silently serving stale code.
 */
declare const __APP_VERSION__: string

/** Version compiled into the currently running bundle. */
export const APP_VERSION: string = __APP_VERSION__

/** Fetches the deployed version from /version.json (cache-busted). null on failure. */
export async function fetchDeployedVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const body = (await res.json()) as { version?: string }
    return typeof body.version === 'string' ? body.version : null
  } catch {
    return null
  }
}

/** True when the deployed version differs from the one we booted with. */
export function isNewerDeploy(deployed: string | null): boolean {
  return Boolean(deployed) && deployed !== APP_VERSION
}
