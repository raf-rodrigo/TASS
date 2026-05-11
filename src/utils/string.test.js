import { describe, it, expect } from 'vitest';
import { slugify } from './string';

describe('utils/string', () => {
  describe('slugify', () => {
    it('deve converter espaços em hífens e letras para minúsculo', () => {
      expect(slugify('Minha Tarefa')).toBe('minha-tarefa');
    });

    it('deve remover acentuação corretamente', () => {
      expect(slugify('Açâo e RedençãO')).toBe('acao-e-redencao');
    });

    it('deve remover caracteres especiais', () => {
      expect(slugify('Tarefa @#! 123')).toBe('tarefa-123');
    });

    it('deve tratar múltiplos hífens seguidos', () => {
      expect(slugify('Tarefa --- Teste')).toBe('tarefa-teste');
    });

    it('deve remover hífens no início e fim', () => {
      expect(slugify('---Tarefa---')).toBe('tarefa');
    });

    it('deve retornar string vazia para valores nulos', () => {
      expect(slugify(null)).toBe('');
      expect(slugify('')).toBe('');
    });
  });
});
