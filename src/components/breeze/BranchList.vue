<script setup>
import { 
  History, Search, RefreshCw, ArrowUpDown, 
  GitBranch, Check, AlertCircle, User 
} from 'lucide-vue-next';

defineProps({
  searchQuery: {
    type: String,
    required: true
  },
  branchesFetched: {
    type: Boolean,
    required: true
  },
  branchesLoading: {
    type: Boolean,
    required: true
  },
  branchesError: {
    type: String,
    required: true
  },
  filteredBranches: {
    type: Array,
    required: true
  },
  selectedBranches: {
    type: Array,
    required: true
  },
  branchesOrder: {
    type: String,
    required: true
  },
  totalBranchesCount: {
    type: Number,
    required: true
  },
  mergeLoadingMap: {
    type: Object,
    required: true
  },
  mergeStatusMap: {
    type: Object,
    required: true
  }
});

defineEmits([
  'update:searchQuery',
  'search',
  'toggle-order',
  'toggle-selection'
]);

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', ' às');
  } catch (e) {
    return dateString;
  }
};
</script>

<template>
  <div class="text-left flex flex-col lg:h-full min-h-0 min-w-0">
    <!-- Painel Principal de Branches com Estética Harmonizada -->
    <div class="glass-section flex flex-col gap-4 max-h-[calc(100vh-250px)] flex-1 min-h-0 !p-4">
      
      <!-- Campo de Busca e Ordenação -->
      <div class="flex gap-2.5 items-center h-10 shrink-0">
        <div class="relative flex-1 min-w-0 h-full">
          <input
            :value="searchQuery"
            @input="$emit('update:searchQuery', $event.target.value); $emit('search')"
            type="text"
            placeholder="Buscar branch..."
            :disabled="branchesLoading"
            class="w-full h-full bg-slate-50 dark:bg-slate-900/50 border border-app-border-light rounded-[var(--app-input-radius)] shadow-inner pl-4 pr-10 py-0 text-xs text-app-main placeholder-app-muted focus:outline-none focus:border-indigo-500/50 transition-all font-mono min-w-0 disabled:opacity-50"
          />
          <div class="absolute right-3 top-2.5 flex items-center gap-1.5 pointer-events-none">
            <RefreshCw v-if="branchesLoading" class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-spin" />
            <Search v-else class="w-3.5 h-3.5 text-app-muted" />
          </div>
        </div>

        <!-- Total de branches na mesma linha do input de busca -->
        <span v-if="branchesFetched && totalBranchesCount > 0" class="px-2.5 h-full bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider rounded-[var(--app-input-radius)] border border-indigo-500/20 whitespace-nowrap flex items-center shrink-0 shadow-sm">
          Total: {{ totalBranchesCount }}
        </span>

        <!-- Botão de ordenação com texto dinâmico -->
        <button
          type="button"
          @click="$emit('toggle-order')"
          :disabled="!branchesFetched"
          class="btn-secondary h-full px-3.5 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 shadow-sm"
          :title="branchesOrder === 'desc' ? 'Ordenando do mais novo ao mais antigo' : 'Ordenando do mais antigo ao mais novo'"
        >
          <ArrowUpDown class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{{ branchesOrder === 'desc' ? 'Mais recente' : 'Mais antigo' }}</span>
        </button>
      </div>

      <!-- Listagem das branches com rolagem interna -->
      <div class="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
        <div v-if="!branchesFetched" class="p-8 text-center text-xs text-app-muted border border-dashed border-app-border rounded-[var(--app-card-radius)] bg-app-surface/50 dark:bg-app-surface/10 flex flex-col items-center justify-center gap-2 h-full">
          <GitBranch class="w-6 h-6 text-app-muted animate-pulse" />
          <span>Clique em "Listar branches" no controle central para carregar as branches de feature.</span>
        </div>
        <div v-else-if="branchesError" class="p-6 text-center text-xs text-red-400 border border-dashed border-red-500/20 rounded-[var(--app-card-radius)] bg-red-500/5 flex flex-col items-center gap-2">
          <AlertCircle class="w-5 h-5 text-red-500 animate-pulse" />
          <span>{{ branchesError }}</span>
        </div>
        <div v-else-if="filteredBranches.length === 0" class="p-8 text-center text-xs text-app-muted border border-dashed border-app-border rounded-[var(--app-card-radius)] flex flex-col items-center justify-center gap-2 h-full">
          <span>Nenhuma branch ativa encontrada.</span>
        </div>
        <div
          v-else
          v-for="branch in filteredBranches"
          :key="branch.name"
          @click="$emit('toggle-selection', branch.name)"
          class="group flex items-center justify-between p-3 cursor-pointer rounded-[var(--app-card-radius)] bg-app-surface/50 dark:bg-slate-900/40 border border-transparent hover:border-indigo-500/30 dark:hover:border-white/10 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
          <!-- Checkbox de Seleção Individual Premium Encorpado -->
          <div class="flex items-center shrink-0 pr-3">
            <div class="w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center"
                 :class="selectedBranches.includes(branch.name)
                   ? 'border-indigo-500 bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                   : 'border-app-border dark:border-slate-700 bg-app-surface dark:bg-slate-950/80 group-hover:border-slate-400 dark:group-hover:border-slate-500'"
            >
            <svg
              class="w-3 h-3 text-white transition-transform duration-200"
              :class="selectedBranches.includes(branch.name) ? 'scale-100' : 'scale-0'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="4.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>

        <div class="min-w-0 flex-1 pr-4">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p class="text-xs font-black text-app-main leading-tight font-mono truncate" :title="branch.name">{{ branch.name }}</p>
          </div>
          <p class="text-[9px] text-app-muted font-bold mt-1 truncate">
            {{ branch.title || 'Último commit ativo' }}
          </p>
        </div>

        <!-- Nome do Desenvolvedor -->
        <span v-if="branch.authorName" class="text-[10px] font-bold bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 px-3 py-1 rounded-[var(--app-input-radius)] border border-indigo-500/20 tracking-wide whitespace-nowrap mr-2 shrink-0 flex items-center gap-1.5">
          <User class="w-3 h-3" />
          {{ branch.authorName }}
        </span>

        <!-- Data do Último Commit Alinhada à Direita -->
        <span v-if="branch.committedDate" class="text-[10px] font-bold bg-app-surface dark:bg-slate-800/90 text-app-sub px-3 py-1 rounded-[var(--app-input-radius)] border border-app-border-light tracking-wide whitespace-nowrap mr-2 shrink-0">
          Último Commit: {{ formatDate(branch.committedDate) }}
        </span>

        <div class="flex items-center gap-2 shrink-0" @click.stop>
          <!-- Loading State -->
          <span v-if="mergeLoadingMap[branch.name]" class="flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-black uppercase rounded-[var(--app-input-radius)] tracking-wider bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20">
            <RefreshCw class="w-3 h-3 text-indigo-500 dark:text-indigo-400 animate-spin" />
            Mesclando
          </span>

          <!-- Status Map Checks -->
          <template v-else>
            <span v-if="mergeStatusMap[branch.name] === 'success'" class="flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-black uppercase rounded-[var(--app-input-radius)] tracking-wider bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20">
              <Check class="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              Mesclado
            </span>
            <span v-else-if="mergeStatusMap[branch.name] === 'no_changes'" class="flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-black uppercase rounded-[var(--app-input-radius)] tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20" title="A branch de origem já é idêntica ao destino">
              <Check class="w-3 h-3 text-slate-500 dark:text-slate-400" />
              Sem Mudanças
            </span>
            <span v-else-if="mergeStatusMap[branch.name] === 'conflict'" class="flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-black uppercase rounded-[var(--app-input-radius)] tracking-wider bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20" title="Resolva Conflitos no GitLab">
              <AlertCircle class="w-3 h-3 text-red-500 dark:text-red-400" />
              Conflito
            </span>
            <span v-else-if="mergeStatusMap[branch.name] === 'error'" class="flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-black uppercase rounded-[var(--app-input-radius)] tracking-wider bg-rose-500/10 text-rose-650 dark:text-rose-400 border border-rose-500/20" title="Erro ao executar a mesclagem. Verifique o terminal de logs.">
              <AlertCircle class="w-3 h-3 text-rose-500 dark:text-rose-400" />
              Erro
            </span>
          </template>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
