import { describe, it, expect } from 'vitest';
import { slugify, gitBranchSlug } from '../../src/utils/string';

describe('string utils', () => {
  describe('slugify', () => {
    it('deve converter para minúsculas e remover espaços', () => {
      expect(slugify('Teste de String')).toBe('teste-de-string');
    });

    it('deve remover acentos corretamente', () => {
      expect(slugify('Ação e Reação')).toBe('acao-e-reacao');
    });

    it('deve lidar com caracteres especiais', () => {
      expect(slugify('Task #123: Bug Fix!')).toBe('task-123-bug-fix');
    });

    it('deve evitar hífens duplicados', () => {
      expect(slugify('String   com---muitos   espacos')).toBe('string-com-muitos-espacos');
    });
  });

  describe('gitBranchSlug', () => {
    it('deve preservar maiúsculas e minúsculas e converter espaços em hífens', () => {
      expect(gitBranchSlug('Sprint 01: Refactor UI')).toBe('Sprint-01-Refactor-UI');
    });

    it('deve remover acentos preservando o case', () => {
      expect(gitBranchSlug('Ação e REAÇÃO')).toBe('Acao-e-REACAO');
    });

    it('deve permitir barras e pontos (comuns em branches)', () => {
      expect(gitBranchSlug('feature/User.Login')).toBe('feature/User.Login');
    });

    it('deve remover outros caracteres especiais', () => {
      expect(gitBranchSlug('Task #123: Bug Fix!')).toBe('Task-123-Bug-Fix');
    });
  });
});
