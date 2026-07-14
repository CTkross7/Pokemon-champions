-- ChampsNote community gallery schema (Cloudflare D1).
-- Apply once after creating the database:
--   npx wrangler d1 execute champsnote --file=./schema.sql --remote
CREATE TABLE IF NOT EXISTS samples (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  author     TEXT NOT NULL,
  team       TEXT NOT NULL,        -- base64url-encoded team (same format as share links)
  likes      INTEGER NOT NULL DEFAULT 0,
  views      INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL      -- epoch millis
);

CREATE INDEX IF NOT EXISTS idx_samples_created_at ON samples (created_at DESC);

-- Accounts (Google sign-in OR email+password). Optional: only needed when the
-- login backend is enabled. See docs/DEPLOYMENT.md for provider setup.
--
-- EXISTING INSTALLS: if the users table was created before, run these once:
--   ALTER TABLE users ADD COLUMN password_hash TEXT;
--   ALTER TABLE users ADD COLUMN display_name_changed_at INTEGER;
--   ALTER TABLE users ADD COLUMN onboarded INTEGER NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,      -- uuid
  username     TEXT NOT NULL UNIQUE,  -- lowercase [a-z0-9_], 3-20
  display_name TEXT NOT NULL,
  email        TEXT,
  provider     TEXT NOT NULL,         -- 'google' | 'email'
  provider_id  TEXT NOT NULL,         -- google sub, or the email for 'email'
  avatar_url   TEXT,                  -- https url or small data: uri
  password_hash TEXT,                 -- only for provider='email' (PBKDF2)
  display_name_changed_at INTEGER,    -- for the 7-day rename cooldown
  onboarded    INTEGER NOT NULL DEFAULT 1, -- 0 = new Google user must pick a username
  created_at   INTEGER NOT NULL,      -- epoch millis
  UNIQUE (provider, provider_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,        -- opaque random session id
  user_id    TEXT NOT NULL REFERENCES users (id),
  expires_at INTEGER NOT NULL,        -- epoch millis
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

-- Notices / announcements board (Phase 12). Public to read; only admins
-- (ADMIN_USERNAMES env var) can post or delete. category: notice | update | event.
CREATE TABLE IF NOT EXISTS notices (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'notice',
  pinned     INTEGER NOT NULL DEFAULT 0,
  author     TEXT,                 -- display name of the posting admin
  created_at INTEGER NOT NULL      -- epoch millis
);

CREATE INDEX IF NOT EXISTS idx_notices_created ON notices (pinned DESC, created_at DESC);

-- Reports (Phase 12). Signed-in users report content; admins review them in
-- the dashboard. status: open | resolved | dismissed.
CREATE TABLE IF NOT EXISTS reports (
  id          TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,       -- 'sample' | 'notice' | 'user'
  target_id   TEXT NOT NULL,
  reason      TEXT NOT NULL,       -- spam | abuse | inappropriate | other
  detail      TEXT,
  reporter_id TEXT NOT NULL REFERENCES users (id),
  status      TEXT NOT NULL DEFAULT 'open',
  resolved_by TEXT,
  resolved_at INTEGER,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);

-- Per-user moderation state: warning count + temporary ban.
CREATE TABLE IF NOT EXISTS moderation (
  user_id      TEXT PRIMARY KEY REFERENCES users (id),
  warnings     INTEGER NOT NULL DEFAULT 0,
  banned_until INTEGER,            -- epoch millis; NULL/past = not banned
  note         TEXT,
  updated_at   INTEGER NOT NULL
);
