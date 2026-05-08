<script setup>
import { ref } from 'vue';
import { 
  Pencil, CheckCircle, RotateCcw, Trash2, X, 
  GitBranch, MessageSquare, ExternalLink, 
  Play, Square, Globe, GitPullRequest
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

// Handlers migrados do TaskCard
const handleAction = async (field, label, type = 'url') => {
  const currentValue = props.task[field];
  
  // Se já existe um valor e é do tipo URL, o clique abre o link
  if (currentValue && type === 'url') {
    openLink(currentValue);
  } else {
    // Se não existe ou não é URL, abre o prompt de edição
    await taskActionService.promptQuickUpdate(props.task, taskStore, field, label, type);
  }
};

// Handler específico para editar um link que já existe (via clique longo ou menu)
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
</script>

<template>
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-4xl px-4 pointer-events-none">
    <div 
      class="glass-panel !p-2 flex flex-col md:flex-row items-center gap-4 shadow-2xl border-indigo-500/30 backdrop-blur-md ring-1 ring-black/5 pointer-events-auto transition-all duration-300 animate-scaleIn"
      @click.stop
      :style="{ 
        backgroundColor: settings.theme === 'dark' 
          ? `rgba(30, 41, 59, ${settings.opacityTargets.contextMenu ? (100 - settings.cardOpacity) / 100 : 0.98})` 
          : `rgba(255, 255, 255, ${settings.opacityTargets.contextMenu ? (100 - settings.cardOpacity) / 100 : 0.95})`,
        borderRadius: 'var(--app-card-radius)'
      }"
    >
      <!-- Seção 1: Identificação e Timer Rápido -->
      <div class="flex items-center gap-4 px-4 py-1 border-r border-slate-200 dark:border-white/10 pr-6 min-w-0 max-w-[280px]">
        <div class="flex flex-col min-w-0">
          <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Tarefa Ativa</span>
          <h4 class="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">
            {{ task.description || task.title }}
          </h4>
        </div>
        <button 
          @click="taskStore.toggleTimer(task)" 
          class="p-2 rounded-xl transition-all active:scale-90 shrink-0"
          :class="task.isRunning ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'"
        >
          <Square v-if="task.isRunning" class="w-5 h-5" />
          <Play v-else class="w-5 h-5" />
        </button>
      </div>

      <!-- Seção 2: Ícones de Ação (Os "Moved" do Card) -->
      <div class="flex items-center gap-2">
        <!-- GitLab -->
        <button 
          @click="handleGitlabAction"
          :disabled="isCreatingBranch || isMerging"
          class="icon-btn-large group"
          :class="{ 'active-action': task.branchUrl }"
          data-tip="Ações no GitLab"
        >
          <GitBranch v-if="!isCreatingBranch" class="w-5 h-5" />
          <div v-else class="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        </button>

        <!-- GitLab Merge -->
        <button 
          @click="handleMergeAction"
          :disabled="isCreatingBranch || isMerging"
          class="icon-btn-large group"
          data-tip="Analisar e Fazer Merge (dev-06)"
        >
          <GitPullRequest v-if="!isMerging" class="w-5 h-5" />
          <div v-else class="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        </button>

        <!-- Observações -->
        <button 
          @click="handleAction('moreInfo', 'Observações', 'text')"
          class="icon-btn-large"
          :class="{ 'active-action-amber': task.moreInfo }"
          data-tip="Observações"
        >
          <MessageSquare class="w-5 h-5" />
        </button>

        <!-- Link Externo -->
        <button 
          @click="handleAction('taskUrl', 'Link da Tarefa', 'url')"
          @contextmenu.prevent="handleEditAction('taskUrl', 'Link da Tarefa', 'url')"
          class="icon-btn-large"
          :class="{ 'active-action-indigo': task.taskUrl }"
          :data-tip="task.taskUrl ? 'Abrir Link (Botão direito para editar)' : 'Configurar Link'"
        >
          <ExternalLink class="w-5 h-5" />
        </button>

        <!-- Divisor Sutil -->
        <div class="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

        <!-- Ambientes (PRD, HML, DEV) -->
        <div class="flex items-center gap-1.5">
          <button 
            @click="handleAction('prodUrl', 'Merge com Produção', 'url')"
            @contextmenu.prevent="handleEditAction('prodUrl', 'Merge com Produção', 'url')"
            class="env-btn" :class="{ 'env-active-prd': task.prodUrl }"
            :data-tip="task.prodUrl ? 'Abrir Produção (Botão direito para editar)' : 'Configurar PRD'"
          >PRD</button>
          <button 
            @click="handleAction('homologUrl', 'Merge com Homologação', 'url')"
            @contextmenu.prevent="handleEditAction('homologUrl', 'Merge com Homologação', 'url')"
            class="env-btn" :class="{ 'env-active-hml': task.homologUrl }"
            :data-tip="task.homologUrl ? 'Abrir Homologação (Botão direito para editar)' : 'Configurar HML'"
          >HML</button>
          <button 
            @click="handleAction('devUrl', 'Merge com Desenvolvimento', 'url')"
            @contextmenu.prevent="handleEditAction('devUrl', 'Merge com Desenvolvimento', 'url')"
            class="env-btn" :class="{ 'env-active-dev': task.devUrl }"
            :data-tip="task.devUrl ? 'Abrir Desenvolvimento (Botão direito para editar)' : 'Configurar DEV'"
          >DEV</button>
        </div>
      </div>

      <!-- Seção 3: Gestão de Estado (Editar, Concluir, Excluir) -->
      <div class="flex items-center gap-2 ml-auto pl-4 border-l border-slate-200 dark:border-white/10">
        <button @click="emit('edit')" class="state-btn hover:bg-indigo-500/10 hover:text-indigo-600">
          <Pencil class="w-4 h-4" /> <span>Editar</span>
        </button>
        <button @click="emit('toggle-completion')" class="state-btn hover:bg-emerald-500/10 hover:text-emerald-600">
          <RotateCcw v-if="task.completed" class="w-4 h-4" />
          <CheckCircle v-else class="w-4 h-4" />
          <span>{{ task.completed ? 'Reabrir' : 'Concluir' }}</span>
        </button>
        <button @click="emit('delete')" class="state-btn text-red-500 hover:bg-red-500/10">
          <Trash2 class="w-4 h-4" /> <span>Excluir</span>
        </button>
        
        <button @click="emit('close')" class="p-2 ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-btn-large {
  @apply p-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-90 flex items-center justify-center;
  border-radius: var(--app-input-radius);
}

.active-action {
  @apply text-purple-600 dark:text-purple-400 bg-purple-500/15 border border-purple-500/30 !important;
  @apply scale-105 shadow-sm;
}

.active-action-amber {
  @apply text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 !important;
  @apply scale-105 shadow-sm;
}

.active-action-indigo {
  @apply text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 !important;
  @apply scale-105 shadow-sm;
}

.env-btn {
  @apply px-2 py-1.5 text-[9px] font-black tracking-tighter border border-transparent transition-all active:scale-95 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-white/10;
  border-radius: calc(var(--app-input-radius) * 0.8);
}

.env-active-prd { @apply bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40 !important; }
.env-active-hml { @apply bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 !important; }
.env-active-dev { @apply bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40 !important; }

.state-btn {
  @apply flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all;
  border-radius: var(--app-input-radius);
}
</style>
