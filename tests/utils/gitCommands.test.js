import { describe, expect, it } from 'vitest';
import { buildBranchCheckoutCommand } from '../../src/utils/gitCommands.js';

describe('gitCommands', () => {
  it('gera um checkout que atualiza a referência remota e cria tracking quando necessário', () => {
    const command = buildBranchCheckoutCommand('feature/task-123');

    expect(command).toBe(
      "git fetch origin '+feature/task-123:refs/remotes/origin/feature/task-123' "
      + "&& if git show-ref --verify --quiet 'refs/heads/feature/task-123'; "
      + "then git checkout 'feature/task-123'; "
      + "else git checkout -b 'feature/task-123' --track 'origin/feature/task-123'; fi"
    );
  });

  it('protege argumentos do shell e ignora nomes vazios', () => {
    expect(buildBranchCheckoutCommand("feature/o'hare")).toContain("'feature/o'\"'\"'hare'");
    expect(buildBranchCheckoutCommand('   ')).toBe('');
  });
});
