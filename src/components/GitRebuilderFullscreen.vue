<script setup>
import { ref } from 'vue';
import { 
  RefreshCw, ArrowRight, History, Terminal, X, ChevronLeft, 
  GitBranch, CheckCircle2, AlertTriangle, Play, Search, Check, AlertCircle
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';

const settingsStore = useSettingsStore();

const emit = defineEmits(['close']);

// --- ESTADOS DA SIMULAÇÃO ---
const simulationActive = ref(false);
const simulationTarget = ref(null);
const simulationStep = ref(0);
const simulationLogs = ref([]);
const simulationBranches = ref([]);
const totalBranchesCount = ref(0);

let resolveDestruction = null;
const waitingForDestruction = ref(false);

const confirmDestruction = () => {
  if (resolveDestruction) {
    resolveDestruction();
    resolveDestruction = null;
    waitingForDestruction.value = false;
  }
};

// --- ESTADOS DAS ABAS E MESCLAGEM ---
const activeTab = ref('rebuilder'); // 'rebuilder' ou 'merges'
const mergeTarget = ref(null);      // 'dev-06' ou 'hml'
const mergeLogs = ref([]);          // Logs da aba de mesclagem
const mergeLoadingMap = ref({});    // Mapeamento de branch -> boolean
const mergeStatusMap = ref({});     // Mapeamento de branch -> status string

const addSimLog = (text, type = 'info') => {
  simulationLogs.value.push({
    time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
    text,
    type
  });
};

const addMergeLog = (text, type = 'info') => {
  mergeLogs.value.push({
    time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
    text,
    type
  });
};

const branchesLoading = ref(false);
const searchQuery = ref('');

const fetchBranches = async (target, query = '') => {
  branchesLoading.value = true;
  const useGitLab = !!(settingsStore.gitlabToken && settingsStore.gitlabProjectId);
  if (!useGitLab) {
    const getFallbackMRs = (tgt) => {
      if (tgt === 'dev-06') {
        return [
          { name: 'feature/sist-social-cadastro-unico-128', mr: 128, status: 'waiting' },
          { name: 'feature/sist-social-relatorio-atendimentos-132', mr: 132, status: 'waiting' },
          { name: 'bugfix/sist-social-correcao-busca-135', mr: 135, status: 'waiting' }
        ];
      } else {
        return [
          { name: 'feature/sist-social-integracao-cadunico-118', mr: 118, status: 'waiting' },
          { name: 'release/sist-social-v1.2.0-rc1-115', mr: 115, status: 'waiting' }
        ];
      }
    };
    let list = getFallbackMRs(target);
    if (query) {
      list = list.filter(b => b.name.toLowerCase().includes(query.toLowerCase()));
    }
    simulationBranches.value = list;
    totalBranchesCount.value = list.length;
    branchesLoading.value = false;
    return;
  }

  try {
    let apiBase = settingsStore.gitlabUrl || 'https://gitlab.com';
    if (!apiBase.includes('/api/v4')) {
      const urlObj = new URL(apiBase);
      apiBase = `${urlObj.protocol}//${urlObj.host}/api/v4`;
    }
    const safeProjectId = encodeURIComponent(decodeURIComponent(settingsStore.gitlabProjectId));
    
    let url = `${apiBase}/projects/${safeProjectId}/repository/branches?per_page=100`;
    if (query) {
      url += `&search=${encodeURIComponent(query)}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'PRIVATE-TOKEN': settingsStore.gitlabToken
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitLab HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    data.sort((a, b) => {
      const dateA = a.commit && a.commit.committed_date ? new Date(a.commit.committed_date) : 0;
      const dateB = b.commit && b.commit.committed_date ? new Date(b.commit.committed_date) : 0;
      return dateB - dateA;
    });

    const baseBranches = ['master-sistsocial', 'hml', 'dev-06', 'master', 'main', 'develop'];
    const filtered = data.filter(b => !baseBranches.includes(b.name) && !b.name.startsWith('release/'));
    
    simulationBranches.value = filtered.slice(0, 15).map(b => ({
      name: b.name,
      mr: null,
      title: b.commit ? b.commit.title : 'Commit recente',
      status: 'waiting'
    }));

    const xTotal = response.headers.get('X-Total');
    if (xTotal) {
      totalBranchesCount.value = Math.max(filtered.length, parseInt(xTotal, 10) - (query ? 0 : baseBranches.length));
    } else {
      totalBranchesCount.value = filtered.length;
    }
  } catch (err) {
    console.error(err);
  } finally {
    branchesLoading.value = false;
  }
};

let searchTimeout = null;
const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (simulationTarget.value) {
      fetchBranches(simulationTarget.value, searchQuery.value);
    }
  }, 350);
};

const runRebuildSimulation = async (target) => {
  if (simulationActive.value) return;
  
  simulationActive.value = true;
  simulationTarget.value = target;
  simulationStep.value = 1;
  simulationLogs.value = [];
  simulationBranches.value = [];
  totalBranchesCount.value = 0;
  searchQuery.value = '';

  const useGitLab = !!(settingsStore.gitlabToken && settingsStore.gitlabProjectId);
  const prefix = useGitLab ? '[Real]' : '[Simulado]';

  let apiBase = '';
  let safeProjectId = '';
  if (useGitLab) {
    apiBase = settingsStore.gitlabUrl || 'https://gitlab.com';
    if (!apiBase.includes('/api/v4')) {
      const urlObj = new URL(apiBase);
      apiBase = `${urlObj.protocol}//${urlObj.host}/api/v4`;
    }
    safeProjectId = encodeURIComponent(decodeURIComponent(settingsStore.gitlabProjectId));
  }

  addSimLog(`${prefix} Iniciando pipeline de recriação do ambiente '${target}'...`, 'info');
  
  // 1. Consulta branches de feature ativas para exibição de monitoramento
  addSimLog(`${prefix} Consultando API do GitLab para listar ramificações (branches) remotas do projeto...`, 'info');
  
  await fetchBranches(target);
  
  if (useGitLab) {
    addSimLog(`[Real] Consulta concluída. Encontradas ${totalBranchesCount.value} ramificações ativas no GitLab para merge individual futuro.`, 'success');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Passo 1: Preparação e Backup (Real no GitLab ou Simulado)
  simulationStep.value = 1;
  const timestamp = new Date().toISOString().replace(/T/, '-').replace(/:/g, '').slice(0, 17);
  const backupBranchName = `archive/${target}-${timestamp}`;

  addSimLog(`${prefix} [Fase 1: Backup] Criando branch de backup '${backupBranchName}' a partir de '${target}'...`, 'info');

  if (useGitLab) {
    try {
      const backupUrl = `${apiBase}/projects/${safeProjectId}/repository/branches?branch=${encodeURIComponent(backupBranchName)}&ref=${encodeURIComponent(target)}`;
      const backupRes = await fetch(backupUrl, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': settingsStore.gitlabToken
        }
      });
      if (backupRes.ok) {
        addSimLog(`[Real] [Fase 1: Backup] Backup da antiga '${target}' criado com sucesso no GitLab como '${backupBranchName}'`, 'success');
      } else {
        const errorData = await backupRes.json().catch(() => ({}));
        addSimLog(`[Real] [Fase 1: Backup] Não foi possível criar backup remoto (${errorData.message || backupRes.statusText}). Se a branch '${target}' ainda não existia, isso é normal. Prosseguindo.`, 'warning');
      }
    } catch (e) {
      addSimLog(`[Real] [Fase 1: Backup] Erro de rede ao tentar criar backup: ${e.message}. Prosseguindo com precaução.`, 'warning');
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 1200));
    addSimLog(`[Simulado] [Fase 1: Backup] Executando: git branch -m ${target} ${backupBranchName}`, 'info');
    addSimLog(`[Simulado] [Fase 1: Backup] Backup do ambiente antigo criado com sucesso: ${backupBranchName}`, 'success');
  }

  // Passo 2: Destruição (Aguardando Confirmação Manual)
  waitingForDestruction.value = true;
  addSimLog(`${prefix} [Pausa] Aguardando autorização manual para excluir a branch '${target}'...`, 'warning');
  await new Promise(resolve => {
    resolveDestruction = resolve;
  });

  simulationStep.value = 2;

  if (useGitLab) {
    addSimLog(`[Real] [Fase 2: Destruição] Iniciando deleção da branch antiga '${target}'...`, 'info');
    try {
      const deleteUrl = `${apiBase}/projects/${safeProjectId}/repository/branches/${encodeURIComponent(target)}`;
      const deleteRes = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'PRIVATE-TOKEN': settingsStore.gitlabToken
        }
      });

      if (deleteRes.ok) {
        addSimLog(`[Real] [Fase 2: Destruição] Branch antiga '${target}' deletada com sucesso no GitLab.`, 'success');
      } else if (deleteRes.status === 403) {
        addSimLog(`[Real] [Fase 2: Destruição] ERRO (403 Forbidden): Não foi possível deletar a branch '${target}' porque ela está configurada como PROTEGIDA no GitLab. Por favor, desproteja temporariamente a branch '${target}' nas configurações do GitLab (Settings > Repository > Protected branches) e tente novamente.`, 'error');
        simulationActive.value = false;
        return;
      } else {
        const errorData = await deleteRes.json().catch(() => ({}));
        addSimLog(`[Real] [Fase 2: Destruição] Aviso ao deletar: ${errorData.message || deleteRes.statusText}. Continuando para criação do novo ramo.`, 'warning');
      }
    } catch (err) {
      addSimLog(`[Real] [Fase 2: Destruição] ERRO ao tentar deletar a branch no GitLab: ${err.message}`, 'error');
      simulationActive.value = false;
      return;
    }
  } else {
    addSimLog(`[Simulado] [Fase 2: Destruição] Executando: git branch -D ${target}`, 'info');
    await new Promise(resolve => setTimeout(resolve, 1000));
    addSimLog(`[Simulado] [Fase 2: Destruição] Branch antiga '${target}' destruída com sucesso localmente.`, 'success');
  }

  // Passo 3: Recriação (Real no GitLab ou Simulado)
  await new Promise(resolve => setTimeout(resolve, 1200));
  simulationStep.value = 3;

  if (useGitLab) {
    addSimLog(`[Real] [Fase 3: Recriação] Criando nova branch '${target}' a partir de 'master-sistsocial' no GitLab...`, 'info');
    try {
      const createUrl = `${apiBase}/projects/${safeProjectId}/repository/branches?branch=${encodeURIComponent(target)}&ref=master-sistsocial`;
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': settingsStore.gitlabToken
        }
      });

      if (createRes.ok) {
        addSimLog(`[Real] [Fase 3: Recriação] Nova branch '${target}' recriada e alinhada limpa com a 'master-sistsocial' com sucesso!`, 'success');
      } else {
        const errorData = await createRes.json().catch(() => ({}));
        throw new Error(errorData.message || createRes.statusText);
      }
    } catch (err) {
      addSimLog(`[Real] [Fase 3: Recriação] ERRO ao recriar branch no GitLab: ${err.message}`, 'error');
      simulationActive.value = false;
      return;
    }
  } else {
    addSimLog(`[Simulado] [Fase 3: Recriação] Executando: git checkout master-sistsocial && git pull origin master-sistsocial`, 'info');
    await new Promise(resolve => setTimeout(resolve, 1000));
    addSimLog(`[Simulado] [Fase 3: Recriação] Origem master-sistsocial atualizada e sincronizada com a produção.`, 'success');
    addSimLog(`[Simulado] [Fase 3: Recriação] Executando: git checkout -b ${target}`, 'info');
    await new Promise(resolve => setTimeout(resolve, 1000));
    addSimLog(`[Simulado] [Fase 3: Recriação] Novo ramo de integração '${target}' criado com sucesso a partir de 'master-sistsocial'.`, 'success');
  }

  // Passo 4: Conclusão
  await new Promise(resolve => setTimeout(resolve, 1200));
  simulationStep.value = 4;
  addSimLog(`${prefix} === PIPELINE DE RECONSTRUÇÃO FINALIZADA ===`, 'success');
  addSimLog(`${prefix} Ambiente '${target}' reconstruído e limpo com sucesso a partir da master-sistsocial!`, 'success');
  addSimLog(`${prefix} As branches ativas estão prontas para serem mescladas individualmente de forma posterior.`, 'info');
  simulationActive.value = false;
};

