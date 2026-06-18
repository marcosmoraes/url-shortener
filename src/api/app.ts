import Fastify, { type FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createDb, type DB } from './db.js';
import { UrlRepository } from './repository.js';
import { shortenRoutes } from './routes/shorten.js';
import { redirectRoutes } from './routes/redirect.js';
import { urlsRoutes } from './routes/urls.js';
import { statsRoutes } from './routes/stats.js';

export interface AppOptions {
  db?: DB;
  logger?: boolean;
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? true });
  const db = options.db ?? createDb();
  const repo = new UrlRepository(db);

  app.addHook('onClose', () => {
    db.close();
  });

  await app.register(swagger, {
    openapi: {
      info: { title: 'URL Shortener', version: '0.1.0' },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  await app.register(async (instance) => shortenRoutes(instance, repo));
  await app.register(async (instance) => urlsRoutes(instance, repo));
  await app.register(async (instance) => statsRoutes(instance, repo));
  // redirect (GET /:code) por último: rota curinga não pode capturar /api e /docs
  await app.register(async (instance) => redirectRoutes(instance, repo));

  return app;
}
