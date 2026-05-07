<script setup>
import { 
  Plus, Calendar, Clock, RotateCcw, X, 
  Settings, Palette, Sun, Moon
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';

const emit = defineEmits([
  'add-task', 'open-settings', 'open-notes', 'open-interface', 'open-sprints', 'toggle-theme'
]);

const settings = useSettingsStore();
const taskStore = useTaskStore();
</script>

<template>
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-full max-w-fit px-2 md:px-4 pointer-events-none">
    <div 
      class="glass-panel !p-1.5 flex items-center gap-1 md:gap-2 shadow-2xl border-indigo-500/20 backdrop-blur-xl ring-1 ring-black/5 pointer-events-auto transition-all duration-500"
      :style="{ backgroundColor: `rgba(var(--app-bg-raw), var(--app-bottom-opacity))`, borderRadius: 'var(--app-card-radius)' }"
    >
      <!-- Botão Principal: Adicionar Tarefa -->
      <button 
        @click="emit('add-task')"
        class="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-90 group shrink-0"
        :style="{ borderRadius: 'var(--app-input-radius)' }"
        title="Nova Tarefa (N)"
      >
        <Plus class="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <div class="w-px h-6 bg-slate-200 dark:bg-white/10 mx-0.5 md:mx-1"></div>

      <!-- Seção: Filtros de Status -->
      <div 
        class="flex items-center gap-0.5 md:gap-1 bg-slate-100 dark:bg-white/5 p-1 border border-slate-200/50 dark:border-white/5"
        :style="{ borderRadius: 'var(--app-input-radius)' }"
      >
        <button 
          v-for="filter in ['all', 'active', 'completed']" 
          :key="filter"
          @click="taskStore.statusFilter = filter"
          class="px-2 md:px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter transition-all"
          :style="{ borderRadius: 'calc(var(--app-input-radius) * 0.8)' }"
          :class="taskStore.statusFilter === filter 
            ? 'bg-white dark:bg-indigo-500 shadow-sm text-indigo-600 dark:text-white' 
            : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'"
        >
          <span class="hidden md:inline">{{ filter === 'all' ? 'Todas' : filter === 'active' ? 'Ativas' : 'Concluídas' }}</span>
          <span class="md:hidden">{{ filter === 'all' ? 'T' : filter === 'active' ? 'A' : 'C' }}</span>
        </button>
      </div>

      <div class="w-px h-6 bg-slate-200 dark:bg-white/10 mx-0.5 md:mx-1"></div>

      <!-- Seção: Sprints e Tempo -->
      <div class="flex items-center gap-1 md:gap-2 px-0.5 md:px-1">
        <!-- Seletor de Sprint -->
        <div 
          @click="emit('open-sprints')"
          class="dock-item group pr-6 md:pr-8 relative"
          :class="{ '!pr-2 md:!pr-3': settings.activeSprintId === 'all' }"
          title="Gerenciar Sprints"
        >
          <Calendar class="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
          <span class="dock-label hidden sm:inline truncate max-w-[60px] md:max-w-none">{{ taskStore.activeSprintName }}</span>
          
          <button 
            v-if="settings.activeSprintId !== 'all'" 
            @click.stop="settings.activeSprintId = 'all'" 
            class="absolute right-1 md:right-1.5 p-0.5 rounded-md hover:bg-red-500 hover:text-white text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <X class="w-2.5 h-2.5 md:w-3 md:h-3" />
          </button>
        </div>

        <!-- Tempo Total da Sprint -->
        <div class="dock-item !bg-indigo-500/5 !border-indigo-500/20 cursor-default">
          <Clock class="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600 dark:text-indigo-400" />
          <span class="dock-label font-black !text-indigo-600 dark:!text-indigo-400">
            {{ taskStore.activeSprintTotalTime }}
          </span>
        </div>
      </div>

      <div class="hidden sm:block w-px h-6 bg-slate-200 dark:bg-white/10 mx-0.5 md:mx-1"></div>

      <!-- Seção: Menu de Utilidades -->
      <div class="hidden sm:flex items-center gap-0.5 md:gap-1">
        <button @click="emit('toggle-theme')" class="util-btn" title="Alternar Tema">
          <Sun v-if="settings.theme === 'dark'" class="w-4 h-4 text-amber-500" />
          <Moon v-else class="w-4 h-4 text-indigo-500" />
        </button>
        <button @click="emit('open-interface')" class="util-btn" title="Interface (I)">
          <Palette class="w-4 h-4" />
        </button>
        <button @click="emit('open-settings')" class="util-btn" title="Configurações (S)">
          <Settings class="w-4 h-4" />
        </button>
      </div>

      <!-- Botão Desfazer (Dinâmico) -->
      <transition enter-active-class="transition duration-300 ease-out" enter-from-class="scale-0 opacity-0" enter-to-class="scale-100 opacity-100">
        <button 
          v-if="taskStore.lastDeletedTask" 
          @click="taskStore.restoreTask" 
          class="ml-1 md:ml-2 flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 bg-amber-500 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-all animate-pulse"
          :style="{ borderRadius: 'var(--app-input-radius)' }"
        >
          <RotateCcw class="w-3 h-3 md:w-3.5 md:h-3.5" /> 
          <span class="hidden xs:inline">Desfazer</span>
        </button>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.dock-item {
  @apply flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10;
  border-radius: var(--app-input-radius);
}

.dock-label {
  @apply text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase whitespace-nowrap;
}

.util-btn {
  @apply p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-500 transition-all active:scale-90;
  border-radius: var(--app-input-radius);
}
</style>