const runIndividualMerge = async (branchName) => {
  if (mergeLoadingMap.value[branchName]) return;
  const target = mergeTarget.value;
  if (!target) return;

  mergeLoadingMap.value[branchName] = true;
  mergeStatusMap.value[branchName] = null;

  const prefix = `[Merge: ${branchName} ➔ ${target}]`;
  addMergeLog(`Iniciando processo de mesclagem para '${branchName}' no ambiente '${target}'...`, 'info');

  const useGitLab = !!(settingsStore.gitlabToken && settingsStore.gitlabProjectId);
  if (useGitLab) {
    try {
      let apiBase = settingsStore.gitlabUrl || 'https://gitlab.com';
      if (!apiBase.includes('/api/v4')) {
        const urlObj = new URL(apiBase);
        apiBase = `${urlObj.protocol}//${urlObj.host}/api/v4`;
      }
      const safeProjectId = encodeURIComponent(decodeURIComponent(settingsStore.gitlabProjectId));

      // 1. Criar um Merge Request temporário
      addMergeLog(`${prefix} Criando Merge Request no GitLab...`, 'info');
      const mrUrl = `${apiBase}/projects/${safeProjectId}/merge_requests`;
      const mrRes = await fetch(mrUrl, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': settingsStore.gitlabToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_branch: branchName,
          target_branch: target,
          title: `TASS Merge: ${branchName} em ${target} (${new Date().toLocaleDateString('pt-BR')})`,
          remove_source_branch: false
        })
      });

      if (!mrRes.ok) {
        const errorData = await mrRes.json().catch(() => ({}));
        throw new Error(errorData.message || mrRes.statusText);
      }

      const mrData = await mrRes.json();
      const mrIid = mrData.iid;
      addMergeLog(`${prefix} Merge Request #${mrIid} criado com sucesso. Aceitando e executando merge...`, 'info');

      // 2. Aceitar/Executar o Merge
      const acceptUrl = `${apiBase}/projects/${safeProjectId}/merge_requests/${mrIid}/merge`;
      const acceptRes = await fetch(acceptUrl, {
        method: 'PUT',
        headers: {
          'PRIVATE-TOKEN': settingsStore.gitlabToken,
          'Content-Type': 'application/json'
        }
      });

      if (acceptRes.ok) {
        addMergeLog(`${prefix} Branch '${branchName}' integrada com SUCESSO no ambiente '${target}' via GitLab!`, 'success');
        mergeStatusMap.value[branchName] = 'success';
      } else if (acceptRes.status === 406 || acceptRes.status === 409) {
        addMergeLog(`${prefix} CONFLITO DE MESCLAGEM DETECTADO no GitLab! Não foi possível mesclar automaticamente.`, 'error');
        mergeStatusMap.value[branchName] = 'conflict';
      } else {
        const errorData = await acceptRes.json().catch(() => ({}));
        throw new Error(errorData.message || acceptRes.statusText);
      }
    } catch (err) {
      addMergeLog(`${prefix} ERRO ao processar merge no GitLab: ${err.message}`, 'error');
      mergeStatusMap.value[branchName] = 'error';
    }
  } else {
    // Modo Simulado
    try {
      addMergeLog(`${prefix} Executando: git checkout ${target} && git merge ${branchName}`, 'info');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const hasConflict = branchName.toLowerCase().includes('bugfix') || branchName.toLowerCase().includes('conflict') || branchName.toLowerCase().includes('fix');
      if (hasConflict) {
        addMergeLog(`${prefix} CONFLITO detectado no arquivo: src/components/GitRebuilderFullscreen.vue. Por favor resolva manualmente.`, 'error');
        mergeStatusMap.value[branchName] = 'conflict';
      } else {
        addMergeLog(`${prefix} Branch '${branchName}' integrada com SUCESSO em '${target}'!`, 'success');
        mergeStatusMap.value[branchName] = 'success';
      }
    } catch (err) {
      addMergeLog(`${prefix} Erro desconhecido: ${err.message}`, 'error');
      mergeStatusMap.value[branchName] = 'error';
    }
  }

  mergeLoadingMap.value[branchName] = false;
};
</script>

