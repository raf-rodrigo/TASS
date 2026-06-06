<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { 
  RefreshCw, Terminal,
  GitBranch, AlertTriangle, Check,
  Trash2, Eye, EyeOff, Lock, Settings, Info, CloudLightning
} from 'lucide-vue-next';

import { useSettingsStore } from '../../stores/settingsStore';
import BaseModal from '../BaseModal.vue';
import AppInput from '../base/AppInput.vue';
import TerminalConsole from './TerminalConsole.vue';
import BranchList from './BranchList.vue';
import ActionPanel from './ActionPanel.vue';
import { gitProviderService } from '../../services/gitProvider';
import { notificationService } from '../../services/notificationService';

const settingsStore = useSettingsStore();
const emit = defineEmits(['close']);

// --- MANIPULAÇÃO DINÂMICA DE FAVICON ---
let originalFavicon = null;
let originalFaviconType = null;

onMounted(() => {
  const link = document.querySelector("link[rel~='icon']");
  if (link) {
    originalFavicon = link.href;
    originalFaviconType = link.type;
    link.href = '/breeze-favicon.png';
    link.type = 'image/png';
  } else {
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.href = '/breeze-favicon.png';
    newLink.type = 'image/png';
    document.head.appendChild(newLink);
  }
});

onUnmounted(() => {
  const link = document.querySelector("link[rel~='icon']");
  if (link && originalFavicon) {
    link.href = originalFavicon;
    if (originalFaviconType) link.type = originalFaviconType;
  }
});

// --- ESTADOS DO PIPELINE DE RECONSTRUÇÃO ---
const pipelineActive = ref(false);
const pipelineTarget = ref(null); // 'dev' ou 'hml'
const pipelineStep = ref(0);
const pipelineLogs = ref([]);
const activeBranches = ref([]);
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

// --- ESTADOS DAS ABAS, MESCLAGEM E DELEÇÃO ---
const activeTab = ref('merges'); // 'rebuilder' ou 'merges'
const mergeTarget = ref(null);      // Nome físico da branch selecionada (dev ou hml)
const mergeTargetType = ref(null);    // 'dev' ou 'hml'
const mergeLogs = ref([]);          // Logs da aba de mesclagem
const mergeLoadingMap = ref({});    // Mapeamento de branch -> boolean
const mergeStatusMap = ref({});     // Mapeamento de branch -> status string
const branchesFetched = ref(false);

// --- ESTADOS DE CONFIGURAÇÕES E MODAIS ---
// Modal de deleção
const showDeleteConfirmModal = ref(false);
const branchToDelete = ref(null);
const deleteLoading = ref(false);

// Modal de Confirmação de Mesclagem
const showMergeConfirmModal = ref(false);
const mergeConfirmTargetBranch = ref('');
const mergeConfirmTargetType = ref('');
const mergeConfirmSourceBranch = ref('');

// Estados de Verificação de Merge (Pre-Check)
const mergeCheckStatus = ref('idle'); // 'idle', 'checking', 'mergeable', 'conflict', 'no_changes', 'error'
const mergeCheckMessage = ref('');
const currentCheckMrIid = ref(null); // Armazena o ID do MR de teste para fechamento automático

// Exclusão em lote (Bulk Delete)
const selectedBranches = ref([]);
const showBulkDeleteModal = ref(false);

const decreaseFontSize = () => {
  if (settingsStore.consoleFontSize > 10) {
    settingsStore.consoleFontSize--;
    settingsStore.saveSetting('consoleFontSize', settingsStore.consoleFontSize);
  }
};

const closeSettings = () => {
  // Reverte as CSS variables para os valores salvos na store
  document.documentElement.style.setProperty('--app-card-radius', `${settingsStore.cardRadius}px`);
  document.documentElement.style.setProperty('--app-input-radius', `${settingsStore.inputRadius}px`);
  showSettingsModal.value = false;
};

const increaseFontSize = () => {
  if (settingsStore.consoleFontSize < 18) {
    settingsStore.consoleFontSize++;
    settingsStore.saveSetting('consoleFontSize', settingsStore.consoleFontSize);
  }
};



const addPipelineLog = (text, type = 'info', link = null) => {
  pipelineLogs.value.push({
    time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
    text,
    type,
    link
  });
};

const addMergeLog = (text, type = 'info', link = null) => {
  mergeLogs.value.push({
    time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
    text,
    type,
    link
  });
};

const branchesLoading = ref(false);
const branchesError = ref('');
const searchQuery = ref('');
const branchesOrder = ref('desc'); // 'desc' (mais novo) ou 'asc' (mais antigo)

