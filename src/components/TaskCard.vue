<script setup>
import { computed, ref } from 'vue';
import { Play, Square, GitBranch, ExternalLink, MessageSquare, StickyNote, X } from 'lucide-vue-next';
import { notificationService } from '../services/notificationService';
import { slugify } from '../utils/string.js';
import { formatMsToHMS } from '../utils/time.js';

// Stores & Services
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { gitlabService } from '../services/gitlab';

const settings = useSettingsStore();
const taskStore = useTaskStore();

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits([
  'toggle-timer'
]);

const showObservations = ref(false);

const formattedTime = computed(() => formatMsToHMS(props.task.totalTimeSpent));

const formattedTitle = computed(() => {
  if (!settings.formatText) return props.task.title;
  return slugify(props.task.title);
});

const formattedDescription = computed(() => {
  if (!props.task.description) return '';
  if (!settings.formatText) return props.task.description;
  return slugify(props.task.description);
});

const isCreatingBranch = ref(false);

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

const handleSelect = () => {
  if (taskStore.selectedTask?.id === props.task.id) {
    taskStore.selectedTask = null;
  } else {
    taskStore.selectedTask = props.task;
  }
};

const openLink = (url) => {
  if (url) window.open(url, '_blank');
};
</script>

<template>
  <div 
    class="glass-panel transition-all duration-300 animate-scaleIn cursor-pointer cursor-grab hover:-translate-y-0.5 group relative"
    :class="[
      task.isRunning ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : '',
      taskStore.selectedTask?.id === task.id ? 'ring-2 ring-indigo-500/50 border-indigo-500 bg-indigo-50/10 dark:bg-indigo-500/5' : 'hover:border-indigo-400/40'
    ]"
    @click.stop="handleSelect"
  >
    <!-- Balão de Observações Local -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-2 opacity-0 scale-95"
    >
      <div v-if="showObservations && task.moreInfo" class="absolute bottom-full right-0 mb-2 z-[70] w-64 sm:w-80" @click.stop>
        <div class="p-4 shadow-2xl bg-white dark:bg-slate-900 border border-amber-500/40 rounded-2xl ring-2 ring-black/10">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <StickyNote class="w-3.5 h-3.5 text-amber-500" />
              <span class="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Observações</span>
            </div>
            <button @click="showObservations = false" class="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors">
              <X class="w-3 h-3 text-slate-400" />
            </button>
          </div>
          <p class="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">{{ task.moreInfo }}</p>
          <div class="absolute -bottom-1.5 right-[5.2rem] w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-amber-500/40 rotate-45"></div>
        </div>
      </div>
    </transition>

    <div :class="task.completed ? 'opacity-50' : ''" class="flex justify-between items-center gap-2 transition-opacity">
      <div class="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        <span 
          class="font-bold px-2 py-1 rounded-lg leading-none shrink-0 truncate max-w-[100px] sm:max-w-[200px] transition-all" 
          :style="{ 
            backgroundColor: task.color ? `${task.color}26` : '', 
            color: task.color || '',
            border: task.color ? `1px solid ${task.color}40` : '',
            fontSize: settings.taskNumberSize + 'px'
          }"
          :class="!task.color ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 dark:bg-indigo-500/20' : ''"
          :title="formattedTitle"
        >
          {{ formattedTitle }}
        </span>
        <span 
          v-if="formattedDescription" 
          class="text-sm truncate flex-1 min-w-0" 
          :class="task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'"
          :style="{ fontSize: settings.taskDescriptionSize + 'px' }"
          :title="formattedDescription"
        >
          {{ formattedDescription }}
        </span>
      </div>
            <div class="flex items-center gap-1.5 shrink-0 ml-auto flex-row-reverse">
        <!-- 1. Play/Stop Task (Timer) -->
        <button 
          v-if="!task.completed"
          class="icon-btn !p-1.5 transition-all" 
          :class="task.isRunning ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/10'" 
          @click.stop="emit('toggle-timer', task)" 
          title="Iniciar/Parar Cronômetro"
        >
          <Square v-if="task.isRunning" class="w-3.5 h-3.5" />
          <Play v-else class="w-3.5 h-3.5" />
        </button>

        <!-- 2. GitLab Action -->
        <button 
          v-if="!task.completed || task.branchUrl"
          class="icon-btn !p-1.5 transition-all text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10"
          @click.stop="handleGitlabAction()"
          :disabled="isCreatingBranch"
          title="GitLab Action"
        >
          <GitBranch v-if="!isCreatingBranch" class="w-3.5 h-3.5" />
          <div v-else class="w-3.5 h-3.5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        </button>

        <!-- 3. Mensagem (Observações - Persistente) -->
        <button 
          class="px-1.5 py-1 rounded text-[8px] font-black tracking-tighter transition-all border" 
          :class="task.moreInfo 
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20' 
            : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-600 border-transparent opacity-20 cursor-default'"
          @click.stop="task.moreInfo && (showObservations = !showObservations)"
          :title="task.moreInfo ? 'Ver Observações' : ''"
        >
          <MessageSquare class="w-3 h-3" />
        </button>

        <!-- 4. Banco (Link Externo) -->
        <a 
          v-if="task.taskUrl" 
          :href="task.taskUrl" 
          target="_blank" 
          class="px-1.5 py-1 rounded text-[8px] font-black tracking-tighter transition-all bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10" 
          @click.stop
          title="Abrir Link do Banco/Tarefa"
        >
          <ExternalLink class="w-3 h-3" />
        </a>

        <!-- 5. Ambientes (PRD, HML, DEV) -->
        <div class="flex items-center gap-1.5 ml-1">
          <div 
            @click.stop="task.prodUrl && openLink(task.prodUrl)"
            class="px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter transition-all"
            :class="task.prodUrl 
              ? 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)] border border-blue-400 cursor-pointer hover:scale-105 active:scale-95' 
              : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-600 border-transparent opacity-20'"
            :title="task.prodUrl ? 'Abrir Produção' : 'Sem link de Produção'"
          >
            PRD
          </div>
          <div 
            @click.stop="task.homologUrl && openLink(task.homologUrl)"
            class="px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter transition-all"
            :class="task.homologUrl 
              ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-emerald-400 cursor-pointer hover:scale-105 active:scale-95' 
              : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-600 border-transparent opacity-20'"
            :title="task.homologUrl ? 'Abrir Homologação Cliente' : 'Sem link de Homolog'"
          >
            HML
          </div>
          <div 
            @click.stop="task.devUrl && openLink(task.devUrl)"
            class="px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter transition-all"
            :class="task.devUrl 
              ? 'bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)] border border-orange-400 cursor-pointer hover:scale-105 active:scale-95' 
              : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-600 border-transparent opacity-20'"
            :title="task.devUrl ? 'Abrir Homologação Interna' : 'Sem link de Dev'"
          >
            DEV
          </div>
        </div>

        <!-- 6. Contador (Tempo) -->
        <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none mr-1">{{ formattedTime }}</span>
      </div>
    </div>

    <div v-if="taskStore.selectedTask?.id === task.id" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
      <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  transition: all 0.3s ease;
}
</style>
