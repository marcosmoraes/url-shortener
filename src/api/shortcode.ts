import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LENGTH = 7;

/** Gera um short code com ~7 caracteres alfanuméricos. */
export function generateShortCode(): string {
  const chars = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    chars.push(ALPHABET[randomInt(ALPHABET.length)]);
  }
  return chars.join('');
}