// Computed property para filtrar e ordenar as branches no frontend de forma instantânea
const filteredBranches = computed(() => {
  let list = [...activeBranches.value];
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(b => 
      b.name.toLowerCase().includes(q) || 
      (b.title && b.title.toLowerCase().includes(q))
    );
  }
  
  list.sort((a, b) => {
    const dateA = a.committedDate ? new Date(a.committedDate).getTime() : 0;
    const dateB = b.committedDate ? new Date(b.committedDate).getTime() : 0;
    if (branchesOrder.value === 'desc') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });
  
  return list;
});

const fetchBranches = async (target, isBackgroundSearch = false) => {

  branchesLoading.value = true;
  if (!isBackgroundSearch) {
    branchesError.value = '';
  }
  
  try {
    const data = await gitProviderService.breezeGetBranches(
      settingsStore, 
      target, 
      searchQuery.value, 
      branchesOrder.value
    );

    const baseBranches = [
      settingsStore.activeBranchMaster,
      settingsStore.activeBranchHml,
      settingsStore.activeBranchDev,
      'master', 'main', 'develop'
    ];
    
    // Filtra para remover ramos base e releases padrão
    const filtered = data.filter(b => !baseBranches.includes(b.name) && !b.name.startsWith('release/'));
    
    activeBranches.value = filtered.map(b => ({
      name: b.name,
      mr: null,
      title: b.title || 'Commit recente',
      status: 'waiting',
      committedDate: b.committedDate || '',
      authorName: b.authorName || ''
    }));

    totalBranchesCount.value = filtered.length;
  } catch (err) {
    console.error(err);
    if (!isBackgroundSearch) {
      branchesError.value = `Erro ao carregar branches do ${gitProviderService.getProviderName(settingsStore)}: ${err.message}`;
      activeBranches.value = [];
      totalBranchesCount.value = 0;
    }
  } finally {
    branchesLoading.value = false;
  }
};

let searchTimeout = null;
const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (mergeTarget.value) {
      fetchBranches(mergeTarget.value, true);
    }
  }, 400);
};

const selectMergeTarget = (target, type) => {
  searchQuery.value = '';
  branchesError.value = '';
  selectedBranches.value = []; // Reseta a seleção de branches
  mergeTarget.value = target;
  mergeTargetType.value = type;
  fetchBranches(target, false);
};

const listAllBranches = async () => {
  searchQuery.value = '';
  branchesError.value = '';
  selectedBranches.value = [];
  // Usamos Desenvolvimento por padrão para a chamada do GitLab
  mergeTarget.value = settingsStore.activeBranchDev;
  mergeTargetType.value = 'dev';
  await fetchBranches(settingsStore.activeBranchDev, false);
  branchesFetched.value = true;
};

const performMergeCheck = async (source, target) => {
  mergeCheckStatus.value = 'checking';
  mergeCheckMessage.value = `Analisando branch e verificando conflitos no ${gitProviderService.getProviderName(settingsStore)}...`;

  try {
    const result = await gitProviderService.breezeCheckMergeStatus(settingsStore, source, target);
    
    if (result.status === 'error') {
       throw new Error(result.message);
    }
    
    mergeCheckStatus.value = result.status;
    mergeCheckMessage.value = result.message;
    if (result.mrIid) {
       currentCheckMrIid.value = result.mrIid;
    }
  } catch (err) {
    mergeCheckStatus.value = 'error';
    mergeCheckMessage.value = `Erro na verificação: ${err.message}`;
  }
};

const runMergeToTarget = (targetBranch, targetType) => {
  if (selectedBranches.value.length !== 1) return;
  const branchName = selectedBranches.value[0];
  
  mergeConfirmTargetBranch.value = targetBranch;
  mergeConfirmTargetType.value = targetType;
  mergeConfirmSourceBranch.value = branchName;
  showMergeConfirmModal.value = true;
  
  // Inicia a verificação assim que o modal abre
  performMergeCheck(branchName, targetBranch);
};

const cancelMergeCheck = async () => {
  showMergeConfirmModal.value = false;
  if (currentCheckMrIid.value) {
    const iidToClose = currentCheckMrIid.value;
    currentCheckMrIid.value = null; // Evita duplicação de chamadas

    try {
      await gitProviderService.breezeCloseMergeRequest(settingsStore, iidToClose);
      addMergeLog(`Pull/Merge Request de teste #${iidToClose} foi fechado e descartado (Cancelamento ou Conflito).`, 'info');
    } catch (err) {
      console.error("Falha ao fechar request de teste:", err);
    }
  }
};

