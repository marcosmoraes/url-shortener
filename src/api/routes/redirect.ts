import type { FastifyInstance, FastifyRequest } from 'fastify';
import { PARAMS_CODE_SCHEMA, ERROR_RESPONSE_SCHEMA } from '../schemas.js';
import type { UrlRepository } from '../repository.js';

function isExpired(expiresAt: string | null, now: Date): boolean {
  return expiresAt !== null && new Date(expiresAt).getTime() <= now.getTime();
}

export async function redirectRoutes(app: FastifyInstance, repo: UrlRepository): Promise<void> {
  app.get(
    '/:code',
    {
      schema: {
        summary: 'Redireciona para a URL original',
        params: PARAMS_CODE_SCHEMA,
        response: {
          301: { type: 'object' },
          404: ERROR_RESPONSE_SCHEMA,
          410: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { code: string } }>, reply) => {
      const record = repo.findByCode(request.params.code);

      if (record === null) {
        return reply.code(404).send({ error: 'Short code não encontrado' });
      }

      const now = new Date();
      if (isExpired(record.expiresAt, now)) {
        return reply.code(410).send({ error: 'Short link expirado' });
      }

      repo.recordClick(
        record.id,
        {
          referrer: request.headers.referer ?? null,
          userAgent: request.headers['user-agent'] ?? null,
          ip: request.ip,
        },
        now.toISOString(),
      );

      return reply.code(301).redirect(record.originalUrl);
    },
  );
}
