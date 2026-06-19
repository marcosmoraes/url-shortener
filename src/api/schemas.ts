/** Schemas compartilhados entre rotas. */

export const PARAMS_CODE_SCHEMA = {
  type: 'object',
  properties: { code: { type: 'string' } },
} as const;

export const ERROR_RESPONSE_SCHEMA = {
  type: 'object',
  properties: { error: { type: 'string' } },
} as const;
