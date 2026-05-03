import { toast as sToast, confirm as sConfirm } from '../utils/swal.js';
import { db } from '../db.js';

export const gitlabService = {
  async createBranch(task, settings) {
    const { gitlabUrl, gitlabToken, gitlabProjectId, gitlabBaseBranch, gitlabIntegrationMode } = settings;
    
    let combined = task.title;
    if (task.description) {
      combined += '-' + task.description;
    }
    const formatted = combined.toLowerCase().replace(/\s+/g, '-');
    const branchName = formatted; // Note: type prefix was optional in original code
    
    if (gitlabIntegrationMode === 'api') {
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
          
          return { treeUrl, branchName };
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.message || errorData.error || response.statusText;

          if (response.status === 400 && String(errorMsg).toLowerCase().includes('already exists')) {
             return await this.handleExistingBranch(branchName, gitlabUrl, gitlabOrigin, safeProjectId, gitlabToken);
          } else {
            sToast.fire({ icon: 'error', title: `Erro do GitLab: ${errorMsg}` });
          }
        }
      } catch (err) {
        sToast.fire({ icon: 'error', title: `Falha na comunicação: ${err.message}` });
      }
    } else {
      // Magic Link Mode
      const baseUrl = gitlabUrl.replace(/\/$/, '');
      const treeUrl = `${baseUrl}/-/branches/new?branch_name=${encodeURIComponent(branchName)}`;
      return { treeUrl, branchName, mode: 'magic' };
    }
  },

  async handleExistingBranch(branchName, gitlabUrl, gitlabOrigin, safeProjectId, gitlabToken) {
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
        confirmButtonClass: 'btn btn-danger',
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
        } else {
          sToast.fire({ icon: 'error', title: `Erro ao excluir branch.` });
        }
      }
    }
    return treeUrl;
  }
};
