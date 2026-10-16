import { describe, expect, it } from 'vitest';
import {
  createEmptyColumnMergeTargets,
  getColumnMergeEnvironment,
  getTaskMergeSourceBranch,
  normalizeColumnMergeTargets
} from '../../src/utils/columnMerge.js';

describe('columnMerge', () => {
  it('normaliza destinos por provedor e mantém seis posições por board', () => {
    const normalized = normalizeColumnMergeTargets({
      gitlab: [' environment-a ', null, 'environment-c'],
      github: ['github-main']
    });

    expect(normalized.gitlab).toEqual(['environment-a', '', 'environment-c', '', '', '']);
    expect(normalized.github).toEqual(['github-main', '', '', '', '', '']);
    expect(createEmptyColumnMergeTargets()).toEqual({
      gitlab: ['', '', '', '', '', ''],
      github: ['', '', '', '', '', '']
    });
  });

  it('resolve apenas ambientes ainda declarados no provedor ativo', () => {
    const environments = [
      { id: 'base', branch: 'dev', alias: 'Desenvolvimento' },
      { id: 'target', branch: 'hml', alias: 'Homologação' }
    ];
    const targets = { gitlab: ['', 'target'], github: [] };

    expect(getColumnMergeEnvironment({
      targets,
      provider: 'gitlab',
      columnId: 2,
      environments
    })).toEqual(environments[1]);

    expect(getColumnMergeEnvironment({
      targets,
      provider: 'github',
      columnId: 2,
      environments
    })).toBeNull();
  });

  it('obtém a branch vinculada à tarefa pelo nome ou pela URL do provedor', () => {
    expect(getTaskMergeSourceBranch({ branchName: 'feature/task-1' }, 'gitlab'))
      .toBe('feature/task-1');
    expect(getTaskMergeSourceBranch({
      branchUrl: 'https://gitlab.example/project/-/tree/feature%2Ftask-2'
    }, 'gitlab')).toBe('feature/task-2');
    expect(getTaskMergeSourceBranch({
      githubBranchUrl: 'https://github.com/org/repo/tree/feature/task-3'
    }, 'github')).toBe('feature/task-3');
  });
});
