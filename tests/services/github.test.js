import { beforeEach, describe, expect, it, vi } from 'vitest';
import { githubService } from '../../src/services/github.js';
import { db } from '../../src/db.js';
import { notificationService } from '../../src/services/notificationService.js';

vi.mock('../../src/services/notificationService.js', () => ({
  notificationService: {
    toast: vi.fn(),
    confirm: vi.fn(),
    alert: vi.fn(),
    copyCommand: vi.fn()
  }
}));

vi.mock('../../src/db.js', () => ({
  db: {
    tasks: {
      update: vi.fn()
    }
  }
}));

describe('githubService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('createBranch', () => {
    it('deve salvar a branch e oferecer um comando que busca e acessa a referência remota', async () => {
      const task = { id: 8, title: 'TASK-8', description: 'Ajustar perfil' };
      const settings = {
        githubOwner: 'openai',
        githubRepo: 'tass',
        githubToken: 'token',
        activeBaseBranch: 'main'
      };
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ object: { sha: 'abc123' } })
        })
        .mockResolvedValueOnce({ ok: true });

      const result = await githubService.createBranch(task, settings);

      expect(db.tasks.update).toHaveBeenCalledWith(8, {
        githubBranchUrl: 'https://github.com/openai/tass/tree/TASK-8-Ajustar-perfil',
        githubBranchName: 'TASK-8-Ajustar-perfil'
      });
      expect(notificationService.copyCommand).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Branch criada',
        command: expect.stringContaining("git fetch origin '+TASK-8-Ajustar-perfil:refs/remotes/origin/TASK-8-Ajustar-perfil'")
      }));
      expect(notificationService.copyCommand).toHaveBeenCalledWith(expect.objectContaining({
        command: expect.stringContaining("git checkout -b 'TASK-8-Ajustar-perfil' --track 'origin/TASK-8-Ajustar-perfil'")
      }));
      expect(result.branchName).toBe('TASK-8-Ajustar-perfil');
    });
  });
});
