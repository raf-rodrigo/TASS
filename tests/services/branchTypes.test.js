import { describe, expect, it, vi } from 'vitest';
import { gitlabService } from '../../src/services/gitlab.js';
import { githubService } from '../../src/services/github.js';

vi.mock('../../src/db.js', () => ({ db: {} }));
vi.mock('../../src/services/notificationService.js', () => ({ notificationService: {} }));

describe.each([
  ['GitLab', gitlabService, 'branchName'],
  ['GitHub', githubService, 'githubBranchName']
])('tipo de branch no %s', (_, service, nameField) => {
  it('gera o prefixo com número e descrição', () => {
    expect(service.getBranchName({ title: 'TSK-42', description: 'Nova função', branchType: 'feat' }))
      .toBe('feat/TSK-42-Nova-funcao');
  });

  it('mantém o nome já vinculado à tarefa', () => {
    expect(service.getBranchName({ title: 'TSK-42', branchType: 'fix', [nameField]: 'branch-existente' }))
      .toBe('branch-existente');
  });

  it('mantém compatibilidade com tarefas antigas', () => {
    expect(service.getBranchName({ title: 'TSK-42' })).toBe('TSK-42');
  });
});
