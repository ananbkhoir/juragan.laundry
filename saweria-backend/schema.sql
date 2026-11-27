-- Juragan Laundry: top-up Saweria
CREATE TABLE IF NOT EXISTS players (
  code        TEXT PRIMARY KEY,          -- ID Pemain, mis. JL-3L3B76
  token_hash  TEXT NOT NULL,             -- sha256 token rahasia milik klien game
  created_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS credits (
  id          TEXT PRIMARY KEY,          -- id transaksi Saweria (idempoten)
  code        TEXT,                      -- NULL bila pesan tidak memuat ID Pemain
  type        TEXT NOT NULL,             -- 'topup' | 'donasi'
  amount      INTEGER NOT NULL,          -- rupiah (amount_raw)
  donator     TEXT,
  message     TEXT,
  created_at  INTEGER NOT NULL,
  claimed     INTEGER NOT NULL DEFAULT 0,
  claimed_at  INTEGER
);
CREATE INDEX IF NOT EXISTS credits_by_code ON credits (code, claimed);

-- Akun Google, sesi, simpanan cloud, peringkat, pertemanan
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,          -- 'g:' + sub Google
  sub         TEXT UNIQUE NOT NULL,
  email       TEXT,
  name        TEXT,
  given       TEXT,
  picture     TEXT,
  code        TEXT UNIQUE NOT NULL,      -- ID Pemain JL-XXXXXX (dipakai juga untuk top-up & tambah teman)
  created_at  INTEGER NOT NULL,
  last_login  INTEGER
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_by_user ON sessions (user_id);
CREATE TABLE IF NOT EXISTS saves (
  user_id     TEXT PRIMARY KEY,
  blob        TEXT NOT NULL,
  saved_at    INTEGER NOT NULL,
  v           INTEGER,
  updated_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id     TEXT PRIMARY KEY,
  shop        TEXT,
  score       INTEGER NOT NULL DEFAULT 0,
  lvl         INTEGER NOT NULL DEFAULT 1,
  rep         REAL NOT NULL DEFAULT 0,
  done        INTEGER NOT NULL DEFAULT 0,
  day         INTEGER NOT NULL DEFAULT 1,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS lb_score ON leaderboard (score DESC);
CREATE TABLE IF NOT EXISTS friends (
  from_id     TEXT NOT NULL,
  to_id       TEXT NOT NULL,
  status      TEXT NOT NULL,             -- 'pending' | 'accepted'
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (from_id, to_id)
);
CREATE INDEX IF NOT EXISTS friends_to ON friends (to_id, status);

-- Turnamen mingguan (satu baris per pemain per minggu ISO)
CREATE TABLE IF NOT EXISTS tour (
  user_id     TEXT NOT NULL,
  wk          TEXT NOT NULL,             -- mis. 2026-W48
  kind        TEXT,
  score       REAL NOT NULL DEFAULT 0,
  shop        TEXT,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, wk)
);
CREATE INDEX IF NOT EXISTS tour_rank ON tour (wk, score DESC);
-- Tata letak toko untuk dikunjungi teman
CREATE TABLE IF NOT EXISTS layouts (
  user_id     TEXT PRIMARY KEY,
  data        TEXT NOT NULL,
  likes       INTEGER NOT NULL DEFAULT 0,
  updated_at  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS likes (
  from_id     TEXT NOT NULL,
  to_id       TEXT NOT NULL,
  day         TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id, day)
);

-- Keseimbangan game: setiap simpanan admin = versi baru (nilai pengganti + catatan perubahan)
CREATE TABLE IF NOT EXISTS balance (
  version     INTEGER PRIMARY KEY,
  vals        TEXT NOT NULL,             -- JSON {kunci: angka}, hanya yang berbeda dari bawaan
  note        TEXT,
  changes     TEXT,                      -- JSON [{key,label,from,to}]
  by_email    TEXT,
  created_at  INTEGER NOT NULL
);
