<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSwipe } from '@vueuse/core';
import { 
  Plus, Calendar, Clock, RotateCcw, 
  Settings, Sun, Moon, Headphones, CloudLightning, FileText, ChevronUp
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { useSprintStore } from '../stores/sprintStore';
import { useTimerStore } from '../stores/timerStore';
import { useRadioStore } from '../stores/radioStore';
import { useDeviceBehavior } from '../composables/useDeviceBehavior.js';
import WeatherWidget from './WeatherWidget.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([
  'add-task', 'open-settings', 'open-notes', 'open-interface', 'open-sprints', 'toggle-theme', 'open-radio', 'open-git-rebuilder'
]);

const settings = useSettingsStore();
const taskStore = useTaskStore();
const sprintStore = useSprintStore();
const timerStore = useTimerStore();
const radioStore = useRadioStore();

const { isMobile, shouldHideDockForModal } = useDeviceBehavior();
const isExpanded = ref(false);
const isMobileDockOpen = ref(false);

const handleRef = ref(null);
const dockRef = ref(null);

const hasAnyVisibleItem = computed(() => {
  if (taskStore.lastDeletedTask) return true;
  return Object.values(settings.dockVisibleItems).some(val => val === true);
});

const shouldShowDock = computed(() => props.visible && hasAnyVisibleItem.value);

const dockBlur = computed(() => {
  if (!settings.globalGlassEnabled) return '0px';
  return settings.dockOpacity > 0 ? '20px' : '0px';
});

useSwipe(handleRef, {
  threshold: 15,
  onSwipeEnd: (e, direction) => {
    if (isMobile.value && String(direction).toUpperCase() === 'UP') {
      isMobileDockOpen.value = true;
    }
  }
});

useSwipe(dockRef, {
  threshold: 15,
  onSwipeEnd: (e, direction) => {
    if (isMobile.value && String(direction).toUpperCase() === 'DOWN') {
      isMobileDockOpen.value = false;
    }
  }
});

onMounted(() => {
  if (!isMobile.value) {
    isExpanded.value = true;
  }
});

// Radius dinâmico para a dock (sempre respeitando a config global)
const dockRadius = computed(() => {
  return 'var(--app-card-radius)';
});
</script>

