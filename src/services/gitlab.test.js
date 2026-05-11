import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gitlabService } from './gitlab';

// Mock do notificationService e db
vi.mock('./notificationService.js', () => ({
  notificationService: {
    toast: vi.fn(),
    confirm: vi.fn(),
    alert: vi.fn()
  }
}));

vi.mock('../db.js', () => ({
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
    it('deve gerar um nome de branch válido a partir de uma task simples', () => {
      const task = { title: 'TSK-123', description: 'Correção de bug' };
      const branchName = gitlabService.getBranchName(task);
      expect(branchName).toBe('TSK-123-correcao-de-bug');
    });

    it('deve remover caracteres especiais e espaços extras', () => {
      const task = { title: '  TSK 999  ', description: 'Melhoria @ Sistema!!!' };
      const branchName = gitlabService.getBranchName(task);
      expect(branchName).toBe('TSK-999-melhoria-sistema');
    });

    it('deve funcionar apenas com o título se a descrição estiver vazia', () => {
      const task = { title: 'FEATURE-AUTO', description: '' };
      const branchName = gitlabService.getBranchName(task);
      expect(branchName).toBe('FEATURE-AUTO');
    });
  });

  describe('handleGitlabFlow (Modo Link)', () => {
    it('deve abrir a URL de criação de branch quando o modo for "link"', async () => {
      const task = { title: 'TASK-1', description: 'Teste' };
      const settings = { 
        gitlabUrl: 'https://gitlab.com/', 
        gitlabIntegrationMode: 'link' 
      };

      await gitlabService.handleGitlabFlow(task, settings);
      
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('gitlab.com/-/branches/new?branch_name=TASK-1-teste'),
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
});
