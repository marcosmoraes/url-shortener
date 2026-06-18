import Database from 'better-sqlite3';

export type DB = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS urls (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code   TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  expires_at   TEXT
);

CREATE TABLE IF NOT EXISTS clicks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  url_id     INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  referrer   TEXT,
  user_agent TEXT,
  ip         TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON clicks(url_id);
`;

/** Abre o banco (arquivo ou ':memory:') e garante o schema. */
export function createDb(path: string = 'data.db'): DB {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}
