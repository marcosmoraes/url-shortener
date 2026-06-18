import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/api/app.js';
import { createDb } from '../src/api/db.js';

describe('tracking de cliques + GET /api/stats/:code', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ db: createDb(':memory:'), logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  async function shorten(url: string): Promise<string> {
    const res = await app.inject({ method: 'POST', url: '/api/shorten', payload: { url } });
    return res.json().shortCode;
  }

  it('registra clique a cada redirect e reflete em totalClicks e na listagem', async () => {
    const code = await shorten('https://alvo.com');

    await app.inject({ method: 'GET', url: `/${code}`, headers: { referer: 'https://google.com' } });
    await app.inject({ method: 'GET', url: `/${code}`, headers: { referer: 'https://google.com' } });
    await app.inject({ method: 'GET', url: `/${code}`, headers: { referer: 'https://twitter.com' } });

    const stats = (await app.inject({ method: 'GET', url: `/api/stats/${code}` })).json();
    expect(stats.totalClicks).toBe(3);

    const list = (await app.inject({ method: 'GET', url: '/api/urls' })).json();
    const item = list.find((u: { shortCode: string }) => u.shortCode === code);
    expect(item.clickCount).toBe(3);
  });

  it('agrupa topReferrers por contagem (desc) e usa "direct" quando ausente', async () => {
    const code = await shorten('https://refs.com');

    await app.inject({ method: 'GET', url: `/${code}`, headers: { referer: 'https://a.com' } });
    await app.inject({ method: 'GET', url: `/${code}`, headers: { referer: 'https://a.com' } });
    await app.inject({ method: 'GET', url: `/${code}` }); // sem referer => direct

    const stats = (await app.inject({ method: 'GET', url: `/api/stats/${code}` })).json();
    expect(stats.topReferrers[0]).toEqual({ referrer: 'https://a.com', count: 2 });
    expect(stats.topReferrers).toContainEqual({ referrer: 'direct', count: 1 });
  });

  it('agrupa clicksByDay no dia de hoje', async () => {
    const code = await shorten('https://hoje.com');
    await app.inject({ method: 'GET', url: `/${code}` });

    const stats = (await app.inject({ method: 'GET', url: `/api/stats/${code}` })).json();
    const today = new Date().toISOString().slice(0, 10);
    expect(stats.clicksByDay).toContainEqual({ date: today, count: 1 });
  });

  it('não registra clique em link expirado (410) nem inexistente (404)', async () => {
    const expired = await shorten('https://exp.com');
    // força expiração criando um novo com data passada
    const expiredCode = (
      await app.inject({
        method: 'POST',
        url: '/api/shorten',
        payload: { url: 'https://exp2.com', expiresAt: '2000-01-01T00:00:00.000Z' },
      })
    ).json().shortCode;

    await app.inject({ method: 'GET', url: `/${expiredCode}` }); // 410
    await app.inject({ method: 'GET', url: '/inexistente404' }); // 404

    const stats = (await app.inject({ method: 'GET', url: `/api/stats/${expiredCode}` })).json();
    expect(stats.totalClicks).toBe(0);
    void expired;
  });

  it('retorna 404 em stats de short code inexistente', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stats/naoexiste' });
    expect(res.statusCode).toBe(404);
  });
});
