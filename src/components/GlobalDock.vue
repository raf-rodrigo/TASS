<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { 
  Plus, Calendar, Clock, RotateCcw, X, 
  Settings, Sun, Moon, Headphones, MoreHorizontal
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { useRadioStore } from '../stores/radioStore';

const emit = defineEmits([
  'add-task', 'open-settings', 'open-notes', 'open-interface', 'open-sprints', 'toggle-theme', 'open-radio'
]);

const settings = useSettingsStore();
const taskStore = useTaskStore();
const radioStore = useRadioStore();

const isExpanded = ref(false);
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) isExpanded.value = true;
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// Radius dinâmico para a dock (sempre respeitando a config global)
const dockRadius = computed(() => {
  return 'var(--app-card-radius)';
});
</script>

<template>
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-full max-w-fit px-4 pointer-events-none">
    <div 
      class="dynamic-island flex flex-col md:flex-row items-center shadow-2xl border border-app-border-light backdrop-blur-xl ring-1 ring-black/5 pointer-events-auto transition-all duration-300 ease-out overflow-hidden"
      :class="[
        isMobile && isExpanded ? 'w-[90vw] gap-3 p-4' : 'p-1.5 gap-2'
      ]"
      :style="{ 
        backgroundColor: `rgba(var(--app-bg-raw), var(--app-bottom-opacity))`,
        borderRadius: dockRadius
      }"
    >
      <!-- LINHA 1: Cabeçalho da Ilha / Ações Principais -->
      <div class="flex items-center w-full md:w-auto" :class="{ 'justify-between': isMobile && !isExpanded }">
        <div class="flex items-center gap-2">
          <!-- Adicionar Tarefa -->
          <button 
            @click.stop="emit('add-task')"
            class="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-95 group shrink-0"
            :style="{ borderRadius: 'var(--app-input-radius)' }"
          >
            <Plus class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <!-- Cronômetro (Sempre Visível) -->
          <div 
            class="dock-item !bg-indigo-500/5 !border-indigo-500/20 px-3 py-2 flex items-center gap-2"
          >
            <Clock class="w-4 h-4 text-indigo-600 dark:text-indigo-400" :class="{ 'animate-pulse': taskStore.activeTask }" />
            <span class="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
              {{ taskStore.activeSprintTotalTime }}
            </span>
          </div>

          <!-- Botão Desfazer (Integrado na Dock) -->
          <transition 
            enter-active-class="transition-all duration-500 ease-out" 
            enter-from-class="w-0 opacity-0 -translate-x-4" 
            enter-to-class="w-[100px] opacity-100 translate-x-0"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="w-[100px] opacity-100 translate-x-0"
            leave-to-class="w-0 opacity-0 -translate-x-4"
          >
            <button 
              v-if="taskStore.lastDeletedTask" 
              @click.stop="taskStore.restoreTask" 
              class="dock-item !bg-amber-500 !border-amber-600 px-3 py-2 flex items-center gap-2 text-white shadow-lg shadow-amber-500/20 group overflow-hidden whitespace-nowrap"
            >
              <RotateCcw class="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform" />
              <span class="text-[10px] font-black uppercase tracking-tighter">Desfazer</span>
            </button>
          </transition>
        </div>

        <!-- Toggle Mobile Expansion -->
        <button 
          v-if="isMobile" 
          @click.stop="isExpanded = !isExpanded"
          class="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors ml-2"
        >
          <X v-if="isExpanded" class="w-5 h-5 text-red-500" />
          <MoreHorizontal v-else class="w-5 h-5" />
        </button>
      </div>

      <!-- SEÇÃO EXPANSÍVEL (Filtros e Utilidades) -->
      <!-- No desktop v-show é sempre true. No mobile controlado pelo isExpanded -->
      <div 
        v-show="!isMobile || isExpanded"
        class="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto overflow-hidden transition-all duration-300"
        :class="{ 'mt-3 pt-3 border-t border-slate-200 dark:border-white/10': isMobile && isExpanded }"
      >
        <!-- Filtros -->
        <div 
          class="flex items-center gap-1 bg-app-surface p-1 border border-app-border-light w-full md:w-auto justify-center"
          :style="{ borderRadius: 'var(--app-input-radius)' }"
        >
          <button 
            v-for="filter in ['all', 'active', 'completed']" 
            :key="filter"
            @click="taskStore.statusFilter = filter"
            class="flex-1 md:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter transition-all"
            :style="{ borderRadius: 'calc(var(--app-input-radius) * 0.8)' }"
            :class="taskStore.statusFilter === filter 
              ? 'bg-app-solid shadow-sm text-indigo-600 dark:text-white' 
              : 'text-app-muted hover:text-app-sub'"
          >
            <span>{{ filter === 'all' ? 'Todas' : filter === 'active' ? 'Ativas' : 'Feitas' }}</span>
          </button>
        </div>

        <div class="hidden md:block w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

        <!-- Sprint e Utilidades -->
        <div class="flex items-center justify-center md:justify-start w-full md:w-auto gap-2">
           <!-- Sprint Selector (Mobile icon only) -->
          <button @click="emit('open-sprints')" class="util-btn md:hidden">
            <Calendar class="w-4 h-4 text-indigo-500" />
          </button>

          <div class="flex items-center gap-1">
            <button @click="emit('open-radio')" class="util-btn group relative">
              <Headphones class="w-4 h-4 text-amber-500" />
              <span v-if="radioStore.isPlaying" class="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-ping opacity-75"></span>
              <span v-if="radioStore.isPlaying" class="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-500 rounded-full opacity-50"></span>
            </button>
            <button @click="emit('toggle-theme')" class="util-btn">
              <Sun v-if="settings.theme === 'dark'" class="w-4 h-4 text-amber-500" />
              <Moon v-else class="w-4 h-4 text-indigo-500" />
            </button>
            <button @click="emit('open-settings')" class="util-btn">
              <Settings class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Botão Desfazer (Flutuante) -->
      <transition enter-active-class="transition duration-300 ease-out" enter-from-class="scale-0 opacity-0" enter-to-class="scale-100 opacity-100">
        <button 
          v-if="taskStore.lastDeletedTask" 
          @click="taskStore.restoreTask" 
          class="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/30 rounded-full animate-bounce pointer-events-auto"
        >
          <RotateCcw class="w-3.5 h-3.5" /> Desfazer
        </button>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.dynamic-island {
  transition: all 0.3s ease-out;
}

.dock-item {
  @apply flex items-center gap-2 bg-app-surface border border-app-border-light transition-all;
  border-radius: var(--app-input-radius);
}

.util-btn {
  @apply w-10 h-10 p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-500 transition-all active:scale-90 flex items-center justify-center;
  border-radius: var(--app-input-radius);
}
</style>
