import type { FastifyInstance } from 'fastify';
import type { UrlRepository } from '../repository.js';

const responseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      shortCode: { type: 'string' },
      originalUrl: { type: 'string' },
      createdAt: { type: 'string' },
      expiresAt: { type: 'string', nullable: true },
      clickCount: { type: 'integer' },
    },
  },
} as const;

export async function urlsRoutes(app: FastifyInstance, repo: UrlRepository): Promise<void> {
  app.get(
    '/api/urls',
    {
      schema: {
        summary: 'Lista os links criados (mais recentes primeiro)',
        response: { 200: responseSchema },
      },
    },
    async (_request, reply) => {
      return reply.code(200).send(repo.list());
    },
  );
}
