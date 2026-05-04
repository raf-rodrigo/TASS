import { toast as sToast, confirm as sConfirm } from '../utils/swal.js';
import { db } from '../db.js';

export const gitlabService = {
  getBranchName(task) {
    let combined = task.title;
    if (task.description) {
      combined += '-' + task.description;
    }
    return combined.toLowerCase().replace(/\s+/g, '-');
  },

  async deleteLocalBranchLink(task) {
    await db.tasks.update(task.id, { branchUrl: undefined });
    task.branchUrl = undefined;
    sToast.fire({ icon: 'success', title: 'Link local removido.' });
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

    // API Mode
    const exists = await this.checkBranchExists(settings, branchName);

    if (exists) {
      const { gitlabToken, gitlabProjectId } = settings;
      const urlObj = new URL(gitlabUrl);
      const gitlabOrigin = urlObj.origin;
      const safeProjectId = encodeURIComponent(decodeURIComponent(gitlabProjectId));
      return await this.handleExistingBranch(task, branchName, gitlabUrl, gitlabOrigin, safeProjectId, gitlabToken);
    } else {
      // Branch does NOT exist on GitLab
      if (task.branchUrl) {
        // We have a link but branch is gone
        const result = await sConfirm({
          title: 'Branch Não Encontrada',
          message: `O branch vinculado a esta tarefa não existe mais no GitLab.\nO que deseja fazer?`,
          confirmText: 'Recriar Branch',
          cancelText: 'Excluir Link Local',
          showDenyButton: true,
          denyButtonText: 'Cancelar',
          type: 'danger'
        });

        if (result.isConfirmed) {
          return await this.createBranch(task, settings);
        } else if (result.dismiss === 'cancel') {
          await this.deleteLocalBranchLink(task);
        }
      } else {
        // No link, no branch -> Ask to create
        const result = await sConfirm({
          title: 'Criar Branch',
          message: `Deseja criar a branch '${branchName}' no GitLab?`,
          confirmText: 'Sim, Criar',
          cancelText: 'Cancelar',
          type: 'primary'
        });

        if (result.isConfirmed) {
          return await this.createBranch(task, settings);
        }
      }
    }
  },

  async createBranch(task, settings) {
    const { gitlabUrl, gitlabToken, gitlabProjectId, gitlabBaseBranch } = settings;
    const branchName = this.getBranchName(task);
    
    if (!gitlabToken || !gitlabProjectId) {
      sToast.fire({ icon: 'error', title: "Configuração incompleta: Preencha o Token e o Project ID." });
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
        
        sToast.fire({ icon: 'success', title: 'Branch criada com sucesso!' });
        return { treeUrl, branchName };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || response.statusText;
        sToast.fire({ icon: 'error', title: `Erro do GitLab: ${errorMsg}` });
      }
    } catch (err) {
      sToast.fire({ icon: 'error', title: `Falha na comunicação: ${err.message}` });
    }
  },

  async handleExistingBranch(task, branchName, gitlabUrl, gitlabOrigin, safeProjectId, gitlabToken) {
    const baseUrl = gitlabUrl.replace(/\/$/, '');
    const treeUrl = `${baseUrl}/-/tree/${encodeURIComponent(branchName)}`;
    
    const result = await sConfirm({
      title: 'Branch já existe',
      message: `A branch '${branchName}' já existe no GitLab.\nDeseja abrir no navegador ou excluí-la?`,
      confirmText: 'Abrir Branch',
      cancelText: 'Excluir Branch',
      cancelButtonClass: 'btn btn-danger',
      showDenyButton: true,
      denyButtonText: 'Cancelar',
      type: 'primary'
    });

    if (result.isConfirmed) {
      window.open(treeUrl, '_blank');
    } else if (result.dismiss === 'cancel') {
      const confirmDelete = await sConfirm({
        title: 'Alerta de Exclusão',
        message: `Deseja realmente EXCLUIR a branch '${branchName}'?`,
        confirmText: 'Sim, Excluir',
        confirmClass: 'btn btn-danger',
        cancelText: 'Cancelar',
        type: 'danger'
      });

      if (confirmDelete.isConfirmed) {
        const deleteResponse = await fetch(`${gitlabOrigin}/api/v4/projects/${safeProjectId}/repository/branches/${encodeURIComponent(branchName)}`, {
          method: 'DELETE',
          headers: { 'PRIVATE-TOKEN': gitlabToken }
        });

        if (deleteResponse.ok) {
          sToast.fire({ icon: 'success', title: `Branch excluída!` });
          await this.deleteLocalBranchLink(task);
        } else {
          sToast.fire({ icon: 'error', title: `Erro ao excluir branch.` });
        }
      }
    }
    return treeUrl;
  }
};

