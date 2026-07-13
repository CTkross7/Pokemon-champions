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

-- Accounts (Google / Apple sign-in + username). Optional: only needed when the
-- login backend is enabled. See docs/DEPLOYMENT.md for provider setup.
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,      -- uuid
  username     TEXT NOT NULL UNIQUE,  -- lowercase [a-z0-9_], 3-20
  display_name TEXT NOT NULL,
  email        TEXT,
  provider     TEXT NOT NULL,         -- 'google' | 'apple' | 'local'
  provider_id  TEXT NOT NULL,         -- subject id from the provider
  avatar_url   TEXT,
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
