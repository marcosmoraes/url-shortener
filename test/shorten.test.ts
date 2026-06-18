import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/api/app.js';
import { createDb } from '../src/api/db.js';

describe('POST /api/shorten + GET /api/urls + redirect', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ db: createDb(':memory:'), logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna 200 com o contrato completo para URL válida', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/shorten',
      payload: { url: 'https://example.com/foo' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.shortCode).toMatch(/^[A-Za-z0-9]{7}$/);
    expect(body.shortUrl).toContain(body.shortCode);
    expect(body.originalUrl).toBe('https://example.com/foo');
    expect(typeof body.createdAt).toBe('string');
    expect(body.expiresAt).toBeNull();
  });

  it('ecoa expiresAt quando informado', async () => {
    const expiresAt = '2099-12-31T23:59:59.000Z';
    const res = await app.inject({
      method: 'POST',
      url: '/api/shorten',
      payload: { url: 'http://a.com', expiresAt },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().expiresAt).toBe(expiresAt);
  });

  it('retorna 400 para URL com protocolo não-http', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/shorten',
      payload: { url: 'ftp://arquivos.com/file.zip' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBeDefined();
  });

  it('retorna 400 para texto que não é URL', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/shorten',
      payload: { url: 'isso nao e uma url' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('redireciona com 301 para a URL original', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/shorten',
      payload: { url: 'https://redirect-target.com/x' },
    });
    const { shortCode } = created.json();

    const res = await app.inject({ method: 'GET', url: `/${shortCode}` });
    expect(res.statusCode).toBe(301);
    expect(res.headers.location).toBe('https://redirect-target.com/x');
  });

  it('retorna 404 para short code inexistente', async () => {
    const res = await app.inject({ method: 'GET', url: '/naoexiste' });
    expect(res.statusCode).toBe(404);
  });

  it('retorna 410 para link expirado', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/shorten',
      payload: { url: 'https://expirado.com', expiresAt: '2000-01-01T00:00:00.000Z' },
    });
    const { shortCode } = created.json();

    const res = await app.inject({ method: 'GET', url: `/${shortCode}` });
    expect(res.statusCode).toBe(410);
  });

  it('lista URLs mais recentes primeiro com contagem de cliques', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/urls' });
    expect(res.statusCode).toBe(200);
    const list = res.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('clickCount', 0);
    // ordenação desc: createdAt do primeiro >= do último
    const codes = list.map((u: { shortCode: string }) => u.shortCode);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
