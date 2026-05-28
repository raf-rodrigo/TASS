<script setup>
import { Settings, RefreshCw } from 'lucide-vue-next';

defineProps({
  selectedBranches: {
    type: Array,
    required: true
  },
  branchesLoading: {
    type: Boolean,
    required: true
  },
  branchDesenvolvimento: {
    type: String,
    required: true
  },
  branchHomologacao: {
    type: String,
    required: true
  }
});

defineEmits([
  'list-all-branches',
  'merge-to-target',
  'bulk-delete'
]);
</script>

<template>
  <div class="w-full flex flex-row items-center justify-between gap-4">
    <!-- Esquerda: Ações Gerais -->
    <button
      @click="$emit('list-all-branches')"
      :disabled="branchesLoading"
      class="px-5 py-2.5 rounded-[var(--app-input-radius)] border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-950/20 dark:border-white/[0.06] dark:text-slate-400 dark:hover:bg-white/5 transition-all cursor-pointer flex flex-row items-center justify-center gap-2.5 shrink-0 disabled:opacity-50 shadow-sm"
    >
      <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': branchesLoading }" />
      <span class="text-[11px] font-black uppercase tracking-wider">Listar Branches</span>
    </button>

    <!-- Direita: Ações Contextuais -->
    <div class="flex items-center gap-3">
      <template v-if="selectedBranches.length === 1">
        <!-- Botão DEV -->
        <button
          @click="$emit('merge-to-target', branchDesenvolvimento || 'dev-06', 'dev')"
          class="px-5 py-2.5 rounded-[var(--app-input-radius)] border transition-all cursor-pointer flex flex-row items-center justify-center gap-2 shrink-0 bg-amber-500/10 border-amber-500/50 hover:border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shadow-sm"
        >
          <span class="text-[11px] font-black uppercase tracking-wider">Merge para DEV</span>
          <span class="text-[9px] opacity-80 font-mono font-bold">({{ branchDesenvolvimento || 'dev-06' }})</span>
        </button>

        <!-- Botão HML -->
        <button
          @click="$emit('merge-to-target', branchHomologacao || 'hml', 'hml')"
          class="px-5 py-2.5 rounded-[var(--app-input-radius)] border transition-all cursor-pointer flex flex-row items-center justify-center gap-2 shrink-0 bg-indigo-500/10 border-indigo-500/50 hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 shadow-sm"
        >
          <span class="text-[11px] font-black uppercase tracking-wider">Merge para HML</span>
          <span class="text-[9px] opacity-80 font-mono font-bold">({{ branchHomologacao || 'hml' }})</span>
        </button>
      </template>

      <!-- Botão Excluir -->
      <template v-if="selectedBranches.length >= 1">
        <button
          @click="$emit('bulk-delete')"
          class="px-5 py-2.5 rounded-[var(--app-input-radius)] border transition-all cursor-pointer flex flex-row items-center justify-center gap-2 shrink-0 bg-red-500/10 border-red-500/50 hover:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-500/20 shadow-sm"
        >
          <span class="text-[11px] font-black uppercase tracking-wider">Excluir</span>
          <span class="text-[9px] font-bold">({{ selectedBranches.length }})</span>
        </button>
      </template>
    </div>
  </div>
</template>

