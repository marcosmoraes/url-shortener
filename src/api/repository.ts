import type { DB } from './db.js';

export interface UrlRecord {
  id: number;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface UrlListItem extends UrlRecord {
  clickCount: number;
}

export interface ClickInput {
  referrer: string | null;
  userAgent: string | null;
  ip: string | null;
}

export interface UrlStats {
  totalClicks: number;
  clicksByDay: Array<{ date: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
}

interface UrlRow {
  id: number;
  short_code: string;
  original_url: string;
  created_at: string;
  expires_at: string | null;
}

function toRecord(row: UrlRow): UrlRecord {
  return {
    id: row.id,
    shortCode: row.short_code,
    originalUrl: row.original_url,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export class UrlRepository {
  constructor(private readonly db: DB) {}

  create(input: {
    shortCode: string;
    originalUrl: string;
    createdAt: string;
    expiresAt: string | null;
  }): UrlRecord {
    const stmt = this.db.prepare(
      `INSERT INTO urls (short_code, original_url, created_at, expires_at)
       VALUES (@shortCode, @originalUrl, @createdAt, @expiresAt)`,
    );
    const info = stmt.run(input);
    return { id: Number(info.lastInsertRowid), ...input };
  }

  findByCode(shortCode: string): UrlRecord | null {
    const row = this.db
      .prepare('SELECT * FROM urls WHERE short_code = ?')
      .get(shortCode) as UrlRow | undefined;
    return row ? toRecord(row) : null;
  }

  /** Lista mais recentes primeiro, com contagem de cliques. */
  list(): UrlListItem[] {
    const rows = this.db
      .prepare(
        `SELECT u.*, COUNT(c.id) AS click_count
         FROM urls u
         LEFT JOIN clicks c ON c.url_id = u.id
         GROUP BY u.id
         ORDER BY u.id DESC`,
      )
      .all() as Array<UrlRow & { click_count: number }>;
    return rows.map((row) => ({ ...toRecord(row), clickCount: row.click_count }));
  }

  recordClick(urlId: number, input: ClickInput, createdAt: string): void {
    this.db
      .prepare(
        `INSERT INTO clicks (url_id, referrer, user_agent, ip, created_at)
         VALUES (@urlId, @referrer, @userAgent, @ip, @createdAt)`,
      )
      .run({ urlId, ...input, createdAt });
  }

  /** Stats dos últimos 30 dias para a página de analytics. */
  getStats(urlId: number, now: Date): UrlStats {
    const totalClicks = (
      this.db.prepare('SELECT COUNT(*) AS n FROM clicks WHERE url_id = ?').get(urlId) as {
        n: number;
      }
    ).n;

    const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const clicksByDay = this.db
      .prepare(
        `SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count
         FROM clicks
         WHERE url_id = ? AND created_at >= ?
         GROUP BY date
         ORDER BY date ASC`,
      )
      .all(urlId, since) as Array<{ date: string; count: number }>;

    const topReferrers = this.db
      .prepare(
        `SELECT COALESCE(NULLIF(referrer, ''), 'direct') AS referrer, COUNT(*) AS count
         FROM clicks
         WHERE url_id = ?
         GROUP BY referrer
         ORDER BY count DESC, referrer ASC
         LIMIT 10`,
      )
      .all(urlId) as Array<{ referrer: string; count: number }>;

    return { totalClicks, clicksByDay, topReferrers };
  }
}
