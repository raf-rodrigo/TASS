import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gitlabService } from '../../src/services/gitlab';
import { db } from '../../src/db.js';
import { notificationService } from '../../src/services/notificationService.js';

// Mock do notificationService e db
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

describe('gitlabService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('window', { open: vi.fn() });
  });

  describe('getBranchName', () => {
    it('deve gerar um nome de branch preservando o case e unindo titulo-descricao', () => {
      const task = { title: 'TSK-123', description: 'Correção de bug' };
      const branchName = gitlabService.getBranchName(task);
      expect(branchName).toBe('TSK-123-Correcao-de-bug');
    });

    it('deve remover caracteres especiais e espaços extras sem forçar lowercase', () => {
      const task = { title: '  TSK 999  ', description: 'Melhoria @ Sistema!!!' };
      const branchName = gitlabService.getBranchName(task);
      expect(branchName).toBe('TSK-999-Melhoria-Sistema');
    });

    it('deve funcionar apenas com o título se a descrição estiver vazia', () => {
      const task = { title: 'FEATURE-AUTO', description: '' };
      const branchName = gitlabService.getBranchName(task);
      expect(branchName).toBe('FEATURE-AUTO');
    });
  });

  describe('handleGitFlow (Modo Link)', () => {
    it('deve abrir a URL de criação de branch quando o modo for "link" preservando o case', async () => {
      const task = { title: 'TASK-1', description: 'Teste' };
      const settings = { 
        gitlabUrl: 'https://gitlab.com/', 
        gitlabIntegrationMode: 'link' 
      };

      await gitlabService.handleGitFlow(task, settings);
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('gitlab.com/-/branches/new?branch_name=TASK-1-Teste'),
        '_blank'
      );
    });
  });

  describe('checkBranchExists', () => {
    it('deve retornar true se o GitLab responder com status 200', async () => {
      const settings = { gitlabUrl: 'https://gitlab.com', gitlabToken: 'tok', gitlabProjectId: '123' };
      fetch.mockResolvedValue({ ok: true });

      const exists = await gitlabService.checkBranchExists(settings, 'minha-branch');
      
      expect(exists).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v4/projects/123/repository/branches/minha-branch'),
        expect.any(Object)
      );
    });

    it('deve retornar false se o GitLab responder com erro', async () => {
      const settings = { gitlabUrl: 'https://gitlab.com', gitlabToken: 'tok', gitlabProjectId: '123' };
      fetch.mockResolvedValue({ ok: false });

      const exists = await gitlabService.checkBranchExists(settings, 'minha-branch');
      expect(exists).toBe(false);
    });
  });

  describe('createBranch', () => {
    it('usa a branch base escolhida ao criar a tarefa', async () => {
      fetch.mockResolvedValue({ ok: true });
      await gitlabService.createBranch({ id: 8, title: 'TASK-8' }, {
        gitlabUrl: 'https://gitlab.com/grupo/projeto', gitlabToken: 'token',
        gitlabProjectId: '123', activeBaseBranch: 'main'
      }, 'deploy/cliente');
      expect(JSON.parse(fetch.mock.calls[0][1].body).ref).toBe('deploy/cliente');
    });

    it('deve salvar a branch e oferecer um comando que busca e acessa a referência remota', async () => {
      const task = { id: 7, title: 'TASK-7', description: 'Ajustar login' };
      const settings = {
        gitlabUrl: 'https://gitlab.com/grupo/projeto',
        gitlabToken: 'token',
        gitlabProjectId: 'grupo%2Fprojeto',
        activeBaseBranch: 'main'
      };
      fetch.mockResolvedValue({ ok: true });

      const result = await gitlabService.createBranch(task, settings);

      expect(db.tasks.update).toHaveBeenCalledWith(7, {
        branchUrl: 'https://gitlab.com/grupo/projeto/-/tree/TASK-7-Ajustar-login',
        branchName: 'TASK-7-Ajustar-login'
      });
      expect(notificationService.copyCommand).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Branch criada',
        command: expect.stringContaining("git fetch origin '+TASK-7-Ajustar-login:refs/remotes/origin/TASK-7-Ajustar-login'")
      }));
      expect(notificationService.copyCommand).toHaveBeenCalledWith(expect.objectContaining({
        command: expect.stringContaining("git checkout -b 'TASK-7-Ajustar-login' --track 'origin/TASK-7-Ajustar-login'")
      }));
      expect(result.branchName).toBe('TASK-7-Ajustar-login');
    });
  });
});
