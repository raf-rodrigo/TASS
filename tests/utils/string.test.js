import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/utils/string';

describe('string utils', () => {
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
