<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { 
  Pencil, CheckCircle, RotateCcw, Trash2, X, 
  GitBranch, MessageSquare, ExternalLink, 
  Play, Square, Globe, Copy, TimerReset,
  Database, Clock
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { useTimerStore } from '../stores/timerStore';
import { useUIStore } from '../stores/uiStore';
import { taskActionService } from '../services/taskActionService';
import { gitProviderService } from '../services/gitProvider';
import { notificationService } from '../services/notificationService';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const settings = useSettingsStore();
const taskStore = useTaskStore();
const timerStore = useTimerStore();
const uiStore = useUIStore();
const isCreatingBranch = ref(false);
const menuRef = ref(null);

const isFloating = computed(() => settings.contextMenuStyle === 'floating');

/**
 * Classes descritivas de posicionamento do menu de contexto.
 * Depende de ser flutuante ou estilo Dock (e se a Dock empilha ou substitui a barra inferior).
 */
const contextMenuPositionClasses = computed(() => {
  if (isFloating.value) {
    return ['max-w-fit'];
  }
  
  // Modo Dock Clássico
  const bottomPosition = settings.contextMenuMode === 'stack' ? 'bottom-24' : 'bottom-6';
  return [bottomPosition, 'left-1/2', '-translate-x-1/2', 'max-w-[95%]', 'md:max-w-fit'];
});

const handleResetTime = async () => {
  const confirmed = await notificationService.confirm(
    'Zerar Tempo',
    'Tem certeza que deseja zerar o tempo desta tarefa? Esta ação não pode ser defelta.',
    'Zerar Agora',
    'warning'
  );
  
  if (confirmed) {
    await timerStore.resetTaskTime(props.task.id);
  }
};

const handleAction = async (field, label, type = 'url') => {
  const currentValue = props.task[field];
  if (currentValue && type === 'url') {
    openLink(currentValue);
  } else {
    await taskActionService.promptQuickUpdate(props.task, taskStore, field, label, type);
  }
};

const handleEditAction = async (field, label, type = 'url') => {
  await taskActionService.promptQuickUpdate(props.task, taskStore, field, label, type);
};

const handleGitAction = async () => {
  isCreatingBranch.value = true;
  try {
    await gitProviderService.handleGitFlow(props.task, settings);
  } catch (error) {
    console.error("Git Action failed:", error);
    notificationService.toast('Falha na ação remota', 'error');
  } finally {
    isCreatingBranch.value = false;
  }
};

const handleCloneAction = async () => {
  await taskStore.cloneTask(props.task);
  emit('close');
};

const openLink = (url) => {
  if (url) {
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(finalUrl, '_blank');
  }
};

const menuStyle = ref({
  top: 'auto',
  left: 'auto'
});

const adjustPosition = () => {
  if (!menuRef.value || !isFloating.value) return;
  
  let x = taskStore.contextMenuPosition.x;
  let y = taskStore.contextMenuPosition.y;
  
  const menuWidth = menuRef.value.offsetWidth;
  const menuHeight = menuRef.value.offsetHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  if (x + menuWidth > windowWidth - 20) x = windowWidth - menuWidth - 20;
  if (y + menuHeight > windowHeight - 20) y = windowHeight - menuHeight - 20;
  
  menuStyle.value = { top: `${y}px`, left: `${x}px` };
};

onMounted(() => {
  if (isFloating.value) adjustPosition();
  window.addEventListener('click', (e) => {
    if (menuRef.value && !menuRef.value.contains(e.target)) emit('close');
  });
});

onUnmounted(() => {
  window.removeEventListener('click', () => {});
});
</script>

<template>
  <div 
    ref="menuRef"
    class="fixed z-[1000] w-full px-2 pointer-events-none transition-all duration-300"
    :class="contextMenuPositionClasses"
    :style="isFloating ? menuStyle : {}"
  >
    <!-- DESIGN 1: FLUTUANTE (ESTILO WINDOWS/LISTA) -->
    <div 
      v-if="isFloating"
      class="glass-panel !py-2 !px-1.5 flex flex-col shadow-2xl border-indigo-500/30 ring-1 ring-black/10 pointer-events-auto min-w-[240px] animate-scaleIn"
      @click.stop
      :style="{ 
        backgroundColor: `rgba(var(--app-bg-raw), var(--app-menu-opacity))`,
        borderRadius: 'var(--app-card-radius)'
      }"
    >
      <div class="flex flex-col gap-0.5">
        <button @click="uiStore.openTaskModal(task); emit('close')" class="context-menu-item text-indigo-500">
          <Pencil class="w-4 h-4" /> 
          <span>Editar Tarefa (e)</span>
        </button>
        <button @click="taskStore.toggleTaskCompletion(task); emit('close')" class="context-menu-item" :class="task.completed ? 'text-blue-500' : 'text-emerald-500'">
          <RotateCcw v-if="task.completed" class="w-4 h-4" />
          <CheckCircle v-else class="w-4 h-4" />
          <span>{{ task.completed ? 'Reabrir Tarefa (f)' : 'Concluir Tarefa (f)' }}</span>
        </button>
      </div>

      <hr class="border-t border-app-border-light my-1.5 mx-1" />

      <div class="flex flex-col gap-0.5">
        <button 
          @click="handleAction('moreInfo', 'Observações', 'text')" 
          @contextmenu.prevent="handleEditAction('moreInfo', 'Observações', 'text')"
          class="context-menu-item" :class="{ 'active-item-amber': task.moreInfo }"
        >
          <MessageSquare class="w-4 h-4" />
          <span>Observações</span>
        </button>
        <button 
          @click="handleAction('dbScripts', 'Scripts SQL', 'text')" 
          @contextmenu.prevent="handleEditAction('dbScripts', 'Scripts SQL', 'text')"
          class="context-menu-item" :class="{ 'active-item-purple': task.dbScripts }"
        >
          <Database class="w-4 h-4" />
          <span>Scripts SQL</span>
        </button>
        <button 
          @click="handleAction('taskUrl', 'Link', 'url')" 
          @contextmenu.prevent="handleEditAction('taskUrl', 'Link da Tarefa', 'url')"
          class="context-menu-item" :class="{ 'active-item-indigo': task.taskUrl }"
        >
          <ExternalLink class="w-4 h-4" />
          <span>Link da Tarefa</span>
        </button>
      </div>

      <hr class="border-t border-app-border-light my-1.5 mx-1" />

      <div class="flex flex-col gap-0.5">
        <div class="px-2 py-1 flex items-center justify-between">
          <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ambientes</span>
          <div class="flex items-center gap-1">
            <button @click="taskStore.updateTask(task.id, { prodUrl: task.prodUrl == 1 ? 0 : 1 })" class="env-tag-sm" :class="{ 'env-active-prd': task.prodUrl == 1 }">PRD</button>
            <button @click="taskStore.updateTask(task.id, { homologUrl: task.homologUrl == 1 ? 0 : 1 })" class="env-tag-sm" :class="{ 'env-active-hml': task.homologUrl == 1 }">HML</button>
            <button @click="taskStore.updateTask(task.id, { devUrl: task.devUrl == 1 ? 0 : 1 })" class="env-tag-sm" :class="{ 'env-active-dev': task.devUrl == 1 }">DEV</button>
          </div>
        </div>
      </div>

      <hr class="border-t border-app-border-light my-1.5 mx-1" />

      <div class="flex flex-col gap-0.5">
        <button @click="handleGitAction" :disabled="isCreatingBranch" class="context-menu-item" :class="{ 'active-item-purple': gitProviderService.hasBranch(task, settings) }">
          <GitBranch v-if="!isCreatingBranch" class="w-4 h-4" />
          <div v-else class="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
          <span>{{ gitProviderService.hasBranch(task, settings) ? `Ver Branch ${gitProviderService.getProviderName(settings)}` : 'Criar Branch Automática' }}</span>
        </button>
        <button @click="handleCloneAction" class="context-menu-item text-slate-500">
          <Copy class="w-4 h-4" />
          <span>Clonar Tarefa (c)</span>
        </button>
      </div>

      <hr class="border-t border-app-border-light my-1.5 mx-1" />

      <div class="flex flex-col gap-0.5">
        <button @click="uiStore.openTimeAdjustment(task); emit('close')" class="context-menu-item text-blue-500">
          <Clock class="w-4 h-4" />
          <span>Ajustar Tempo</span>
        </button>
        <button @click="handleResetTime" class="context-menu-item text-amber-500">
          <TimerReset class="w-4 h-4" />
          <span>Zerar Tempo (z)</span>
        </button>
      </div>

      <hr class="border-t border-app-border-light my-1.5 mx-1" />

      <div class="flex flex-col gap-0.5">
        <button @click="taskStore.deleteTask(task.id); emit('close')" class="context-menu-item text-red-500 hover:!bg-red-500/10">
          <Trash2 class="w-4 h-4" />
          <span>Excluir Permanentemente (d)</span>
        </button>
      </div>
    </div>

    <!-- DESIGN 2: DOCK (HORIZONTAL/CLÁSSICO) -->
    <div 
      v-else
      class="glass-panel !p-1.5 flex flex-col md:flex-row items-center gap-2 md:gap-3 shadow-2xl border border-app-border-light ring-1 ring-black/5 pointer-events-auto transition-all duration-300 animate-scaleIn"
      @click.stop
      :style="{ 
        backgroundColor: `rgba(var(--app-bg-raw), var(--app-bottom-opacity))`,
        borderRadius: 'var(--app-card-radius)'
      }"
    >
      <div class="flex items-center gap-3 px-4 py-1 border-b md:border-b-0 md:border-r border-app-border-light w-full md:w-auto md:min-w-[200px] md:max-w-[300px]">
        <div class="flex flex-col min-w-0 flex-1">
          <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Tarefa Ativa</span>
          <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-tight" :data-tip="task.description || task.title">
            {{ task.description || task.title }}
          </h4>
        </div>
        <button @click="timerStore.toggleTimer(task)" class="p-2 rounded-xl transition-all active:scale-90 shrink-0" :class="task.isRunning ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'">
          <Square v-if="task.isRunning" class="w-4 h-4" />
          <Play v-else class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-1.5 px-2">
        <button @click="handleGitAction" :disabled="isCreatingBranch" class="icon-btn-large group" :class="{ 'active-action': gitProviderService.hasBranch(task, settings) }" data-tip="Branch do Git">
          <GitBranch v-if="!isCreatingBranch" class="w-4 h-4" />
          <div v-else class="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        </button>
        <button @click="handleCloneAction" class="icon-btn-large group" data-tip="Clonar Tarefa (c)"><Copy class="w-4 h-4" /></button>
        <button 
          @click="handleAction('moreInfo', 'Observações', 'text')" 
          @contextmenu.prevent="handleEditAction('moreInfo', 'Observações', 'text')"
          class="icon-btn-large" :class="{ 'active-action-amber': task.moreInfo }"
          data-tip="Observações"
        ><MessageSquare class="w-4 h-4" /></button>
        <button 
          @click="handleAction('dbScripts', 'Scripts SQL', 'text')" 
          @contextmenu.prevent="handleEditAction('dbScripts', 'Scripts SQL', 'text')"
          class="icon-btn-large" :class="{ 'active-action-purple': task.dbScripts }"
          data-tip="Scripts SQL"
        ><Database class="w-4 h-4" /></button>
        <button 
          @click="handleAction('taskUrl', 'Link da Tarefa', 'url')" 
          @contextmenu.prevent="handleEditAction('taskUrl', 'Link da Tarefa', 'url')"
          class="icon-btn-large" :class="{ 'active-action-indigo': task.taskUrl }"
          data-tip="Link da Tarefa"
        ><ExternalLink class="w-4 h-4" /></button>
        <div class="flex items-center gap-1 ml-1">
          <button @click="taskStore.updateTask(task.id, { prodUrl: task.prodUrl == 1 ? 0 : 1 })" class="env-btn" :class="{ 'env-active-prd': task.prodUrl == 1 }">PRD</button>
          <button @click="taskStore.updateTask(task.id, { homologUrl: task.homologUrl == 1 ? 0 : 1 })" class="env-btn" :class="{ 'env-active-hml': task.homologUrl == 1 }">HML</button>
          <button @click="taskStore.updateTask(task.id, { devUrl: task.devUrl == 1 ? 0 : 1 })" class="env-btn" :class="{ 'env-active-dev': task.devUrl == 1 }">DEV</button>
        </div>
      </div>

      <div class="flex items-center gap-1.5 pl-2 md:pl-4 border-t md:border-t-0 md:border-l border-app-border-light w-full md:w-auto justify-center">
        <button @click="uiStore.openTimeAdjustment(task); emit('close')" class="icon-btn-large text-blue-500 hover:bg-blue-500/10" data-tip="Ajustar Tempo"><Clock class="w-5 h-5" /></button>
        <button @click="handleResetTime" class="icon-btn-large text-amber-500 hover:bg-amber-500/10" data-tip="Zerar Tempo (z)"><TimerReset class="w-5 h-5" /></button>
        <button @click="uiStore.openTaskModal(task); emit('close')" class="icon-btn-large text-indigo-500 hover:bg-indigo-500/10" data-tip="Editar (e)"><Pencil class="w-5 h-5" /></button>
        <button @click="taskStore.toggleTaskCompletion(task); emit('close')" class="icon-btn-large" :class="task.completed ? 'text-blue-500 hover:bg-blue-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'" :data-tip="task.completed ? 'Reabrir (f)' : 'Concluir (f)'">
          <RotateCcw v-if="task.completed" class="w-5 h-5" />
          <CheckCircle v-else class="w-5 h-5" />
        </button>
        <button @click="taskStore.deleteTask(task.id); emit('close')" class="icon-btn-large text-red-500 hover:bg-red-500/10" data-tip="Excluir (d)"><Trash2 class="w-5 h-5" /></button>
        <div class="w-px h-6 bg-app-border-light mx-1 hidden md:block"></div>
        <button @click="emit('close')" class="icon-btn-large text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" data-tip="Fechar"><X class="w-5 h-5" /></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.context-menu-item {
  @apply w-full px-3 py-2 flex items-center gap-3 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors rounded-[8px] active:scale-[0.98] cursor-pointer;
}

