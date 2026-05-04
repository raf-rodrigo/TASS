import { toast as sToast, confirm as sConfirm } from '../utils/swal.js';
import { db } from '../db.js';
import { slugify } from '../utils/string.js';

export const gitlabService = {
  getBranchName(task) {
    let combined = task.title;
    if (task.description) {
      combined += '-' + task.description;
    }
    return slugify(combined);
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
          text: `O branch vinculado a esta tarefa não existe mais no GitLab.\nO que deseja fazer?`,
          confirmButtonText: 'Recriar Branch',
          cancelButtonText: 'Fechar',
          cancelClass: 'btn btn-secondary',
          showDenyButton: true,
          denyButtonText: 'Excluir Link Local',
          denyClass: 'btn btn-danger',
          icon: 'warning'
        });

        if (result.isConfirmed) {
          return await this.createBranch(task, settings);
        } else if (result.isDenied) {
          await this.deleteLocalBranchLink(task);
        }
      } else {
        // No link, no branch -> Ask to create
        const result = await sConfirm({
          title: 'Criar Branch',
          text: `Deseja criar a branch '${branchName}' no GitLab?`,
          confirmButtonText: 'Sim, Criar',
          cancelButtonText: 'Fechar',
          cancelClass: 'btn btn-secondary',
          icon: 'question'
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
      html: `A branch <b>${branchName}</b> já existe no GitLab.<br><br>O que deseja fazer?`,
      confirmButtonText: 'Abrir Branch',
      cancelButtonText: 'Deletar Branch',
      cancelClass: 'btn btn-danger',
      showDenyButton: true,
      denyButtonText: 'Fechar',
      denyClass: 'btn btn-secondary',
      icon: 'info'
    });

    if (result.isConfirmed) {
      window.open(treeUrl, '_blank');
    } else if (result.dismiss === 'cancel') {
      const confirmDelete = await sConfirm({
        title: 'Alerta de Exclusão',
        text: `Deseja realmente DELETAR a branch '${branchName}'?`,
        confirmButtonText: 'Sim, Deletar',
        confirmClass: 'btn btn-danger',
        cancelButtonText: 'Fechar',
        icon: 'warning'
      });

      if (confirmDelete.isConfirmed) {
        const deleteResponse = await fetch(`${gitlabOrigin}/api/v4/projects/${safeProjectId}/repository/branches/${encodeURIComponent(branchName)}`, {
          method: 'DELETE',
          headers: { 'PRIVATE-TOKEN': gitlabToken }
        });

        if (deleteResponse.ok || deleteResponse.status === 404) {
          sToast.fire({ icon: 'success', title: `Branch removida!` });
        } else {
          sToast.fire({ icon: 'error', title: `Erro ao excluir no GitLab, mas limpando link local.` });
        }
        
        // Sempre removemos o link local se o usuário confirmou a intenção de excluir
        await this.deleteLocalBranchLink(task);
      }
    }
    return treeUrl;
  }
};

