import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ERROR_RESPONSE_SCHEMA } from '../schemas.js';
import { generateShortCode } from '../shortcode.js';
import { isValidHttpUrl } from '../url.js';
import type { UrlRepository } from '../repository.js';

interface ShortenBody {
  url: string;
  expiresAt?: string;
}

const bodySchema = {
  type: 'object',
  required: ['url'],
  properties: {
    url: { type: 'string' },
    expiresAt: { type: 'string', format: 'date-time' },
  },
} as const;

const responseSchema = {
  type: 'object',
  properties: {
    shortCode: { type: 'string' },
    shortUrl: { type: 'string' },
    originalUrl: { type: 'string' },
    createdAt: { type: 'string' },
    expiresAt: { type: 'string', nullable: true },
  },
} as const;

export async function shortenRoutes(app: FastifyInstance, repo: UrlRepository): Promise<void> {
  app.post(
    '/api/shorten',
    {
      schema: {
        summary: 'Cria um short link',
        body: bodySchema,
        response: {
          200: responseSchema,
          400: ERROR_RESPONSE_SCHEMA,
        },
      },
    },
    async (request: FastifyRequest<{ Body: ShortenBody }>, reply) => {
      const { url, expiresAt } = request.body;

      if (!isValidHttpUrl(url)) {
        return reply.code(400).send({ error: 'URL inválida (somente http/https)' });
      }

      const record = repo.create({
        shortCode: generateShortCode(),
        originalUrl: url,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt ?? null,
      });

      const baseUrl = `${request.protocol}://${request.host}`;

      return reply.code(200).send({
        shortCode: record.shortCode,
        shortUrl: `${baseUrl}/${record.shortCode}`,
        originalUrl: record.originalUrl,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
      });
    },
  );
}
