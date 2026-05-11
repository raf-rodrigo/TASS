import { describe, it, expect } from 'vitest';
import { isValidUrl, ensureProtocol } from '../../src/utils/validation';

describe('validation utils', () => {
  describe('isValidUrl', () => {
    it('deve validar URLs HTTP/HTTPS corretas', () => {
      expect(isValidUrl('https://google.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('deve invalidar strings aleatórias', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://server.com')).toBe(false); // Apenas http/s por padrão
    });
  });

  describe('ensureProtocol', () => {
    it('deve adicionar https:// se não houver protocolo', () => {
      expect(ensureProtocol('google.com')).toBe('https://google.com');
    });

    it('não deve alterar se já houver protocolo', () => {
      expect(ensureProtocol('http://site.com')).toBe('http://site.com');
    });

    it('deve limpar espaços extras', () => {
      expect(ensureProtocol('   my-site.com   ')).toBe('https://my-site.com');
    });
  });
});
