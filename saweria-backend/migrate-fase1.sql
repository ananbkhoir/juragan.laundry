-- Migrasi Fase 1 untuk database yang sudah ada. Aman diulang.
-- wrangler d1 execute juragan-laundry --remote --file=migrate-fase1.sql

CREATE TABLE IF NOT EXISTS wallets (
  user_id     TEXT PRIMARY KEY,
  coin        INTEGER NOT NULL DEFAULT 5000000,
  gem         INTEGER NOT NULL DEFAULT 20,
  version     INTEGER NOT NULL DEFAULT 0,
  seq         INTEGER NOT NULL DEFAULT 0,
  updated_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS wallet_ops (
  idem        TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  cur         TEXT NOT NULL,
  delta       INTEGER NOT NULL,
  reason      TEXT,
  version     INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS wallet_ops_by_user ON wallet_ops (user_id, created_at DESC);

-- Dompet awal untuk pemain yang sudah punya akun sebelum tabel ini ada.
-- Angka default bisa disesuaikan lewat /api/admin/balance (startCash, startGem).
INSERT OR IGNORE INTO wallets (user_id, coin, gem, version, seq, updated_at)
  SELECT u.id, 5000000, 20, 0, 0, u.created_at FROM users u;
