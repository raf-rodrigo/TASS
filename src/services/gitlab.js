import { db } from '../db.js';
import { gitBranchSlug } from '../utils/string.js';
import { notificationService } from './notificationService.js';

export const gitlabService = {
  getBranchName(task) {
    if (task.branchName) return task.branchName;
    const titlePart = gitBranchSlug(task.title);
    const descPart = task.description ? gitBranchSlug(task.description) : '';
    return descPart ? `${titlePart}-${descPart}` : titlePart;
  },

  async deleteLocalBranchLink(task) {
    await db.tasks.update(task.id, { branchUrl: undefined, branchName: undefined });
    task.branchUrl = undefined;
    task.branchName = undefined;
    notificationService.toast('Links locais removidos.', 'success');
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
      const baseUrl = gitlabUrl.replace(/\/$/, '');
      const treeUrl = `${baseUrl}/-/tree/${encodeURIComponent(branchName)}`;

      // Se existe remoto mas NÃO tem link local, oferece vincular
      if (!task.branchUrl) {
        const confirmed = await notificationService.confirm(
          'Branch Encontrada',
          `A branch '${branchName}' já existe no GitLab, mas não está vinculada a esta tarefa.\nDeseja vincular este link localmente?`,
          'Sim, Vincular',
          'info'
        );

        if (confirmed) {
          await db.tasks.update(task.id, { branchUrl: treeUrl, branchName: branchName });
          task.branchUrl = treeUrl;
          task.branchName = branchName;
          notificationService.toast('Link da branch vinculado com sucesso!', 'success');
          return treeUrl;
        }
      }

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
        await db.tasks.update(task.id, { branchUrl: treeUrl, branchName: branchName });
        task.branchUrl = treeUrl;
        task.branchName = branchName;
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
        'error'
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
  },

  async analyzeAndMerge(task, settings, targetBranch = 'dev-06') {
    const { gitlabUrl, gitlabToken, gitlabProjectId, gitlabIntegrationMode } = settings;
    
    // Tenta pegar o nome exato da branch pela URL salva, caso contrário usa o gerador
    let sourceBranch = this.getBranchName(task);
    if (task.branchUrl && task.branchUrl.includes('/-/tree/')) {
       sourceBranch = decodeURIComponent(task.branchUrl.split('/-/tree/')[1]);
    }

    if (gitlabIntegrationMode !== 'api') {
      notificationService.toast("Esta função requer integração via API.", "warning");
      return;
    }

    if (!gitlabToken || !gitlabProjectId) {
      notificationService.toast("Configuração incompleta: Preencha o Token e o ID.", "error");
      return;
    }

    try {
      const urlObj = new URL(gitlabUrl);
      const gitlabOrigin = urlObj.origin;
      const safeProjectId = encodeURIComponent(decodeURIComponent(gitlabProjectId));

      // 1. Obter quantidade de arquivos alterados
      let filesChanged = 0;
      try {
        const compareRes = await fetch(`${gitlabOrigin}/api/v4/projects/${safeProjectId}/repository/compare?from=${encodeURIComponent(targetBranch)}&to=${encodeURIComponent(sourceBranch)}`, {
          method: 'GET',
          headers: { 'PRIVATE-TOKEN': gitlabToken }
        });
        
        if (!compareRes.ok) {
           const errBody = await compareRes.text();
           notificationService.toast(`Erro na comparação: ${compareRes.status} - A branch ${sourceBranch} existe?`, "error");
           console.error("Compare response error:", errBody);
           return;
        }

        const compareData = await compareRes.json();
        // O GitLab pode não retornar `diffs` dependendo do tamanho, então checamos commits também
        const hasCommits = compareData.commits && compareData.commits.length > 0;
        filesChanged = compareData.diffs ? compareData.diffs.length : (hasCommits ? 1 : 0);

        if (filesChanged === 0 && !hasCommits) {
          notificationService.toast("As branches já estão iguais. Nenhuma alteração para merge.", "info");
          return;
        }
      } catch (err) {
        console.warn("Erro ao comparar branches", err);
        notificationService.toast("Erro de rede ao comparar branches.", "error");
        return;
      }

      // 2. Criar MR para verificar conflitos
      const mrRes = await fetch(`${gitlabOrigin}/api/v4/projects/${safeProjectId}/merge_requests`, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': gitlabToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_branch: sourceBranch,
          target_branch: targetBranch,
          title: `[TASS] Merge automatizado ${sourceBranch} -> ${targetBranch}`,
          remove_source_branch: false
        })
      });

      if (!mrRes.ok) {
        const errorData = await mrRes.json().catch(() => ({}));
        let errorMsg = errorData.message || errorData.error || mrRes.statusText;
        if (Array.isArray(errorMsg)) errorMsg = errorMsg.join(', ');
        else if (typeof errorMsg === 'object') errorMsg = JSON.stringify(errorMsg);
        
        // Se a mensagem diz que já existe um MR, tratamos de forma especial
        if (errorMsg.includes('already exists')) {
          notificationService.toast(`Já existe um Merge Request aberto para esta branch. Feche-o antes de usar o merge rápido.`, 'warning');
        } else {
          notificationService.toast(`Erro ao criar MR: ${errorMsg}`, 'error');
        }
        return;
      }

      const mrData = await mrRes.json();
      const mrIid = mrData.iid;

      // 3. Polling para checar merge status
      let hasConflicts = false;
      let checkCount = 0;
      let mergeStatus = 'checking';

      while (checkCount < 10) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const statusRes = await fetch(`${gitlabOrigin}/api/v4/projects/${safeProjectId}/merge_requests/${mrIid}`, {
          method: 'GET',
          headers: { 'PRIVATE-TOKEN': gitlabToken }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          mergeStatus = statusData.merge_status;
          hasConflicts = statusData.has_conflicts;
          if (mergeStatus !== 'checking' && mergeStatus !== 'unchecked') {
            break;
          }
        }
        checkCount++;
      }

      let confirmed = false;

      // 4. Confirmar ou Alertar
      if (hasConflicts || mergeStatus === 'cannot_be_merged') {
         await notificationService.alert(
            'Conflitos Detectados',
            `Estatísticas:\n- Arquivos alterados: ${filesChanged}\n- Status: Com Conflitos\n\nA branch '${sourceBranch}' está em conflito com a branch '${targetBranch}'.\nNão é possível realizar o merge automaticamente. Resolva os conflitos no GitLab e tente novamente.`,
            'error'
         );
         confirmed = false;
      } else {
         confirmed = await notificationService.confirm(
            'Confirmar Merge',
            `Estatísticas:\n- Arquivos alterados: ${filesChanged}\n- Conflitos: Nenhum\n\nDeseja realizar o merge em ${targetBranch} agora?`,
            'Sim, Fazer Merge',
            'info',
            'Cancelar'
         );
      }

      // 5. Finalizar ou fechar MR
      if (confirmed === 'confirmed' || confirmed === true) {
         const doMergeRes = await fetch(`${gitlabOrigin}/api/v4/projects/${safeProjectId}/merge_requests/${mrIid}/merge`, {
            method: 'PUT',
            headers: { 'PRIVATE-TOKEN': gitlabToken }
         });

         if (doMergeRes.ok) {
            notificationService.toast(`Merge realizado com sucesso para ${targetBranch}!`, 'success');
         } else {
            const errData = await doMergeRes.json().catch(() => ({}));
            notificationService.toast(`Erro no merge: ${errData.message || 'Desconhecido'}`, 'error');
         }
      } else {
         // Fecha o MR em caso de cancelamento ou conflito
         await fetch(`${gitlabOrigin}/api/v4/projects/${safeProjectId}/merge_requests/${mrIid}`, {
            method: 'PUT',
            headers: {
               'PRIVATE-TOKEN': gitlabToken,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({ state_event: 'close' })
         });
         
         if (!hasConflicts && mergeStatus !== 'cannot_be_merged') {
            notificationService.toast('Merge cancelado.', 'info');
         }
      }

    } catch (err) {
      notificationService.toast(`Falha na comunicação: ${err.message}`, 'error');
    }
  }
};
