/**
 * Self-healing D1 schema migration.
 *
 * Cloudflare Pages/Workers have no "run migrations" deploy step, and asking the
 * operator to paste ALTER TABLE statements into the D1 console by hand is exactly
 * how a live install ends up with a users table that is missing the newer
 * columns — which then makes profile edits (display_name_changed_at) throw a 500
 * that surfaces to the user as "처리에 실패했습니다".
 *
 * So we bring the schema forward ourselves, idempotently, on the first API
 * request per isolate. CREATE TABLE IF NOT EXISTS is safe to repeat; ADD COLUMN
 * is not, so each ALTER is wrapped and "duplicate column name" is swallowed.
 */
import type { D1Database } from './d1'

let migrated: Promise<void> | null = null

const TABLES = [
  `CREATE TABLE IF NOT EXISTS samples (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL, team TEXT NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0, views INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_samples_created_at ON samples (created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, email TEXT,
    provider TEXT NOT NULL, provider_id TEXT NOT NULL, avatar_url TEXT, password_hash TEXT,
    display_name_changed_at INTEGER, username_changed_at INTEGER, avatar_custom INTEGER NOT NULL DEFAULT 0,
    onboarded INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, UNIQUE (provider, provider_id))`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'notice',
    pinned INTEGER NOT NULL DEFAULT 0, author TEXT, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_notices_created ON notices (pinned DESC, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY, target_type TEXT NOT NULL, target_id TEXT NOT NULL, reason TEXT NOT NULL,
    detail TEXT, reporter_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', resolved_by TEXT,
    resolved_at INTEGER, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS moderation (
    user_id TEXT PRIMARY KEY, warnings INTEGER NOT NULL DEFAULT 0, banned_until INTEGER, note TEXT,
    updated_at INTEGER NOT NULL)`,
]

// Columns added after the original users table shipped. Safe to attempt every
// boot; already-present columns raise "duplicate column name", which we ignore.
const ADD_COLUMNS = [
  `ALTER TABLE users ADD COLUMN password_hash TEXT`,
  `ALTER TABLE users ADD COLUMN display_name_changed_at INTEGER`,
  `ALTER TABLE users ADD COLUMN username_changed_at INTEGER`,
  `ALTER TABLE users ADD COLUMN onboarded INTEGER NOT NULL DEFAULT 1`,
  // 1 = the user picked their own avatar; Google re-login must NOT overwrite it.
  `ALTER TABLE users ADD COLUMN avatar_custom INTEGER NOT NULL DEFAULT 0`,
]

async function run(db: D1Database): Promise<void> {
  for (const sql of TABLES) {
    try {
      await db.prepare(sql).run()
    } catch {
      // A pre-existing table with a slightly different definition is fine; the
      // ADD COLUMN pass below reconciles the columns we actually depend on.
    }
  }
  for (const sql of ADD_COLUMNS) {
    try {
      await db.prepare(sql).run()
    } catch {
      // duplicate column name — already migrated.
    }
  }
}

/** Ensures the schema is current. Runs once per isolate; cheap no-op after. */
export function ensureSchema(db: D1Database): Promise<void> {
  if (!migrated) migrated = run(db).catch(() => { migrated = null })
  return migrated
}
