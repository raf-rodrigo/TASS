import { describe, expect, it } from 'vitest';
import { branchTypes, withBranchType } from '../../src/utils/branchTypes.js';

describe('tipos de branch', () => {
  it.each(branchTypes)('aplica o prefixo $value e fornece explicação', type => {
    expect(withBranchType('TSK-123-Descricao', type.value)).toBe(`${type.value}/TSK-123-Descricao`);
    expect(type.label).toContain(type.description);
  });

  it.each(['', undefined, 'invalido'])('preserva nomes sem tipo válido: %s', type => {
    expect(withBranchType('TSK-123', type)).toBe('TSK-123');
  });
});