<template>
  <!-- 1. BACKDROP OVERLAY (Mobile only when dock is expanded) -->
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="isMobile && isMobileDockOpen && shouldShowDock"
      class="fixed inset-0 bg-slate-900/15 backdrop-blur-[1.5px] z-[240] pointer-events-auto"
      @click="isMobileDockOpen = false"
    ></div>
  </transition>

  <!-- 2. FLOATING ACTION BUTTON (Mobile only, shown when dock is closed) -->
  <button 
    v-if="isMobile && shouldShowDock"
    @click.stop="emit('add-task')"
    class="fixed bottom-4 right-4 w-12 h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 active:scale-95 z-[246]"
    :class="[
      isMobileDockOpen ? 'pointer-events-none opacity-0 scale-75' : 'pointer-events-auto opacity-100 scale-100'
    ]"
    :style="{ borderRadius: 'var(--app-card-radius)' }"
  >
    <Plus class="w-6 h-6" />
  </button>

  <!-- 3. PULL-UP INDICATOR HANDLE (Mobile only, shown when dock is closed) -->
  <div 
    v-if="isMobile && shouldShowDock"
    ref="handleRef"
    @click.stop="isMobileDockOpen = true"
    class="fixed bottom-0 left-0 w-full h-14 z-[240] flex items-end justify-center pb-3 cursor-pointer transition-all duration-300 touch-none select-none bg-slate-900/0"
    :class="[
      isMobileDockOpen ? 'pointer-events-none opacity-0 translate-y-4' : 'pointer-events-auto opacity-100 translate-y-0'
    ]"
  >
    <div class="flex flex-col items-center gap-1 group">
      <ChevronUp class="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors animate-bounce" />
      <div class="w-16 h-1.5 bg-slate-400/40 dark:bg-white/20 rounded-full group-hover:bg-indigo-500/50 transition-colors"></div>
    </div>
  </div>

  <!-- 4. MAIN DOCK CONTAINER -->
  <transition
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="translate-y-20 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="translate-y-20 opacity-0 scale-95"
  >
    <div 
      v-if="shouldShowDock"
      ref="dockRef"
      class="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[250] w-full max-w-fit px-2 sm:px-4 pb-[env(safe-area-inset-bottom)] transition-all duration-300 ease-out"
      :class="[
        isMobile 
          ? (isMobileDockOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-[150%] opacity-0') 
          : 'pointer-events-auto translate-y-0 opacity-100'
      ]"
    >
      <div 
        class="dynamic-island flex flex-col md:flex-row items-center justify-center border pointer-events-auto transition-all duration-300 ease-out overflow-hidden"
        :class="[
          isMobile && isMobileDockOpen ? 'w-[90vw] gap-3 p-4' : 'p-1.5 gap-2',
          settings.dockBackgroundEnabled 
            ? 'shadow-2xl border-app-border-light ring-1 ring-black/5' 
            : 'border-transparent shadow-none ring-0'
        ]"
        :style="{ 
          backgroundColor: settings.dockBackgroundEnabled ? `rgba(var(--app-bg-raw), ${settings.normalizedDockOpacity})` : 'transparent',
          backdropFilter: settings.dockBackgroundEnabled ? `blur(${dockBlur}) brightness(var(--app-glass-brightness)) saturate(var(--app-glass-saturate))` : 'none',
          borderRadius: dockRadius
        }"
      >
        <!-- Pull-down Close Bar (Mobile only inside open dock) -->
        <div 
          v-if="isMobile" 
          @click="isMobileDockOpen = false" 
          class="w-full flex justify-center py-1 cursor-pointer group -mt-2 mb-1"
        >
          <div class="w-10 h-1 bg-slate-400/30 dark:bg-white/10 rounded-full group-hover:bg-indigo-500/50 transition-all"></div>
        </div>

        <!-- LINHA 1: Cabeçalho da Ilha / Ações Principais -->
        <div 
          v-if="settings.dockVisibleItems.addTask || settings.dockVisibleItems.workedHours || settings.dockVisibleItems.weather || taskStore.lastDeletedTask"
          class="flex items-center justify-center w-full md:w-auto gap-2"
        >
          <!-- Adicionar Tarefa -->
          <button 
            v-if="settings.dockVisibleItems.addTask"
            @click.stop="emit('add-task')"
            class="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-95 group shrink-0"
            :style="{ borderRadius: 'var(--app-input-radius)' }"
            data-tip="Nova Tarefa (n)"
          >
            <Plus :size="settings.dockIconSize" class="group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <!-- Marcador de Horas Trabalhadas -->
          <div 
            v-if="settings.dockVisibleItems.workedHours"
            class="dock-item !bg-indigo-500/5 !border-indigo-500/20 px-3 flex items-center gap-2 h-12 md:h-10 shrink-0 cursor-pointer hover:bg-indigo-500/10 transition-colors"
            data-tip="Tempo trabalhado (Sprint • Hoje). Clique para gerenciar Sprints."
            @click="emit('open-sprints')"
          >
            <Clock :size="settings.dockIconSize" class="text-indigo-600 dark:text-indigo-400" :class="{ 'animate-pulse': timerStore.activeTask }" />
            <span class="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
              Sprint: {{ sprintStore.activeSprintTotalTime }} • Hoje: {{ timerStore.todayWorkedTimeFormatted }}
            </span>
          </div>

          <!-- Widget de Clima na Dock -->
          <WeatherWidget v-if="settings.dockVisibleItems.weather" />

          <!-- Botão Desfazer (Integrado na Dock - Sempre visível) -->
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
              <RotateCcw :size="settings.dockIconSize" class="group-hover:-rotate-45 transition-transform" />
              <span class="text-[10px] font-black uppercase tracking-tighter">Desfazer</span>
            </button>
          </transition>
        </div>

        <!-- SEÇÃO EXPANSÍVEL (Filtros e Utilidades) -->
        <div 
          v-if="settings.dockVisibleItems.filters || settings.dockVisibleItems.sprints || settings.dockVisibleItems.gitRebuilder || settings.dockVisibleItems.radio || settings.dockVisibleItems.notes || settings.dockVisibleItems.themeToggle || settings.dockVisibleItems.settings"
          v-show="!isMobile || isMobileDockOpen"
          class="flex flex-col md:flex-row items-center justify-center gap-3 w-full md:w-auto overflow-hidden transition-all duration-300"
          :class="{ 'mt-3 pt-3': isMobile && isMobileDockOpen }"
        >
          <!-- Filtros -->
          <div 
            v-if="settings.dockVisibleItems.filters"
            class="flex items-center gap-1 bg-app-surface p-1 border border-app-border-light w-full md:w-auto justify-center"
            :style="{ borderRadius: 'var(--app-input-radius)' }"
          >
            <button 
              v-for="filter in ['all', 'active', 'completed']" 
              :key="filter"
              @click="taskStore.statusFilter = filter"
              class="flex-1 md:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter transition-all border"
              :style="{ 
                borderRadius: 'calc(var(--app-input-radius) * 0.8)',
                backgroundColor: taskStore.statusFilter === filter 
                  ? `rgba(var(--app-bg-raw), var(--app-card-opacity))` 
                  : 'transparent'
              }"
              :class="taskStore.statusFilter === filter 
                ? 'border-app-border-light shadow-sm text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-app-sub hover:text-indigo-500'"
            >
              <span>{{ filter === 'all' ? 'Todas' : filter === 'active' ? 'Ativas' : 'Feitas' }}</span>
            </button>
          </div>

          <div v-if="settings.dockVisibleItems.filters && (settings.dockVisibleItems.sprints || settings.dockVisibleItems.gitRebuilder || settings.dockVisibleItems.radio || settings.dockVisibleItems.notes || settings.dockVisibleItems.themeToggle || settings.dockVisibleItems.settings)" class="hidden md:block w-px h-6 bg-app-border-light mx-1"></div>

          <!-- Sprint e Utilidades -->
          <div 
            v-if="settings.dockVisibleItems.sprints || settings.dockVisibleItems.gitRebuilder || settings.dockVisibleItems.radio || settings.dockVisibleItems.notes || settings.dockVisibleItems.themeToggle || settings.dockVisibleItems.settings"
            class="flex items-center justify-center md:justify-start w-full md:w-auto gap-2"
          >
            <div class="flex items-center gap-1">
              <button v-if="settings.dockVisibleItems.sprints" @click="emit('open-sprints')" class="util-btn" data-tip="Sprints">
                <Calendar :size="settings.dockIconSize" class="text-indigo-500" />
              </button>
              <button v-if="settings.dockVisibleItems.gitRebuilder" @click="emit('open-git-rebuilder')" class="util-btn group relative !text-emerald-500 hover:!bg-emerald-500/10 hover:!text-emerald-400" data-tip="Breeze (Git Rebuilder)">
                <CloudLightning :size="settings.dockIconSize" />
              </button>
              <button v-if="settings.dockVisibleItems.radio" @click="emit('open-radio')" class="util-btn group relative" data-tip="Rádio Lofi">
                <Headphones :size="settings.dockIconSize" class="text-amber-500" />
                <span v-if="radioStore.isPlaying" class="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-ping opacity-75"></span>
                <span v-if="radioStore.isPlaying" class="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-500 rounded-full opacity-50"></span>
              </button>
              <button v-if="settings.dockVisibleItems.notes" @click="emit('open-notes')" class="util-btn" data-tip="Notas Rápidas">
                <FileText :size="settings.dockIconSize" />
              </button>
              <button v-if="settings.dockVisibleItems.themeToggle" @click="emit('toggle-theme')" class="util-btn" data-tip="Alternar Tema">
                <Sun v-if="settings.theme === 'dark'" :size="settings.dockIconSize" class="text-amber-500" />
                <Moon v-else :size="settings.dockIconSize" class="text-indigo-500" />
              </button>
              <button v-if="settings.dockVisibleItems.settings" @click="emit('open-settings')" class="util-btn" data-tip="Configurações">
                <Settings :size="settings.dockIconSize" />
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
            <RotateCcw :size="settings.dockIconSize" /> Desfazer
          </button>
        </transition>
      </div>
    </div>
  </transition>
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
  @apply w-12 h-12 md:w-10 md:h-10 p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-500 transition-all active:scale-90 flex items-center justify-center;
  border-radius: var(--app-input-radius);
}
</style>
