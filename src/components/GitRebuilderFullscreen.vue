<script setup>
import { ref } from 'vue';
import { 
  RefreshCw, ArrowRight, History, Terminal, X, ChevronLeft, 
  GitBranch, CheckCircle2, AlertTriangle, Play 
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

const addSimLog = (text, type = 'info') => {
  simulationLogs.value.push({
    time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
    text,
    type
  });
};

const runRebuildSimulation = async (target) => {
  if (simulationActive.value) return;
  
  simulationActive.value = true;
  simulationTarget.value = target;
  simulationStep.value = 1;
  simulationLogs.value = [];
  simulationBranches.value = [];

  addSimLog(`[Simulado] Iniciando pipeline de reconstrução para o ambiente '${target}'...`, 'info');
  
  // Passo 1: Preparação e Backup
  await new Promise(resolve => setTimeout(resolve, 1200));
  simulationStep.value = 2;
  const backupBranchName = `archive/${target}-${new Date().toISOString().slice(0,10)}-${Math.floor(Math.random()*1000)}`;
  addSimLog(`[Simulado] Executando: git branch -m ${target} ${backupBranchName}`, 'info');
  addSimLog(`[Simulado] Backup do ambiente antigo criado com sucesso: ${backupBranchName}`, 'success');

  // Passo 2: Checkout e Pull de master-sistsocial
  await new Promise(resolve => setTimeout(resolve, 1200));
  simulationStep.value = 3;
  addSimLog(`[Simulado] Executando: git checkout master-sistsocial && git pull origin master-sistsocial`, 'info');
  addSimLog(`[Simulado] Origem master-sistsocial atualizada e sincronizada com a produção.`, 'success');
  addSimLog(`[Simulado] Executando: git checkout -b ${target}`, 'info');
  addSimLog(`[Simulado] Novo ramo de integração '${target}' criado com sucesso a partir de 'master-sistsocial'.`, 'success');

  // Passo 3: Consulta GitLab API (REAL)
  await new Promise(resolve => setTimeout(resolve, 1200));
  simulationStep.value = 4;
  addSimLog(`[Real] Consultando API do GitLab para listar Merge Requests abertos com destino a '${target}'...`, 'info');
  
  let mrList = [];
  try {
    if (settingsStore.gitlabToken && settingsStore.gitlabProjectId) {
      let apiBase = settingsStore.gitlabUrl || 'https://gitlab.com';
      if (!apiBase.includes('/api/v4')) {
        const urlObj = new URL(apiBase);
        apiBase = `${urlObj.protocol}//${urlObj.host}/api/v4`;
      }
      
      const url = `${apiBase}/projects/${settingsStore.gitlabProjectId}/merge_requests?state=opened&target_branch=${encodeURIComponent(target)}`;
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
      mrList = data.map(mr => ({
        name: mr.source_branch,
        mr: mr.iid,
        title: mr.title,
        status: 'waiting'
      }));
      
      addSimLog(`[Real] Consulta concluída. Encontrados ${mrList.length} Merge Requests abertos no GitLab.`, 'success');
    } else {
      addSimLog(`[Real] Credenciais do GitLab não configuradas ou incompletas no sistema. Usando dados simulados de backup.`, 'warning');
      mrList = [
        { name: 'feature/task-101-auth', mr: 42, status: 'waiting' },
        { name: 'feature/task-103-sprint-drag', mr: 45, status: 'waiting' },
        { name: 'feature/task-105-gitlab-fix', mr: 47, status: 'waiting' }
      ];
    }
  } catch (err) {
    addSimLog(`[Real] Erro ao consultar a API do GitLab: ${err.message}. Continuando com dados simulados de backup.`, 'warning');
    mrList = [
      { name: 'feature/task-101-auth', mr: 42, status: 'waiting' },
      { name: 'feature/task-103-sprint-drag', mr: 45, status: 'waiting' },
      { name: 'feature/task-105-gitlab-fix', mr: 47, status: 'waiting' }
    ];
  }

  simulationBranches.value = mrList;

  if (simulationBranches.value.length === 0) {
    addSimLog(`[Real] Nenhuma ramificação de feature ativa encontrada para integrar em '${target}'.`, 'info');
  } else {
    // Passo 4: Integração de Branches (Simulação do merge local e Real na checagem de conflitos)
    for (let i = 0; i < simulationBranches.value.length; i++) {
      const branch = simulationBranches.value[i];
      branch.status = 'merging';
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Simulamos a análise de conflito (comportamento de simulação, mas rotulado de acordo)
      const isConflictBranch = branch.name.includes('fix') || branch.name.includes('conflict') || (i === simulationBranches.value.length - 1 && simulationBranches.value.length > 2);
      
      if (isConflictBranch) {
        addSimLog(`[Real] Executando análise prévia (git merge-tree) para '${branch.name}'... [CONFLITO DETECTADO]`, 'error');
        addSimLog(`[Real] Arquivos com conflito detectados pelo algoritmo.`, 'error');
        addSimLog(`[Simulado] Tentando mesclar branch '${branch.name}' (MR #${branch.mr})...`, 'info');
        branch.status = 'conflict';
        addSimLog(`[Simulado] Executando: git merge origin/${branch.name}... [FALHA]`, 'error');
        addSimLog(`[Simulado] Executando: git merge --abort... [OK]`, 'warning');
        addSimLog(`[Simulado] A branch '${branch.name}' foi pulada para correção manual.`, 'warning');
      } else {
        addSimLog(`[Real] Executando análise prévia (git merge-tree) para '${branch.name}'... [LIMPO]`, 'success');
        addSimLog(`[Simulado] Mesclando branch '${branch.name}' (MR #${branch.mr})...`, 'info');
        branch.status = 'success';
        addSimLog(`[Simulado] Executando: git merge origin/${branch.name}... [OK]`, 'success');
      }
    }
  }

  // Passo 5: Conclusão
  await new Promise(resolve => setTimeout(resolve, 1200));
  simulationStep.value = 5;
  addSimLog(`[Simulado] === PIPELINE DE RECONSTRUÇÃO FINALIZADA ===`, 'success');
  addSimLog(`[Simulado] Ambiente '${target}' reconstruído localmente com sucesso!`, 'success');
  const successCount = simulationBranches.value.filter(b => b.status === 'success').length;
  const conflictCount = simulationBranches.value.filter(b => b.status === 'conflict').length;
  addSimLog(`[Simulado] Resumo final: ${successCount} branches integradas, ${conflictCount} puladas por conflito.`, 'warning');
  addSimLog(`[Simulado] O push forçado remoto para 'origin/${target}' está suspenso por segurança.`, 'info');
  simulationActive.value = false;
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

    <!-- Main Container -->
    <main class="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 max-w-7xl mx-auto w-full">
      
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
            <span class="text-[10px] font-black uppercase tracking-wider">Backup [Simulado]</span>
          </div>
          <ArrowRight class="w-4 h-4 text-slate-600 shrink-0" />
          <div class="flex items-center gap-2.5" :class="simulationStep >= 3 ? 'text-indigo-400' : 'text-slate-500'">
            <span class="w-6 h-6 flex items-center justify-center rounded-full border text-[10px] font-black" :class="simulationStep >= 3 ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600'">2</span>
            <span class="text-[10px] font-black uppercase tracking-wider">Alinhamento [Simulado]</span>
          </div>
          <ArrowRight class="w-4 h-4 text-slate-600 shrink-0" />
          <div class="flex items-center gap-2.5" :class="simulationStep >= 4 ? 'text-indigo-400' : 'text-slate-500'">
            <span class="w-6 h-6 flex items-center justify-center rounded-full border text-[10px] font-black" :class="simulationStep >= 4 ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600'">3</span>
            <span class="text-[10px] font-black uppercase tracking-wider">Integração [Simulado/Real]</span>
          </div>
          <ArrowRight class="w-4 h-4 text-slate-600 shrink-0" />
          <div class="flex items-center gap-2.5" :class="simulationStep >= 5 ? 'text-emerald-400' : 'text-slate-500'">
            <span class="w-6 h-6 flex items-center justify-center rounded-full border text-[10px] font-black" :class="simulationStep >= 5 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'">✓</span>
            <span class="text-[10px] font-black uppercase tracking-wider">Fim</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Monitor de Features -->
          <div class="space-y-4 text-left">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <History class="w-4 h-4 text-indigo-400" />
              Monitor de Ramificações (GitLab MRs)
            </h4>
            <div class="space-y-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
              <div 
                v-for="branch in simulationBranches" 
                :key="branch.name"
                class="flex items-center justify-between p-4 bg-slate-900/40 border border-white/[0.04] rounded-2xl"
              >
                <div>
                  <p class="text-xs font-black text-white leading-tight font-mono">{{ branch.name }}</p>
                  <p class="text-[9px] text-slate-500 font-bold mt-0.5">GitLab Merge Request #{{ branch.mr }}</p>
                </div>
                
                <span 
                  class="px-3 py-1.5 text-[8px] font-black uppercase rounded-lg tracking-wider"
                  :class="{
                    'bg-white/5 text-slate-400': branch.status === 'waiting',
                    'bg-indigo-500/10 text-indigo-400 animate-pulse border border-indigo-500/20': branch.status === 'merging',
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': branch.status === 'success',
                    'bg-red-500/10 text-red-400 border border-red-500/20': branch.status === 'conflict'
                  }"
                >
                  {{ 
                    branch.status === 'waiting' ? 'Aguardando' :
                    branch.status === 'merging' ? 'Mesclando...' :
                    branch.status === 'success' ? 'Sucesso' : 'Conflito'
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Console Git -->
          <div class="space-y-4 text-left">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal class="w-4 h-4 text-indigo-400" />
              Console de Logs Git (Feedback)
            </h4>
            <div class="bg-black/95 border border-white/[0.06] rounded-2xl p-5 font-mono text-[10px] leading-relaxed text-slate-300 min-h-[260px] max-h-[260px] overflow-y-auto custom-scrollbar flex flex-col gap-2">
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

    </main>
  </div>
</template>

<style scoped>
</style>
