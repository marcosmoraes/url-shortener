import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { UrlRepository } from '../repository.js';

const responseSchema = {
  type: 'object',
  properties: {
    shortCode: { type: 'string' },
    totalClicks: { type: 'integer' },
    clicksByDay: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          count: { type: 'integer' },
        },
      },
    },
    topReferrers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          referrer: { type: 'string' },
          count: { type: 'integer' },
        },
      },
    },
  },
} as const;

export async function statsRoutes(app: FastifyInstance, repo: UrlRepository): Promise<void> {
  app.get(
    '/api/stats/:code',
    {
      schema: {
        summary: 'Estatísticas de cliques (últimos 30 dias)',
        params: {
          type: 'object',
          properties: { code: { type: 'string' } },
        },
        response: {
          200: responseSchema,
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { code: string } }>, reply) => {
      const record = repo.findByCode(request.params.code);
      if (record === null) {
        return reply.code(404).send({ error: 'Short code não encontrado' });
      }

      const stats = repo.getStats(record.id, new Date());
      return reply.code(200).send({ shortCode: record.shortCode, ...stats });
    },
  );
}
