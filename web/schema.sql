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