.env-tag-sm {
  @apply px-1.5 py-0.5 text-[9px] font-black tracking-tighter transition-all active:scale-95 bg-slate-100 dark:bg-white/5 text-slate-400 rounded border border-transparent text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10;
}

.active-item-purple { @apply text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 !important; }
.active-item-amber { @apply text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 !important; }
.active-item-indigo { @apply text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 !important; }

.floating-btn {
  @apply w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-90 rounded-xl border border-transparent;
}

.env-tag-floating {
  @apply px-2 py-1 text-[9px] font-black tracking-tighter transition-all active:scale-95 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-lg border border-transparent text-center;
}

.env-active-prd { @apply bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 !important; }
.env-active-hml { @apply bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 !important; }
.env-active-dev { @apply bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 !important; }

.btn-active-purple { @apply text-purple-600 dark:text-purple-400 bg-purple-500/15 border-purple-500/30 !important; }
.btn-active-amber { @apply text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30 !important; }
.btn-active-indigo { @apply text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 !important; }

.icon-btn-large {
  @apply p-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-90 flex items-center justify-center;
  border-radius: var(--app-input-radius);
}

.active-action { @apply text-purple-600 bg-purple-500/15 border border-purple-500/30 !important; }
.active-action-purple { @apply text-purple-600 bg-purple-500/15 border border-purple-500/30 !important; }
.active-action-amber { @apply text-amber-600 bg-amber-500/15 border border-amber-500/30 !important; }
.active-action-indigo { @apply text-indigo-600 bg-indigo-500/15 border border-indigo-500/30 !important; }

.env-btn {
  @apply px-2 py-1.5 text-[9px] font-black tracking-tighter border border-transparent transition-all active:scale-95 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-white/10;
  border-radius: calc(var(--app-input-radius) * 0.8);
}

.animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>
