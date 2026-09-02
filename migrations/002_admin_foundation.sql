CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video', 'audio', 'document')),
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  mime_type TEXT,
  size_bytes BIGINT,
  storage_provider TEXT NOT NULL DEFAULT 'external',
  source TEXT NOT NULL DEFAULT 'admin',
  created_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_assets_url ON media_assets(url);
CREATE INDEX IF NOT EXISTS idx_media_assets_kind_created ON media_assets(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);