const executeMergeAfterConfirm = async () => {
  showMergeConfirmModal.value = false;
  
  const branchName = mergeConfirmSourceBranch.value;
  const targetBranch = mergeConfirmTargetBranch.value;
  const targetType = mergeConfirmTargetType.value;
  
  if (!branchName || !targetBranch || !currentCheckMrIid.value) return;
  
  mergeTarget.value = targetBranch;
  mergeTargetType.value = targetType;
  
  const iidToMerge = currentCheckMrIid.value;
  currentCheckMrIid.value = null; 
  
  mergeLoadingMap.value[branchName] = true;
  mergeStatusMap.value[branchName] = null;

  const prefix = `[Merge: ${branchName} ➔ ${targetBranch}]`;
  addMergeLog(`Iniciando mesclagem de '${branchName}' no ambiente '${targetBranch}'...`, 'info');

  try {
    await gitProviderService.breezeExecuteMergeRequest(settingsStore, iidToMerge);
    addMergeLog(`${prefix} Branch '${branchName}' integrada com SUCESSO no ${gitProviderService.getProviderName(settingsStore)}!`, 'success');
    mergeStatusMap.value[branchName] = 'success';
  } catch (err) {
    addMergeLog(`${prefix} ERRO no merge: ${err.message}`, 'error');
    mergeStatusMap.value[branchName] = 'error';
  }

  mergeLoadingMap.value[branchName] = false;
};

const toggleOrderAndRefetch = async () => {
  branchesOrder.value = branchesOrder.value === 'desc' ? 'asc' : 'desc';
  if (branchesFetched.value) {
    await fetchBranches(settingsStore.activeBranchDev, false);
  }
};

const runRebuildPipeline = async (type) => {
  if (pipelineActive.value) return;

  const target = type === 'dev' ? settingsStore.activeBranchDev : settingsStore.activeBranchHml;
  
  if (target === settingsStore.activeBranchMaster) {
    notificationService.alert("Operação Bloqueada", "A branch Master é totalmente protegida.", "warning");
    return;
  }

  pipelineActive.value = true;
  pipelineTarget.value = type;
  pipelineStep.value = 1;
  pipelineLogs.value = [];
  activeBranches.value = [];
  totalBranchesCount.value = 0;
  searchQuery.value = '';

  addPipelineLog(`Iniciando pipeline de recriação do ambiente '${target}' no ${gitProviderService.getProviderName(settingsStore)}...`, 'info');
  addPipelineLog(`Consultando branches de feature ativas...`, 'info');
  await fetchBranches(target);
  addPipelineLog(`Consulta concluída. Encontradas ${totalBranchesCount.value} branches ativas.`, 'success');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Passo 1: Backup
  pipelineStep.value = 1;
  let timestamp = "";
  try {
    const timeRes = await fetch('http://127.0.0.1:5501/api/server-time');
    if (timeRes.ok) timestamp = (await timeRes.json()).timestamp;
    else throw new Error();
  } catch (e) {
    const now = new Date();
    timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
  }
  
  const backupBranchName = `archive/${target}-${timestamp}`;
  addPipelineLog(`[Fase 1: Backup] Criando branch de backup '${backupBranchName}' a partir de '${target}'...`, 'info');

  try {
    await gitProviderService.breezeCreateBranch(settingsStore, backupBranchName, target);
    addPipelineLog(`[Fase 1: Backup] Backup criado com sucesso como '${backupBranchName}'`, 'success');
  } catch (e) {
    addPipelineLog(`[Fase 1: Backup] Erro: ${e.message}. Prosseguindo.`, 'warning');
  }

  // Passo 2: Destruição
  waitingForDestruction.value = true;
  addPipelineLog(`[Pausa] Aguardando autorização manual para excluir a branch '${target}'...`, 'warning');
  await new Promise(resolve => resolveDestruction = resolve);

  pipelineStep.value = 2;
  addPipelineLog(`[Fase 2: Destruição] Iniciando deleção da branch antiga '${target}'...`, 'info');
  try {
    await gitProviderService.breezeDeleteBranch(settingsStore, target);
    addPipelineLog(`[Fase 2: Destruição] Branch antiga '${target}' deletada com sucesso.`, 'success');
  } catch (err) {
    addPipelineLog(`[Fase 2: Destruição] ERRO ao tentar deletar a branch: ${err.message}`, 'error');
    pipelineActive.value = false;
    return;
  }

  // Passo 3: Recriação
  await new Promise(resolve => setTimeout(resolve, 1200));
  pipelineStep.value = 3;
  const baseRef = settingsStore.activeBranchMaster;

  addPipelineLog(`[Fase 3: Recriação] Criando nova branch '${target}' a partir da master '${baseRef}'...`, 'info');
  try {
    await gitProviderService.breezeCreateBranch(settingsStore, target, baseRef);
    addPipelineLog(`[Fase 3: Recriação] Nova branch '${target}' recriada de forma limpa a partir da '${baseRef}'!`, 'success');
  } catch (err) {
    addPipelineLog(`[Fase 3: Recriação] ERRO ao recriar branch: ${err.message}`, 'error');
    pipelineActive.value = false;
    return;
  }

  // Passo 4: Conclusão
  await new Promise(resolve => setTimeout(resolve, 1200));
  pipelineStep.value = 4;
  addPipelineLog(`=== PIPELINE DE RECONSTRUÇÃO CONCLUÍDO ===`, 'success');
  addPipelineLog(`Ambiente '${target}' reconstruído e limpo a partir de '${baseRef}'!`, 'success');
  pipelineActive.value = false;
};

