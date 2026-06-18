import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { UrlRepository } from '../repository.js';

/** True se expiresAt existe e já passou. */
function isExpired(expiresAt: string | null, now: Date): boolean {
  return expiresAt !== null && new Date(expiresAt).getTime() <= now.getTime();
}

export async function redirectRoutes(app: FastifyInstance, repo: UrlRepository): Promise<void> {
  app.get(
    '/:code',
    {
      schema: {
        summary: 'Redireciona para a URL original',
        params: {
          type: 'object',
          properties: { code: { type: 'string' } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { code: string } }>, reply) => {
      const record = repo.findByCode(request.params.code);

      if (record === null) {
        return reply.code(404).send({ error: 'Short code não encontrado' });
      }
      if (isExpired(record.expiresAt, new Date())) {
        return reply.code(410).send({ error: 'Short link expirado' });
      }

      repo.recordClick(
        record.id,
        {
          referrer: request.headers.referer ?? null,
          userAgent: request.headers['user-agent'] ?? null,
          ip: request.ip,
        },
        new Date().toISOString(),
      );

      return reply.code(301).redirect(record.originalUrl);
    },
  );
}
