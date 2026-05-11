import { describe, it, expect } from 'vitest';
import { isValidUrl, ensureProtocol } from './validation';

describe('utils/validation', () => {
  describe('isValidUrl', () => {
    it('deve validar URLs simples com protocolo', () => {
      expect(isValidUrl('https://google.com')).toBe(true);
      expect(isValidUrl('http://meu-site.br')).toBe(true);
    });

    it('deve validar URLs sem protocolo', () => {
      expect(isValidUrl('google.com')).toBe(true);
      expect(isValidUrl('sub.dominio.com.br/path')).toBe(true);
    });

    it('deve retornar true para strings vazias (não obrigatório)', () => {
      expect(isValidUrl('')).toBe(true);
      expect(isValidUrl(null)).toBe(true);
    });

    it('deve validar endereços IP', () => {
      expect(isValidUrl('192.168.0.1')).toBe(true);
    });

    it('deve rejeitar strings que não são URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://site.com')).toBe(false); // Caso FTP não seja suportado pela regex
    });
  });

  describe('ensureProtocol', () => {
    it('deve adicionar https:// se o protocolo estiver ausente', () => {
      expect(ensureProtocol('google.com')).toBe('https://google.com');
    });

    it('deve manter a URL se ela já possuir http ou https', () => {
      expect(ensureProtocol('http://site.com')).toBe('http://site.com');
      expect(ensureProtocol('https://secure.com')).toBe('https://secure.com');
    });

    it('deve retornar string vazia para entrada vazia', () => {
      expect(ensureProtocol('')).toBe('');
      expect(ensureProtocol(null)).toBe('');
    });
  });
});