const requestDeleteBranch = (branchName) => {
  branchToDelete.value = branchName;
  showDeleteConfirmModal.value = true;
};

const executeDeleteBranch = async () => {
  const branchName = branchToDelete.value;
  if (!branchName) return;

  const protectedBranches = [settingsStore.activeBranchMaster, settingsStore.activeBranchHml, settingsStore.activeBranchDev];
  if (protectedBranches.includes(branchName)) {
    notificationService.alert("Acesso Negado", "Não é possível deletar uma branch de ambiente principal!", "warning");
    showDeleteConfirmModal.value = false;
    return;
  }

  deleteLoading.value = true;
  addMergeLog(`Iniciando deleção da branch de feature '${branchName}'...`, 'info');

  try {
    await gitProviderService.breezeDeleteBranch(settingsStore, branchName);
    addMergeLog(`[Deleção] Branch '${branchName}' DELETADA do ${gitProviderService.getProviderName(settingsStore)} com sucesso!`, 'success');
    activeBranches.value = activeBranches.value.filter(b => b.name !== branchName);
  } catch (err) {
    addMergeLog(`[Deleção] ERRO ao deletar branch no ${gitProviderService.getProviderName(settingsStore)}: ${err.message}`, 'error');
  }

  deleteLoading.value = false;
  showDeleteConfirmModal.value = false;
  branchToDelete.value = null;
};

// --- LÓGICA DE EXCLUSÃO EM LOTE (BULK DELETE) ---
const requestBulkDelete = () => {
  if (selectedBranches.value.length === 0) return;
  showBulkDeleteModal.value = true;
};

const executeBulkDelete = async () => {
  showBulkDeleteModal.value = false;
  const branchesToExclude = [...selectedBranches.value];
  selectedBranches.value = []; // Limpa a seleção
  
  addMergeLog(`Iniciando exclusão em lote de ${branchesToExclude.length} branches...`, 'warning');
  
  for (const branchName of branchesToExclude) {
    const protectedBranches = [settingsStore.activeBranchMaster, settingsStore.activeBranchHml, settingsStore.activeBranchDev];
    if (protectedBranches.includes(branchName)) {
      addMergeLog(`[Lote] Ação abortada para '${branchName}' (branch protegida).`, 'error');
      continue;
    }
    
    addMergeLog(`[Lote] Removendo branch '${branchName}'...`, 'info');
    try {
      await gitProviderService.breezeDeleteBranch(settingsStore, branchName);
      addMergeLog(`[Lote] Branch '${branchName}' DELETADA com sucesso!`, 'success');
      activeBranches.value = activeBranches.value.filter(b => b.name !== branchName);
    } catch (err) {
      addMergeLog(`[Lote] Erro ao deletar '${branchName}': ${err.message}`, 'error');
    }
  }
  
  addMergeLog(`Processo de exclusão em lote concluído.`, 'success');
};

const toggleBranchSelection = (branchName) => {
  const index = selectedBranches.value.indexOf(branchName);
  if (index > -1) {
    selectedBranches.value.splice(index, 1);
  } else {
    selectedBranches.value.push(branchName);
  }
};

// --- ROLAGEM AUTOMÁTICA DOS CONSOLES TRATADA INTERNAMENTE NOS SUBCOMPONENTES ---

const toggleTheme = () => {
  settingsStore.theme = settingsStore.theme === 'dark' ? 'light' : 'dark';
};
</script>

