import { db } from '../db.js';
import { slugify } from '../utils/string.js';
import { notificationService } from './notificationService.js';

export const gitlabService = {
  getBranchName(task) {
    const titlePart = task.title.trim().replace(/\s+/g, '-');
    const descPart = task.description ? slugify(task.description) : '';
    const combined = descPart ? `${titlePart}-${descPart}` : titlePart;
    return combined.replace(/[^\w\d\-\/\.\u00C0-\u00FF]/g, '');
  },

  async deleteLocalBranchLink(task) {
    await db.tasks.update(task.id, { branchUrl: undefined });
    task.branchUrl = undefined;
    notificationService.toast('Link local removido.', 'success');
  },

  async checkBranchExists(settings, branchName) {
    const { gitlabUrl, gitlabToken, gitlabProjectId } = settings;
    try {
      const urlObj = new URL(gitlabUrl);
      const gitlabOrigin = urlObj.origin;
      const safeProjectId = encodeURIComponent(decodeURIComponent(gitlabProjectId));
      
      const response = await fetch(`${gitlabOrigin}/api/v4/projects/${safeProjectId}/repository/branches/${encodeURIComponent(branchName)}`, {
        method: 'GET',
        headers: { 'PRIVATE-TOKEN': gitlabToken }
      });
      
      return response.ok;
    } catch (err) {
      console.error("Erro ao verificar branch:", err);
      return false;
    }
  },

  async handleGitlabFlow(task, settings) {
    const { gitlabUrl, gitlabIntegrationMode } = settings;
    const branchName = this.getBranchName(task);

    if (gitlabIntegrationMode !== 'api') {
      const baseUrl = gitlabUrl.replace(/\/$/, '');
      const treeUrl = `${baseUrl}/-/branches/new?branch_name=${encodeURIComponent(branchName)}`;
      window.open(treeUrl, '_blank');
      return;
    }

    const exists = await this.checkBranchExists(settings, branchName);

    if (exists) {
      const { gitlabToken, gitlabProjectId } = settings;
      const urlObj = new URL(gitlabUrl);
      const gitlabOrigin = urlObj.origin;
      const safeProjectId = encodeURIComponent(decodeURIComponent(gitlabProjectId));
      return await this.handleExistingBranch(task, branchName, gitlabUrl, gitlabOrigin, safeProjectId, gitlabToken);
    } else {
      if (task.branchUrl) {
        const result = await notificationService.confirm(
          'Branch Não Encontrada',
          `O branch vinculado a esta tarefa não existe mais no GitLab.\nO que deseja fazer?`,
          'Recriar Branch',
          'warning',
          'Excluir Link Local' // denyText
        );

        if (result === 'confirmed') {
          return await this.createBranch(task, settings);
        } else if (result === 'denied') {
          await this.deleteLocalBranchLink(task);
        }
      } else {
        const confirmed = await notificationService.confirm(
          'Criar Branch',
          `Deseja criar a branch '${branchName}' no GitLab?`,
          'Sim, Criar',
          'info'
        );

        if (confirmed) {
          return await this.createBranch(task, settings);
        }
      }
    }
  },

  async createBranch(task, settings) {
    const { gitlabUrl, gitlabToken, gitlabProjectId, gitlabBaseBranch } = settings;
    const branchName = this.getBranchName(task);
    
    if (!gitlabToken || !gitlabProjectId) {
      notificationService.toast("Configuração incompleta: Preencha o Token e o ID.", "error");
      return;
    }

    try {
      const urlObj = new URL(gitlabUrl);
      const gitlabOrigin = urlObj.origin;
      const safeProjectId = encodeURIComponent(decodeURIComponent(gitlabProjectId));

      const response = await fetch(`${gitlabOrigin}/api/v4/projects/${safeProjectId}/repository/branches`, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': gitlabToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branch: branchName,
          ref: gitlabBaseBranch || 'develop'
        })
      });

      if (response.ok) {
        const baseUrl = gitlabUrl.replace(/\/$/, '');
        const treeUrl = `${baseUrl}/-/tree/${encodeURIComponent(branchName)}`;
        await db.tasks.update(task.id, { branchUrl: treeUrl });
        task.branchUrl = treeUrl;
        notificationService.toast('Branch criada com sucesso!', 'success');
        return { treeUrl, branchName };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || response.statusText;
        notificationService.toast(`Erro do GitLab: ${errorMsg}`, 'error');
      }
    } catch (err) {
      notificationService.toast(`Falha na comunicação: ${err.message}`, 'error');
    }
  },

  async handleExistingBranch(task, branchName, gitlabUrl, gitlabOrigin, safeProjectId, gitlabToken) {
    const baseUrl = gitlabUrl.replace(/\/$/, '');
    const treeUrl = `${baseUrl}/-/tree/${encodeURIComponent(branchName)}`;
    
    const result = await notificationService.confirm(
      'Branch já existe',
      `A branch ${branchName} já existe no GitLab.\nO que deseja fazer?`,
      'Abrir Branch',
      'info',
      'Deletar Branch' // denyText
    );

    if (result === 'confirmed') {
      window.open(treeUrl, '_blank');
    } else if (result === 'denied') {
      const confirmed = await notificationService.confirm(
        'Alerta de Exclusão',
        `Deseja realmente DELETAR a branch '${branchName}'?`,
        'Sim, Deletar',
        'warning'
      );

      if (confirmed) {
        const deleteResponse = await fetch(`${gitlabOrigin}/api/v4/projects/${safeProjectId}/repository/branches/${encodeURIComponent(branchName)}`, {
          method: 'DELETE',
          headers: { 'PRIVATE-TOKEN': gitlabToken }
        });

        if (deleteResponse.ok || deleteResponse.status === 404) {
          notificationService.toast(`Branch removida!`, 'success');
        } else {
          notificationService.toast(`Erro ao excluir no GitLab.`, 'error');
        }
        await this.deleteLocalBranchLink(task);
      }
    }
    return treeUrl;
  }
};
