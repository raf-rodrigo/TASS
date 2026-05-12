<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { 
  Pencil, CheckCircle, RotateCcw, Trash2, X, 
  GitBranch, MessageSquare, ExternalLink, 
  Play, Square, Globe, GitPullRequest, TimerReset,
  Database
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { taskActionService } from '../services/taskActionService';
import { gitlabService } from '../services/gitlab';
import { notificationService } from '../services/notificationService';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'edit', 'toggle-completion', 'delete']);

const settings = useSettingsStore();
const taskStore = useTaskStore();
const isCreatingBranch = ref(false);
const isMerging = ref(false);
const menuRef = ref(null);

const isFloating = computed(() => settings.contextMenuStyle === 'floating');

const handleResetTime = async () => {
  const confirmed = await notificationService.confirm(
    'Zerar Tempo',
    'Tem certeza que deseja zerar o tempo desta tarefa? Esta ação não pode ser desfeita.',
    'Zerar Agora',
    'warning'
  );
  
  if (confirmed) {
    await taskStore.resetTaskTime(props.task.id);
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

const handleGitlabAction = async () => {
  isCreatingBranch.value = true;
  try {
    await gitlabService.handleGitlabFlow(props.task, settings);
  } catch (error) {
    console.error("GitLab Action failed:", error);
    notificationService.toast('Falha na ação do GitLab', 'error');
  } finally {
    isCreatingBranch.value = false;
  }
};

const handleMergeAction = async () => {
  isMerging.value = true;
  try {
    await gitlabService.analyzeAndMerge(props.task, settings);
  } catch (error) {
    console.error("GitLab Merge failed:", error);
    notificationService.toast('Falha na análise/merge do GitLab', 'error');
  } finally {
    isMerging.value = false;
  }
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
    :class="[
      isFloating ? 'max-w-fit' : 'bottom-6 left-1/2 -translate-x-1/2 max-w-[95%] md:max-w-fit'
    ]"
    :style="isFloating ? menuStyle : {}"
  >
    <!-- DESIGN 1: FLUTUANTE (ELEGANTE/VERTICAL) -->
    <div 
      v-if="isFloating"
      class="glass-panel !p-2 flex flex-col gap-2 shadow-2xl border-indigo-500/30 backdrop-blur-xl ring-1 ring-black/10 pointer-events-auto min-w-[200px] animate-scaleIn"
      @click.stop
      :style="{ 
        backgroundColor: settings.theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.92)',
        borderRadius: 'var(--app-card-radius)'
      }"
    >
      <!-- Linha 1: Git, Merge, Observações e Link -->
      <div class="grid grid-cols-5 gap-1.5 p-1">
        <button @click="handleGitlabAction" :disabled="isCreatingBranch || isMerging" class="floating-btn" :class="{ 'btn-active-purple': task.branchUrl }" data-tip="GitLab Branch">
          <GitBranch v-if="!isCreatingBranch" class="w-4 h-4" />
          <div v-else class="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        </button>
        <button @click="handleMergeAction" :disabled="isCreatingBranch || isMerging" class="floating-btn" data-tip="GitLab Merge">
          <GitPullRequest v-if="!isMerging" class="w-4 h-4" />
          <div v-else class="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        </button>
        <button 
          @click="handleAction('moreInfo', 'Observações', 'text')" 
          @contextmenu.prevent="handleEditAction('moreInfo', 'Observações', 'text')"
          class="floating-btn" :class="{ 'btn-active-amber': task.moreInfo }" 
          data-tip="Observações (Dir. para editar)"
        >
          <MessageSquare class="w-4 h-4" />
        </button>
        <button 
          @click="handleAction('dbScripts', 'Scripts SQL', 'text')" 
          @contextmenu.prevent="handleEditAction('dbScripts', 'Scripts SQL', 'text')"
          class="floating-btn" :class="{ 'btn-active-purple': task.dbScripts }" 
          data-tip="Scripts SQL (Dir. para editar)"
        >
          <Database class="w-4 h-4" />
        </button>
        <button 
          @click="handleAction('taskUrl', 'Link', 'url')" 
          @contextmenu.prevent="handleEditAction('taskUrl', 'Link da Tarefa', 'url')"
          class="floating-btn" :class="{ 'btn-active-indigo': task.taskUrl }" 
          data-tip="Link (Dir. para editar)"
        >
          <ExternalLink class="w-4 h-4" />
        </button>
      </div>

      <!-- Linha 2: Ambientes -->
      <div class="flex items-center gap-1.5 px-1 py-1.5 border-y border-app-border-light">
        <button 
          @click="handleAction('prodUrl', 'PRD', 'url')" 
          @contextmenu.prevent="handleEditAction('prodUrl', 'PRD', 'url')"
          class="env-tag-floating flex-1" :class="{ 'env-active-prd': task.prodUrl }"
        >PRD</button>
        <button 
          @click="handleAction('homologUrl', 'HML', 'url')" 
          @contextmenu.prevent="handleEditAction('homologUrl', 'HML', 'url')"
          class="env-tag-floating flex-1" :class="{ 'env-active-hml': task.homologUrl }"
        >HML</button>
        <button 
          @click="handleAction('devUrl', 'DEV', 'url')" 
          @contextmenu.prevent="handleEditAction('devUrl', 'DEV', 'url')"
          class="env-tag-floating flex-1" :class="{ 'env-active-dev': task.devUrl }"
        >DEV</button>
      </div>

      <!-- Linha 3: Gestão -->
      <div class="grid grid-cols-4 gap-1.5 p-1">
        <button @click="handleResetTime" class="floating-btn text-amber-500 hover:bg-amber-500/10" data-tip="Zerar"><TimerReset class="w-4 h-4" /></button>
        <button @click="emit('edit')" class="floating-btn text-indigo-500 hover:bg-indigo-500/10" data-tip="Editar"><Pencil class="w-4 h-4" /></button>
        <button @click="emit('toggle-completion')" class="floating-btn" :class="task.completed ? 'text-blue-500 hover:bg-blue-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'" data-tip="Concluir">
          <RotateCcw v-if="task.completed" class="w-4 h-4" />
          <CheckCircle v-else class="w-4 h-4" />
        </button>
        <button @click="emit('delete')" class="floating-btn text-red-500 hover:bg-red-500/10" data-tip="Excluir"><Trash2 class="w-4 h-4" /></button>
      </div>
    </div>

    <!-- DESIGN 2: DOCK (HORIZONTAL/CLÁSSICO) -->
    <div 
      v-else
      class="glass-panel !p-2 flex flex-col md:flex-row items-center gap-2 md:gap-4 shadow-2xl border-indigo-500/30 backdrop-blur-md ring-1 ring-black/5 pointer-events-auto transition-all duration-300 animate-scaleIn"
      @click.stop
      :style="{ 
        backgroundColor: settings.theme === 'dark' 
          ? `rgba(30, 41, 59, ${settings.opacityTargets.contextMenu ? (100 - settings.cardOpacity) / 100 : 0.98})` 
          : `rgba(255, 255, 255, ${settings.opacityTargets.contextMenu ? (100 - settings.cardOpacity) / 100 : 0.95})`,
        borderRadius: 'var(--app-card-radius)'
      }"
    >
      <div class="flex items-center gap-3 px-4 py-1 border-b md:border-b-0 md:border-r border-app-border-light w-full md:w-auto md:min-w-[200px] md:max-w-[300px]">
        <div class="flex flex-col min-w-0 flex-1">
          <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Tarefa Ativa</span>
          <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-tight" :title="task.description || task.title">
            {{ task.description || task.title }}
          </h4>
        </div>
        <button @click="taskStore.toggleTimer(task)" class="p-2 rounded-xl transition-all active:scale-90 shrink-0" :class="task.isRunning ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'">
          <Square v-if="task.isRunning" class="w-4 h-4" />
          <Play v-else class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-1.5 px-2">
        <button @click="handleGitlabAction" :disabled="isCreatingBranch || isMerging" class="icon-btn-large group" :class="{ 'active-action': task.branchUrl }">
          <GitBranch v-if="!isCreatingBranch" class="w-4 h-4" />
          <div v-else class="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        </button>
        <button @click="handleMergeAction" :disabled="isCreatingBranch || isMerging" class="icon-btn-large group"><GitPullRequest v-if="!isMerging" class="w-4 h-4" /><div v-else class="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div></button>
        <button 
          @click="handleAction('moreInfo', 'Observações', 'text')" 
          @contextmenu.prevent="handleEditAction('moreInfo', 'Observações', 'text')"
          class="icon-btn-large" :class="{ 'active-action-amber': task.moreInfo }"
        ><MessageSquare class="w-4 h-4" /></button>
        <button 
          @click="handleAction('dbScripts', 'Scripts SQL', 'text')" 
          @contextmenu.prevent="handleEditAction('dbScripts', 'Scripts SQL', 'text')"
          class="icon-btn-large" :class="{ 'active-action-purple': task.dbScripts }"
        ><Database class="w-4 h-4" /></button>
        <button 
          @click="handleAction('taskUrl', 'Link da Tarefa', 'url')" 
          @contextmenu.prevent="handleEditAction('taskUrl', 'Link da Tarefa', 'url')"
          class="icon-btn-large" :class="{ 'active-action-indigo': task.taskUrl }"
        ><ExternalLink class="w-4 h-4" /></button>
        <div class="flex items-center gap-1 ml-1">
          <button @click="handleAction('prodUrl', 'PRD', 'url')" @contextmenu.prevent="handleEditAction('prodUrl', 'PRD', 'url')" class="env-btn" :class="{ 'env-active-prd': task.prodUrl }">PRD</button>
          <button @click="handleAction('homologUrl', 'HML', 'url')" @contextmenu.prevent="handleEditAction('homologUrl', 'HML', 'url')" class="env-btn" :class="{ 'env-active-hml': task.homologUrl }">HML</button>
          <button @click="handleAction('devUrl', 'DEV', 'url')" @contextmenu.prevent="handleEditAction('devUrl', 'DEV', 'url')" class="env-btn" :class="{ 'env-active-dev': task.devUrl }">DEV</button>
        </div>
      </div>

      <div class="flex items-center gap-1.5 pl-2 md:pl-4 border-t md:border-t-0 md:border-l border-app-border-light w-full md:w-auto justify-center">
        <button @click="handleResetTime" class="icon-btn-large text-amber-500 hover:bg-amber-500/10"><TimerReset class="w-5 h-5" /></button>
        <button @click="emit('edit')" class="icon-btn-large text-indigo-500 hover:bg-indigo-500/10"><Pencil class="w-5 h-5" /></button>
        <button @click="emit('toggle-completion')" class="icon-btn-large" :class="task.completed ? 'text-blue-500 hover:bg-blue-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'">
          <RotateCcw v-if="task.completed" class="w-5 h-5" />
          <CheckCircle v-else class="w-5 h-5" />
        </button>
        <button @click="emit('delete')" class="icon-btn-large text-red-500 hover:bg-red-500/10"><Trash2 class="w-5 h-5" /></button>
        <div class="w-px h-6 bg-app-border-light mx-1 hidden md:block"></div>
        <button @click="emit('close')" class="icon-btn-large text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X class="w-5 h-5" /></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
