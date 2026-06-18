import { describe, it, expect } from 'vitest';
import { isValidHttpUrl } from '../src/api/url.js';

describe('isValidHttpUrl', () => {
  describe('aceita', () => {
    const valid = [
      'http://example.com',
      'https://example.com',
      'https://example.com/path?query=1#frag',
      'http://localhost:3000',
      'https://sub.dominio.com.br',
      'HTTP://EXAMPLE.COM',
    ];
    it.each(valid)('%s', (url) => {
      expect(isValidHttpUrl(url)).toBe(true);
    });
  });

  describe('rejeita', () => {
    const invalid = [
      'ftp://arquivos.com/file.zip',
      'javascript:alert(1)',
      'mailto:foo@bar.com',
      'file:///etc/passwd',
      'isso nao e uma url',
      '',
      '   ',
      '//example.com',
      'example.com',
    ];
    it.each(invalid)('%s', (url) => {
      expect(isValidHttpUrl(url)).toBe(false);
    });
  });
});