<template>
  <BaseModal 
    layout="sidebar" 
    title="Breeze Git Rebuilder" 
    subtitle="Isolador e Simulador de Integrações e Ambientes" 
    :icon="GitBranch"
    maxWidth="max-w-[98vw] w-full"
    customClass="h-[calc(100vh-5rem)] mb-14"
    allowMaximize
    @maximized-change="isMaximized = $event"
    @close="emit('close')"
  >
    <!-- HEADER ACTIONS -->
    <template #header-actions>
      <div 
        class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[var(--app-input-radius)] border text-[10px] font-black uppercase tracking-wider transition-colors"
        :class="settingsStore.gitlabToken && settingsStore.gitlabProjectId 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
          : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'"
      >
        <CloudLightning class="w-3.5 h-3.5" />
        {{ settingsStore.gitlabToken && settingsStore.gitlabProjectId ? 'GitLab Ativo' : 'Offline' }}
      </div>
    </template>

    <!-- SIDEBAR -->
    <template #sidebar>
      <nav class="space-y-2 p-2 w-full flex flex-col items-center">
        <button 
          @click="activeTab = 'merges'"
          class="flex items-center gap-3 py-3 rounded-[var(--app-input-radius)] transition-all font-black uppercase tracking-widest text-[10px]"
          :class="[
            activeTab === 'merges' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent',
            isMaximized ? 'w-auto px-4 justify-center' : 'w-full px-4'
          ]"
          :title="isMaximized ? 'Mesclar e Excluir' : ''"
        >
          <GitBranch class="w-4 h-4 shrink-0" />
          <span v-if="!isMaximized">Mesclar e Excluir</span>
        </button>
        <button 
          @click="activeTab = 'rebuilder'"
          class="flex items-center gap-3 py-3 rounded-[var(--app-input-radius)] transition-all font-black uppercase tracking-widest text-[10px]"
          :class="[
            activeTab === 'rebuilder' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent',
            isMaximized ? 'w-auto px-4 justify-center' : 'w-full px-4'
          ]"
          :title="isMaximized ? 'Limpar e Recriar' : ''"
        >
          <RefreshCw class="w-4 h-4 shrink-0" />
          <span v-if="!isMaximized">Limpar e Recriar</span>
        </button>

      </nav>
      
      <div v-if="!isMaximized" class="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-[var(--app-card-radius)]">
        <div class="flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div class="text-[10px] leading-relaxed text-amber-700 dark:text-amber-400 font-medium">
            <strong class="font-black block uppercase tracking-widest mb-1">Atenção Crítica:</strong>
            As ações deste módulo interagem diretamente com o repositório remoto GitLab. Operações de exclusão e mesclagem são irreversíveis.
          </div>
        </div>
      </div>
    </template>

    <!-- MAIN CONTENT -->
    <template #default>
      <div class="flex flex-col gap-6 w-full h-full pb-8">
        <div v-if="activeTab === 'rebuilder'" class="space-y-6 animate-fadeIn flex-1 flex flex-col min-h-0 lg:overflow-hidden overflow-y-auto">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch w-full flex-1 min-h-0">
          
          <!-- Coluna 1: Lista de Ambientes (5 colunas) -->
          <div class="md:col-span-5 space-y-4 text-left flex flex-col lg:h-full min-h-0 min-w-0">
            <div class="flex items-center justify-between h-6 shrink-0">
              <h4 class="text-[10px] font-black text-app-muted uppercase tracking-widest flex items-center gap-2">
                <GitBranch class="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Branches de Ambiente
              </h4>
            </div>

            <div class="glass-section flex flex-col gap-4 max-h-[calc(100vh-280px)] flex-1 min-h-0 !p-4">
              <div class="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
                <!-- MASTER (PROTEGIDA) -->
                <div data-test="master-card" class="glass-section flex flex-col justify-between shadow-md relative overflow-hidden shrink-0 border-indigo-500/10 !p-4">
                  <div class="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[8px] font-black uppercase tracking-wider rounded-[var(--app-input-radius)] border border-emerald-500/20">
                    <Lock class="w-3 h-3" />
                    Protegida
                  </div>
                  <div>
                    <div class="flex items-center justify-between mb-4">
                      <span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[8px] font-black uppercase tracking-wider rounded-[var(--app-input-radius)]">{{ settingsStore.activeAliasMaster }}</span>
                      <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    </div>
                    <h3 class="text-xl font-black text-app-main font-mono text-emerald-500 dark:text-emerald-400 truncate pr-16" :title="settingsStore.activeBranchMaster">
                      {{ settingsStore.activeBranchMaster }}
                    </h3>
                  </div>
                  <div class="mt-6 pt-4 border-t border-app-border-light">
                    <p class="text-[10px] text-app-muted font-bold uppercase">Origem Estável</p>
                    <p class="text-[9px] text-app-sub mt-0.5 font-medium">Nenhuma ação permitida. Serve como base de segurança e integridade.</p>
                  </div>
                </div>

                <!-- HOMOLOGAÇÃO -->
                <div class="glass-section flex flex-col justify-between shadow-md group shrink-0 border-indigo-500/10 hover:border-indigo-500/30 transition-all !p-4">
                  <div>
                    <div class="flex items-center justify-between mb-4">
                      <span class="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 text-[8px] font-black uppercase tracking-wider rounded-[var(--app-input-radius)]">{{ settingsStore.activeAliasHml }}</span>
                      <div class="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.3)]"></div>
                    </div>
                    <h3 class="text-xl font-black text-app-main font-mono truncate" :title="settingsStore.activeBranchHml">
                      {{ settingsStore.activeBranchHml }}
                    </h3>
                    <div class="mt-4 pt-4 border-t border-app-border-light">
                      <p class="text-[10px] text-app-muted font-bold uppercase">Ambiente de Testes Finais</p>
                      <p class="text-[9px] text-app-sub mt-0.5">Código validado pronto para homologação.</p>
                    </div>
                  </div>
                  <div class="mt-5 pt-2">
                    <button 
                      @click="runRebuildPipeline('hml')"
                      :disabled="pipelineActive"
                      class="btn btn-primary w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                    >
                      <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': pipelineActive && pipelineTarget === 'hml' }" />
                      Limpar e Recriar HML
                    </button>
                  </div>
                </div>

                <!-- DESENVOLVIMENTO -->
                <div class="glass-section flex flex-col justify-between shadow-md group shrink-0 border-indigo-500/10 hover:border-indigo-500/30 transition-all !p-4">
                  <div>
                    <div class="flex items-center justify-between mb-4">
                      <span class="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[8px] font-black uppercase tracking-wider rounded-[var(--app-input-radius)]">{{ settingsStore.activeAliasDev }}</span>
                      <div class="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]"></div>
                    </div>
                    <h3 class="text-xl font-black text-app-main font-mono text-amber-500 dark:text-amber-400 truncate" :title="settingsStore.activeBranchDev">
                      {{ settingsStore.activeBranchDev }}
                    </h3>
                    <div class="mt-4 pt-4 border-t border-app-border-light">
                      <p class="text-[10px] text-app-muted font-bold uppercase">Ambiente de Integração Diária</p>
                      <p class="text-[9px] text-app-sub mt-0.5 font-medium">Reunião contínua de funcionalidades em desenvolvimento.</p>
                    </div>
                  </div>
                  <div class="mt-5 pt-2">
                    <button 
                      @click="runRebuildPipeline('dev')"
                      :disabled="pipelineActive"
                      class="btn btn-warning w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                    >
                      <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': pipelineActive && pipelineTarget === 'dev' }" />
                      Limpar e Recriar DEV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Coluna 2: Status do Pipeline (2 colunas) -->
          <div class="md:col-span-2 space-y-4 text-left flex flex-col lg:h-full min-h-0 min-w-0">
            <div class="flex items-center justify-between h-6 shrink-0">
              <h4 class="text-[10px] font-black text-app-muted uppercase tracking-widest flex items-center gap-2">
                <Settings class="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Pipeline
              </h4>
            </div>
            
            <div class="glass-section flex flex-col gap-6 max-h-[calc(100vh-280px)] flex-1 min-h-0 py-6 !p-4">
              <!-- Stepper Vertical para melhor adequação -->
              <div class="flex flex-col gap-6 flex-1 justify-center px-2">
                <div class="flex items-center gap-3" :class="pipelineStep >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-app-muted'">
                  <span class="w-8 h-8 flex items-center justify-center rounded-full border-2 text-xs font-black transition-all" :class="pipelineStep >= 1 ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'border-app-border-light'">1</span>
                  <span class="text-[10px] font-black uppercase tracking-widest">Backup</span>
                </div>
                <div class="w-0.5 h-6 bg-app-border-light ml-4"></div>
                <div class="flex items-center gap-3" :class="pipelineStep >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-app-muted'">
                  <span class="w-8 h-8 flex items-center justify-center rounded-full border-2 text-xs font-black transition-all" :class="pipelineStep >= 2 ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'border-app-border-light'">2</span>
                  <span class="text-[10px] font-black uppercase tracking-widest">Destruição</span>
                </div>
                <div class="w-0.5 h-6 bg-app-border-light ml-4"></div>
                <div class="flex items-center gap-3" :class="pipelineStep >= 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-app-muted'">
                  <span class="w-8 h-8 flex items-center justify-center rounded-full border-2 text-xs font-black transition-all" :class="pipelineStep >= 3 ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'border-app-border-light'">3</span>
                  <span class="text-[10px] font-black uppercase tracking-widest">Recriação</span>
                </div>
                <div class="w-0.5 h-6 bg-app-border-light ml-4"></div>
                <div class="flex items-center gap-3" :class="pipelineStep >= 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-app-muted'">
                  <span class="w-8 h-8 flex items-center justify-center rounded-full border-2 text-xs font-black transition-all" :class="pipelineStep >= 4 ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-app-border-light'">✓</span>
                  <span class="text-[10px] font-black uppercase tracking-widest">Concluído</span>
                </div>
              </div>
              
              <div class="pt-4 border-t border-app-border-light text-center shrink-0">
                <span class="text-[8px] font-black text-app-muted uppercase tracking-widest">Pipeline Status</span>
              </div>
            </div>
          </div>

          <!-- Coluna 3: Logs de Execução (5 colunas) -->
          <div class="md:col-span-5 space-y-4 text-left flex flex-col lg:h-full min-h-0 min-w-0">
            <div class="flex items-center justify-between h-6 shrink-0">
              <h4 class="text-[10px] font-black text-app-muted uppercase tracking-widest flex items-center gap-2">
                <Terminal class="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Console de Automação
              </h4>
            </div>

            <!-- Area de Console e Confirmação Pendente (Altura Fixa com Terminal Flexível) -->
            <div class="flex flex-col flex-1 min-h-0 max-h-[calc(100vh-280px)] overflow-hidden">
              <!-- Console Git (Encolhe quando a autorização aparece) -->
              <TerminalConsole
                :logs="pipelineLogs"
                :consoleFontSize="settingsStore.consoleFontSize"
                placeholder="Aguardando comando... Clique em Recriar HML ou DEV para iniciar a esteira."
                @increase-font-size="increaseFontSize"
                @decrease-font-size="decreaseFontSize"
                class="flex-1 min-h-0"
              />

              <!-- Alerta de Autorização (Aparece na base, encolhendo o terminal para cima) -->
              <div v-if="waitingForDestruction" class="mt-4 p-4 bg-[#EF5350]/10 border border-[#EF5350]/20 rounded-[var(--app-card-radius)] flex flex-col gap-3 animate-slideUp shrink-0 shadow-lg shadow-[#EF5350]/5">
                <div class="flex items-start gap-3">
                  <div class="p-1.5 bg-[#EF5350]/20 rounded-lg shrink-0">
                    <AlertTriangle class="w-4 h-4 text-[#EF5350]" />
                  </div>
                  <div>
                    <h4 class="text-[10px] font-black text-[#EF5350] uppercase tracking-wider">Autorização Necessária</h4>
                    <p class="text-[9px] text-app-sub font-medium mt-0.5 leading-relaxed">Confirme a exclusão da branch antiga para prosseguir.</p>
                  </div>
                </div>
                <button 
                  @click="confirmDestruction"
                  class="w-full py-2.5 bg-[#EF5350] hover:bg-[#E53935] text-white rounded-[var(--app-input-radius)] text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-[#EF5350]/20 active:scale-[0.98]"
                >
                  Autorizar Exclusão no GitLab
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ABA 2: MESCLAR E EXCLUIR BRANCHES -->
      <div v-else-if="activeTab === 'merges'" class="space-y-4 animate-fadeIn flex-1 flex flex-col min-h-0 lg:overflow-hidden overflow-y-auto">
        
        <!-- BARRA DE CONTROLE NO TOPO -->
        <ActionPanel
          :selectedBranches="selectedBranches"
          :branchesLoading="branchesLoading"
          :branchDesenvolvimento="settingsStore.activeBranchDev"
          :branchHomologacao="settingsStore.activeBranchHml"
          :branchMaster="settingsStore.activeBranchMaster"
          @list-all-branches="listAllBranches"
          @merge-to-target="runMergeToTarget"
          @bulk-delete="requestBulkDelete"
          class="w-full shrink-0"
        />

        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch w-full flex-1 min-h-0">

          <!-- Coluna Esquerda: Branches Disponíveis -->
          <BranchList
            v-model:searchQuery="searchQuery"
            :branchesFetched="branchesFetched"
            :branchesLoading="branchesLoading"
            :branchesError="branchesError"
            :filteredBranches="filteredBranches"
            :selectedBranches="selectedBranches"
            :branchesOrder="branchesOrder"
            :totalBranchesCount="totalBranchesCount"
            :mergeLoadingMap="mergeLoadingMap"
            :mergeStatusMap="mergeStatusMap"
            @search="handleSearch"
            @toggle-order="toggleOrderAndRefetch"
            @toggle-selection="toggleBranchSelection"
            class="md:col-span-6"
          />

          <!-- Coluna Direita: Console de Operações -->
          <div class="md:col-span-6 flex flex-col lg:h-full min-h-0 min-w-0">
            <TerminalConsole
              :logs="mergeLogs"
              :consoleFontSize="settingsStore.consoleFontSize"
              placeholder="Selecione DEV ou HML acima para carregar as branches..."
              @increase-font-size="increaseFontSize"
              @decrease-font-size="decreaseFontSize"
              class="max-h-[calc(100vh-250px)]"
            />
          </div>

        </div>
      </div>
      </div>
    </template>
  </BaseModal>



    <!-- ========================================== -->
    <!-- MODAL: CONFIRMAÇÃO DE MESCLAGEM (BaseModal) -->
    <!-- ========================================== -->
    <BaseModal 
      v-if="showMergeConfirmModal"
      title="Confirmar Mesclagem de Branch"
      subtitle="Mesclar código de feature no ambiente integrado"
      :icon="GitBranch"
      okText="Confirmar Mesclagem"
      cancelText="Cancelar"
      :okDisabled="mergeCheckStatus !== 'mergeable'"
      @close="cancelMergeCheck"
      @cancel="cancelMergeCheck"
      @ok="executeMergeAfterConfirm"
    >
      <div class="space-y-4 text-left">
        <div class="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-[var(--app-card-radius)] flex items-start gap-3">
          <Info class="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div class="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
            <p class="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Ação de Integração:</p>
            Você está prestes a mesclar a branch de feature 
            <span class="font-mono text-indigo-650 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-black/35 px-1.5 py-0.5 rounded-[var(--app-input-radius)]">{{ mergeConfirmSourceBranch }}</span> 
            no ambiente de destino 
            <span class="font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-black/35 px-1.5 py-0.5 rounded-[var(--app-input-radius)]">{{ mergeConfirmTargetBranch }}</span>.
          </div>
        </div>

        <!-- Status da Verificação (Pre-Check) -->
        <div 
          class="p-4 rounded-[var(--app-card-radius)] border flex items-start gap-3 transition-all duration-300"
          :class="{
            'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10': mergeCheckStatus === 'checking' || mergeCheckStatus === 'idle',
            'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400': mergeCheckStatus === 'mergeable',
            'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400': mergeCheckStatus === 'conflict' || mergeCheckStatus === 'error',
            'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400': mergeCheckStatus === 'no_changes'
          }"
        >
          <RefreshCw v-if="mergeCheckStatus === 'checking'" class="w-5 h-5 animate-spin shrink-0 mt-0.5" />
          <Check v-else-if="mergeCheckStatus === 'mergeable'" class="w-5 h-5 shrink-0 mt-0.5" />
          <AlertTriangle v-else-if="mergeCheckStatus === 'conflict' || mergeCheckStatus === 'error'" class="w-5 h-5 shrink-0 mt-0.5" />
          <Info v-else class="w-5 h-5 shrink-0 mt-0.5" />

          <div class="text-xs font-medium leading-relaxed">
            <p class="font-black uppercase tracking-widest text-[10px] mb-1">Status da Análise:</p>
            {{ mergeCheckMessage }}
          </div>
        </div>
      </div>
    </BaseModal>

    <!-- ========================================== -->
    <!-- MODAL: CONFIRMAÇÃO DE DELEÇÃO DOUBLE-CHECK -->
    <!-- ========================================== -->
    <BaseModal 
      v-if="showDeleteConfirmModal"
      title="Confirmar Exclusão de Branch"
      subtitle="ESTA AÇÃO É DESTRUTIVA E PERMANENTE"
      :icon="Trash2"
      iconBgColor="#ef4444"
      okText="Confirmar Deleção"
      cancelText="Cancelar"
      :okLoading="deleteLoading"
      @close="showDeleteConfirmModal = false"
      @cancel="showDeleteConfirmModal = false"
      @ok="executeDeleteBranch"
    >
      <div class="space-y-4 text-left">
        <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-[var(--app-card-radius)] flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p class="font-bold text-red-700 dark:text-white mb-1">Atenção Especial:</p>
            Você está prestes a excluir permanentemente a branch <span class="font-mono text-red-650 dark:text-red-400 font-bold bg-red-100 dark:bg-black/35 px-1.5 py-0.5 rounded-[var(--app-input-radius)]">{{ branchToDelete }}</span> do repositório remoto GitLab. Esta ação não poderá ser desfeita.
          </div>
        </div>


      </div>
    </BaseModal>

    <!-- ========================================== -->
    <!-- MODAL: CONFIRMAÇÃO DE DELEÇÃO EM LOTE -->
    <!-- ========================================== -->
    <BaseModal 
      v-if="showBulkDeleteModal"
      title="Excluir Branches em Lote"
      subtitle="ESTA AÇÃO REMOVERÁ VÁRIAS BRANCHES DE FEATURE"
      :icon="Trash2"
      iconBgColor="#ef4444"
      okText="Sim, Excluir Todas"
      cancelText="Cancelar"
      @close="showBulkDeleteModal = false"
      @cancel="showBulkDeleteModal = false"
      @ok="executeBulkDelete"
    >
      <div class="space-y-4 text-left">
        <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-[var(--app-card-radius)] flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div class="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
            <p class="font-bold text-red-700 dark:text-white mb-1">Confirmação de Ação Destrutiva:</p>
            Você está prestes a excluir permanentemente as <span class="text-red-605 dark:text-red-400 font-bold font-mono">{{ selectedBranches.length }}</span> branches selecionadas abaixo do repositório remoto GitLab.
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[9px] font-black text-slate-500 dark:text-app-muted uppercase tracking-widest block">
            Branches selecionadas para deleção:
          </label>
          <div class="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] rounded-[var(--app-card-radius)] p-3 max-h-[160px] overflow-y-auto custom-scrollbar font-mono text-[10px] text-slate-650 dark:text-slate-400 space-y-1">
            <div v-for="name in selectedBranches" :key="name" class="truncate flex items-center gap-1.5 text-red-600 dark:text-red-300">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
              {{ name }}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
</template>