<template>
  <div class="fixed inset-0 z-50 bg-[#0B0F19] text-slate-100 flex flex-col font-sans select-none animate-fadeIn">
    <!-- Header -->
    <header class="h-20 border-b border-white/[0.06] px-8 md:px-12 flex items-center justify-between shrink-0 bg-slate-950/20">
      <div class="flex items-center gap-3">
        <button 
          @click="emit('close')"
          class="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer group"
          title="Voltar ao Kanban"
        >
          <ChevronLeft class="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h1 class="text-base font-black text-white flex items-center gap-2">
            <GitBranch class="w-5 h-5 text-indigo-500" />
            Reconstrutor de Ambientes Git
          </h1>
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Simulador de Limpeza e Re-alinhamento de Branches</p>
        </div>
      </div>

      <button 
        @click="emit('close')"
        class="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
      >
        <X class="w-4 h-4" />
        Voltar ao Kanban
      </button>
    </header>

    <!-- Tabs Navigation -->
    <div class="border-b border-white/[0.06] bg-slate-950/10 px-8 md:px-12 flex gap-8 shrink-0">
      <button 
        @click="activeTab = 'rebuilder'"
        class="py-4 text-xs font-black uppercase tracking-wider relative cursor-pointer transition-colors"
        :class="activeTab === 'rebuilder' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'"
      >
        <span class="flex items-center gap-2">
          <RefreshCw class="w-4 h-4" />
          Limpeza e Recriação
        </span>
        <div v-if="activeTab === 'rebuilder'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>
      </button>
      <button 
        @click="activeTab = 'merges'"
        class="py-4 text-xs font-black uppercase tracking-wider relative cursor-pointer transition-colors"
        :class="activeTab === 'merges' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'"
      >
        <span class="flex items-center gap-2">
          <GitBranch class="w-4 h-4" />
          Mesclar Branches
        </span>
        <div v-if="activeTab === 'merges'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full"></div>
      </button>
    </div>

    <!-- Main Container -->
    <main class="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 max-w-7xl mx-auto w-full">
      
      <!-- ABA 1: LIMPEZA E RECRIAÇÃO -->
      <div v-if="activeTab === 'rebuilder'" class="space-y-8 animate-fadeIn">
        <!-- Top Cards: Branch Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- master -->
          <div class="p-6 bg-slate-950/40 rounded-2xl border border-emerald-500/10 flex flex-col justify-between shadow-sm">
            <div>
              <div class="flex items-center justify-between mb-4">
                <span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-wider rounded-lg">Estável</span>
                <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              </div>
               <h3 class="text-xl font-black text-white font-mono text-emerald-400">master-sistsocial</h3>
            </div>
            <div class="mt-6 pt-4 border-t border-white/[0.04]">
              <p class="text-[10px] text-slate-400 font-bold uppercase">Ramo de Produção Real</p>
              <p class="text-[9px] text-slate-500 mt-0.5 font-medium">Origem estável de onde os ambientes são recriados.</p>
            </div>
          </div>

          <!-- hml -->
          <div class="p-6 bg-slate-950/40 rounded-2xl border border-indigo-500/10 flex flex-col justify-between shadow-sm">
            <div>
              <div class="flex items-center justify-between mb-4">
                <span class="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase tracking-wider rounded-lg">Homologação</span>
                <div class="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.3)]"></div>
              </div>
              <h3 class="text-xl font-black text-white font-mono">hml</h3>
            </div>
            <div class="mt-6 pt-4 border-t border-white/[0.04]">
              <p class="text-[10px] text-slate-400 font-bold uppercase">Fase de Testes Finais</p>
              <p class="text-[9px] text-slate-500 mt-0.5">Código validado e homologado antes do merge para produção.</p>
            </div>
          </div>

          <!-- dev -->
          <div class="p-6 bg-slate-950/40 rounded-2xl border border-amber-500/10 flex flex-col justify-between shadow-sm">
            <div>
              <div class="flex items-center justify-between mb-4">
                <span class="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-wider rounded-lg">Desenvolvimento</span>
                <div class="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]"></div>
              </div>
              <h3 class="text-xl font-black text-white font-mono text-amber-400">dev-06</h3>
            </div>
            <div class="mt-6 pt-4 border-t border-white/[0.04]">
              <p class="text-[10px] text-slate-400 font-bold uppercase">Ramo de Integração Real</p>
              <p class="text-[9px] text-slate-500 mt-0.5 font-medium">Ambiente de desenvolvimento diário.</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-6">
          <button 
            @click="runRebuildSimulation('dev-06')"
            :disabled="simulationActive"
            class="flex-1 flex items-center justify-center gap-3 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': simulationActive && simulationTarget === 'dev-06' }" />
            Recriar dev-06 (da master-sistsocial)
          </button>
          
          <button 
            @click="runRebuildSimulation('hml')"
            :disabled="simulationActive"
            class="flex-1 flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/10 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': simulationActive && simulationTarget === 'hml' }" />
            Recriar hml (da master-sistsocial)
          </button>
        </div>

        <!-- Simulator Output Section -->
        <div v-if="simulationTarget" class="p-6 md:p-8 bg-slate-950/40 rounded-3xl border border-white/[0.06] space-y-8 animate-fadeIn">
          <!-- Pipeline Stepper -->
          <div class="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
            <div class="flex items-center gap-2.5" :class="simulationStep >= 1 ? 'text-indigo-400' : 'text-slate-500'">
              <span class="w-6 h-6 flex items-center justify-center rounded-full border text-[10px] font-black" :class="simulationStep >= 1 ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600'">1</span>
              <span class="text-[10px] font-black uppercase tracking-wider">Backup</span>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-600 shrink-0" />
            <div class="flex items-center gap-2.5" :class="simulationStep >= 2 ? 'text-indigo-400' : 'text-slate-500'">
              <span class="w-6 h-6 flex items-center justify-center rounded-full border text-[10px] font-black" :class="simulationStep >= 2 ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600'">2</span>
              <span class="text-[10px] font-black uppercase tracking-wider">Destruição</span>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-600 shrink-0" />
            <div class="flex items-center gap-2.5" :class="simulationStep >= 3 ? 'text-indigo-400' : 'text-slate-500'">
              <span class="w-6 h-6 flex items-center justify-center rounded-full border text-[10px] font-black" :class="simulationStep >= 3 ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600'">3</span>
              <span class="text-[10px] font-black uppercase tracking-wider">Recriação</span>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-600 shrink-0" />
            <div class="flex items-center gap-2.5" :class="simulationStep >= 4 ? 'text-emerald-400' : 'text-slate-500'">
              <span class="w-6 h-6 flex items-center justify-center rounded-full border text-[10px] font-black" :class="simulationStep >= 4 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'">✓</span>
              <span class="text-[10px] font-black uppercase tracking-wider">Concluído</span>
            </div>
          </div>

          <!-- Botão de Confirmação de Destruição -->
          <div v-if="waitingForDestruction" class="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div class="flex items-center gap-4">
              <AlertTriangle class="w-8 h-8 text-red-500 shrink-0" />
              <div>
                <h4 class="text-sm font-black text-white">Ação Destrutiva Pendente</h4>
                <p class="text-[10px] text-slate-400 font-medium mt-1 mb-2">Você está prestes a excluir a branch atual permanentemente do GitLab. Confirme para prosseguir com a recriação limpa.</p>
                <code class="px-2.5 py-1 bg-black/40 text-red-400 rounded text-[10px] font-mono border border-red-500/20 shadow-inner">Equivalente a: git push origin --delete {{ simulationTarget }}</code>
              </div>
            </div>
            <button 
              @click="confirmDestruction"
              class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-red-500/20 whitespace-nowrap"
            >
              Autorizar Exclusão
            </button>
          </div>

          <!-- Console Git (Full width) -->
          <div class="space-y-4 text-left">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal class="w-4 h-4 text-indigo-400" />
              Console de Logs Git (Feedback)
            </h4>
            <div class="bg-black/95 border border-white/[0.06] rounded-2xl p-5 font-mono text-[10px] leading-relaxed text-slate-300 min-h-[300px] max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-2">
              <div v-if="simulationLogs.length === 0" class="text-slate-600 italic">Aguardando início...</div>
              <div 
                v-for="(log, idx) in simulationLogs" 
                :key="idx"
                :class="{
                  'text-slate-400': log.type === 'info',
                  'text-emerald-400': log.type === 'success',
                  'text-amber-400': log.type === 'warning',
                  'text-red-400 font-bold': log.type === 'error'
                }"
              >
                <span class="text-slate-600">[{{ log.time }}]</span> {{ log.text }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ABA 2: MESCLAR BRANCHES -->
      <div v-else class="space-y-8 animate-fadeIn">
        <!-- Target Selection buttons -->
        <div class="p-6 bg-slate-950/40 rounded-2xl border border-white/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 class="text-sm font-black text-white">Selecione o Ambiente de Destino</h3>
            <p class="text-[10px] text-slate-400 font-medium mt-1">Escolha qual ambiente receberá a mesclagem da branch de feature.</p>
          </div>
          <div class="flex gap-4">
            <button 
              @click="mergeTarget = 'dev-06'; fetchBranches('dev-06', searchQuery)"
              class="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border"
              :class="mergeTarget === 'dev-06' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/5 border-white/[0.06] text-slate-300 hover:bg-white/10'"
            >
              dev-06
            </button>
            <button 
              @click="mergeTarget = 'hml'; fetchBranches('hml', searchQuery)"
              class="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border"
              :class="mergeTarget === 'hml' ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/[0.06] text-slate-300 hover:bg-white/10'"
            >
              hml
            </button>
          </div>
        </div>

        <div v-if="mergeTarget" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Monitor de Features -->
          <div class="space-y-4 text-left">
            <div class="flex items-center justify-between">
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History class="w-4 h-4 text-indigo-400" />
                Branches Disponíveis para Merge no {{ mergeTarget }}
              </h4>
              <span v-if="totalBranchesCount > 0" class="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-wider rounded-lg border border-indigo-500/20">
                Total: {{ totalBranchesCount }} ativas
              </span>
            </div>
            
            <!-- Campo de Busca de Branches -->
            <div class="relative">
              <input 
                v-model="searchQuery"
                type="text"
                placeholder="Buscar branch por nome..."
                class="w-full bg-slate-900/60 border border-white/[0.06] rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                @input="handleSearch"
              />
              <div class="absolute right-3 top-3 flex items-center gap-1.5 pointer-events-none">
                <RefreshCw v-if="branchesLoading" class="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <Search v-else class="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>

            <div class="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              <div v-if="simulationBranches.length === 0" class="p-8 text-center text-xs text-slate-500 border border-dashed border-white/[0.06] rounded-2xl">
                Nenhuma branch encontrada.
              </div>
              <div 
                v-for="branch in simulationBranches" 
                :key="branch.name"
                class="flex items-center justify-between p-4 bg-slate-900/40 border border-white/[0.04] rounded-2xl"
              >
                <div>
                  <p class="text-xs font-black text-white leading-tight font-mono">{{ branch.name }}</p>
                  <p class="text-[9px] text-slate-500 font-bold mt-0.5">
                    {{ branch.mr ? 'GitLab Merge Request #' + branch.mr : branch.title }}
                  </p>
                </div>
                
                <div class="flex items-center gap-2">
                  <!-- Status Map Checks -->
                  <span v-if="mergeStatusMap[branch.name] === 'success'" class="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-black uppercase rounded-lg tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Check class="w-3.5 h-3.5" />
                    Mesclado
                  </span>
                  <span v-else-if="mergeStatusMap[branch.name] === 'conflict'" class="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-black uppercase rounded-lg tracking-wider bg-red-500/10 text-red-400 border border-red-500/20" title="Resolva no GitLab">
                    <AlertCircle class="w-3.5 h-3.5" />
                    Conflito
                  </span>
                  <span v-else-if="mergeStatusMap[branch.name] === 'error'" class="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-black uppercase rounded-lg tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <AlertTriangle class="w-3.5 h-3.5" />
                    Erro
                  </span>

                  <!-- Action Button -->
                  <button 
                    v-if="!mergeStatusMap[branch.name] || mergeStatusMap[branch.name] === 'error'"
                    @click="runIndividualMerge(branch.name)"
                    :disabled="mergeLoadingMap[branch.name]"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw v-if="mergeLoadingMap[branch.name]" class="w-3 h-3 animate-spin" />
                    Mesclar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Console Git para merges -->
          <div class="space-y-4 text-left">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal class="w-4 h-4 text-indigo-400" />
              Console de Operações de Merge
            </h4>
            <div class="bg-black/95 border border-white/[0.06] rounded-2xl p-5 font-mono text-[10px] leading-relaxed text-slate-300 min-h-[350px] max-h-[420px] overflow-y-auto custom-scrollbar flex flex-col gap-2">
              <div v-if="mergeLogs.length === 0" class="text-slate-600 italic">Selecione uma branch e clique em "Mesclar" para iniciar...</div>
              <div 
                v-for="(log, idx) in mergeLogs" 
                :key="idx"
                :class="{
                  'text-slate-400': log.type === 'info',
                  'text-emerald-400': log.type === 'success',
                  'text-amber-400': log.type === 'warning',
                  'text-red-400 font-bold': log.type === 'error'
                }"
              >
                <span class="text-slate-600">[{{ log.time }}]</span> {{ log.text }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="p-12 text-center text-xs text-slate-500 border border-dashed border-white/[0.06] rounded-3xl">
          Selecione hml ou dev-06 acima para ver as ramificações disponíveis para mesclagem.
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
</style>
