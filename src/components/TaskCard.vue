<script setup>
import { computed, ref } from 'vue';
import { Play, Square, GitBranch, ExternalLink, MessageSquare, StickyNote, X } from 'lucide-vue-next';
import { notificationService } from '../services/notificationService';
import { slugify } from '../utils/string.js';
import { formatMsToHMS } from '../utils/time.js';
import { isValidUrl, ensureProtocol } from '../utils/validation';
import Swal from '../utils/swal';

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


const isCreatingBranch = ref(false);

const handleQuickAction = async (field, label, type = 'url') => {
  const currentValue = props.task[field] || '';
  
  // Se for um link e já tiver valor, abrimos o link normalmente
  if (type === 'url' && currentValue) {
    window.open(ensureProtocol(currentValue), '_blank');
    return;
  }

  // Se for observação e já tiver valor, o clique alterna a exibição (comportamento original)
  if (field === 'moreInfo' && currentValue) {
    showObservations.value = !showObservations.value;
    return;
  }

  // Refatoração para estrutura sólida sem hacks de CSS
  const { value: newValue } = await Swal.fire({
    title: `Cadastrar ${label}`,
    html: `
      <div class="p-1">
        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 text-center">
          Insira o ${label.toLowerCase()} para esta tarefa
        </p>
        <div class="max-w-[calc(100%-2.25em)] mx-auto">
          <input 
            id="swal-input-custom" 
            class="tass-input my-4" 
            placeholder="${type === 'url' ? 'https://...' : 'Escreva aqui...'}"
            value="${currentValue}"
          >
          <div id="swal-error-custom" class="hidden bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-3 rounded-xl border border-red-500/20 mb-2 animate-shake"></div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
    buttonsStyling: false,
    customClass: {
      popup: 'tass-modal',
      confirmButton: 'btn btn-primary !px-8',
      cancelButton: 'btn btn-secondary !px-6',
      title: 'tass-modal-title'
    },
    didOpen: () => {
      const input = document.getElementById('swal-input-custom');
      const confirmButton = Swal.getConfirmButton();
      const errorDiv = document.getElementById('swal-error-custom');
      
      confirmButton.disabled = !input.value.trim();
      input.focus();

      input.addEventListener('input', (e) => {
        confirmButton.disabled = !e.target.value.trim();
        errorDiv.classList.add('hidden'); // Esconde erro ao voltar a digitar
      });
    },
    preConfirm: () => {
      const value = document.getElementById('swal-input-custom').value.trim();
      const errorDiv = document.getElementById('swal-error-custom');
      
      if (!value) {
        errorDiv.textContent = 'O campo não pode estar vazio!';
        errorDiv.classList.remove('hidden');
        return false;
      }
      
      if (type === 'url' && !isValidUrl(value)) {
        errorDiv.textContent = 'Por favor, insira um link válido!';
        errorDiv.classList.remove('hidden');
        return false;
      }
      
      return value;
    }
  });

  if (newValue) {
    const formattedValue = type === 'url' ? ensureProtocol(newValue.trim()) : newValue.trim();
    try {
      await taskStore.updateTask(props.task.id, { [field]: formattedValue });
      notificationService.toast(`${label} salvo com sucesso!`, 'success');
    } catch (error) {
      notificationService.toast('Erro ao salvar alteração.', 'error');
    }
  }
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
    class="glass-panel transition-all duration-300 animate-scaleIn cursor-pointer cursor-grab hover:-translate-y-0.5 group relative hover:z-[100]"
    :class="[
      task.isRunning ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : '',
      taskStore.selectedTask?.id === task.id ? 'ring-2 ring-indigo-500/50 border-indigo-500 z-[50]' : 'hover:border-indigo-400/40',
      settings.cardOpacity < 1 ? 'backdrop-blur-xl' : ''
    ]"
    :style="{ 
      backgroundColor: taskStore.selectedTask?.id === task.id 
        ? (settings.cardOpacity < 1 ? 'rgba(99, 102, 241, 0.1)' : '') 
        : '' 
    }"
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
          class="font-bold px-2 py-1 rounded-lg leading-none flex-shrink-0 transition-all border flex items-center justify-center gap-2 mr-2 min-w-[85px]" 
          :style="{ 
            backgroundColor: (!task.isRunning && task.color) ? `${task.color}26` : '', 
            color: (!task.isRunning && task.color) ? task.color : '',
            borderColor: (!task.isRunning && task.color) ? `${task.color}40` : 'transparent',
            fontSize: settings.taskNumberSize + 'px'
          }"
          :class="[
            (!task.color && !task.isRunning) ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500/20' : '',
            task.isRunning ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs' : ''
          ]"
          :title="task.isRunning ? 'Tempo Decorrido' : task.title"
        >
          {{ task.isRunning ? formattedTime : task.title }}
          <span v-if="task.isRunning" class="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></span>
        </span>
        <span 
          v-if="task.description || task.isRunning" 
          class="text-sm truncate flex-1 min-w-0" 
          :class="task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'"
          :style="{ fontSize: settings.taskDescriptionSize + 'px' }"
          :title="task.isRunning ? `${task.title} - ${task.description}` : task.description"
        >
          <template v-if="task.isRunning">
            <span class="font-bold text-indigo-500 dark:text-indigo-400 mr-1">{{ task.title }}</span>
            <span v-if="task.description" class="opacity-60">- {{ task.description }}</span>
          </template>
          <template v-else>
            {{ task.description }}
          </template>
        </span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0 ml-auto flex-row-reverse">
        <!-- 1. Play/Stop Task (Timer) -->
        <button 
          v-if="!task.completed"
          class="transition-all flex items-center justify-center border" 
          :class="[
            settings.roundedIcons ? 'w-[26px] h-[26px] rounded-xl' : 'px-1.5 py-1 rounded border-transparent',
            task.isRunning 
              ? 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20' 
              : 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
          ]" 
          @click.stop="emit('toggle-timer', task)" 
          data-tip="Iniciar/Parar Cronômetro"
        >
          <Square v-if="task.isRunning" class="w-3.5 h-3.5" />
          <Play v-else class="w-3.5 h-3.5" />
        </button>

        <!-- 2. GitLab Action -->
        <button 
          class="transition-all flex items-center justify-center border"
          :class="[
            settings.roundedIcons ? 'w-[26px] h-[26px] rounded-xl' : 'px-1.5 py-1 rounded',
            task.branchUrl 
              ? 'text-purple-600 dark:text-purple-400 bg-purple-500/5 border-purple-500/10 hover:bg-purple-500/15' 
              : 'bg-slate-100 dark:bg-white/5 text-slate-400/40 dark:text-slate-600/40 border-transparent cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10'
          ]"
          @click.stop="handleGitlabAction()"
          :disabled="isCreatingBranch"
          data-tip="Ações no GitLab"
        >
          <GitBranch v-if="!isCreatingBranch" class="w-3.5 h-3.5" />
          <div v-else class="w-3.5 h-3.5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
        </button>

        <!-- 3. Mensagem (Observações - Persistente) -->
        <button 
          class="transition-all flex items-center justify-center border" 
          :class="[
            settings.roundedIcons ? 'w-[26px] h-[26px] rounded-xl' : 'px-1.5 py-1 rounded text-[8px]',
            task.moreInfo 
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20' 
              : 'bg-slate-100 dark:bg-white/5 text-slate-400/40 dark:text-slate-600/40 border-transparent'
          ]"
          @click.stop="handleQuickAction('moreInfo', 'Observações', 'text')"
          :data-tip="task.moreInfo ? 'Ver Observações' : 'Clique para cadastrar Observações'"
        >
          <MessageSquare class="w-3 h-3" />
        </button>

        <!-- 4. Link da Tarefa (Link Externo) -->
        <button 
          class="transition-all flex items-center justify-center border" 
          :class="[
            settings.roundedIcons ? 'w-[26px] h-[26px] rounded-xl' : 'px-1.5 py-1 rounded text-[8px]',
            task.taskUrl 
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20' 
              : 'bg-slate-100 dark:bg-white/5 text-slate-400/40 dark:text-slate-600/40 border-transparent'
          ]"
          @click.stop="handleQuickAction('taskUrl', 'Link da Tarefa', 'url')"
          :data-tip="task.taskUrl ? 'Abrir Link da Tarefa' : 'Clique para cadastrar o Link da Tarefa'"
        >
          <ExternalLink class="w-3 h-3" />
        </button>

        <!-- 5. Ambientes (PRD, HML, DEV) - Escondidos no Mobile para evitar transbordo -->
        <div class="hidden md:flex items-center ml-1" :class="settings.roundedIcons ? 'gap-1' : 'gap-1.5'">
          <div 
            @click.stop="handleQuickAction('prodUrl', 'Merge com Produção', 'url')"
            class="font-black tracking-tighter transition-all flex items-center justify-center border"
            :class="[
              settings.roundedIcons ? 'w-8 h-[26px] rounded-xl text-[7px]' : 'px-1.5 py-1 rounded text-[8px]',
              task.prodUrl 
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/40 cursor-pointer hover:bg-blue-500/20 hover:scale-105 active:scale-95' 
                : 'bg-slate-100 dark:bg-white/5 text-slate-400/30 dark:text-slate-600/30 border-slate-200/50 dark:border-white/5 cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10'
            ]"
            :data-tip="task.prodUrl ? 'Abrir Merge com Produção' : 'Clique para cadastrar o Merge com Produção'"
          >
            PRD
          </div>
          <div 
            @click.stop="handleQuickAction('homologUrl', 'Merge com Homologação', 'url')"
            class="font-black tracking-tighter transition-all flex items-center justify-center border"
            :class="[
              settings.roundedIcons ? 'w-8 h-[26px] rounded-xl text-[7px]' : 'px-1.5 py-1 rounded text-[8px]',
              task.homologUrl 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 cursor-pointer hover:bg-emerald-500/20 hover:scale-105 active:scale-95' 
                : 'bg-slate-100 dark:bg-white/5 text-slate-400/30 dark:text-slate-600/30 border-slate-200/50 dark:border-white/5 cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10'
            ]"
            :data-tip="task.homologUrl ? 'Abrir Merge com Homologação' : 'Clique para cadastrar o Merge com Homologação'"
          >
            HML
          </div>
          <div 
            @click.stop="handleQuickAction('devUrl', 'Merge com Desenvolvimento', 'url')"
            class="font-black tracking-tighter transition-all flex items-center justify-center border"
            :class="[
              settings.roundedIcons ? 'w-8 h-[26px] rounded-xl text-[7px]' : 'px-1.5 py-1 rounded text-[8px]',
              task.devUrl 
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/40 cursor-pointer hover:bg-orange-500/20 hover:scale-105 active:scale-95' 
                : 'bg-slate-100 dark:bg-white/5 text-slate-400/30 dark:text-slate-600/30 border-slate-200/50 dark:border-white/5 cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10'
            ]"
            :data-tip="task.devUrl ? 'Abrir Merge com Desenvolvimento' : 'Clique para cadastrar o Merge com Desenvolvimento'"
          >
            DEV
          </div>
        </div>

        <!-- 6. Contador (Tempo) - Escondido quando rodando ou no mobile -->
        <span v-if="!task.isRunning" class="hidden sm:inline text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none mr-1">{{ formattedTime }}</span>
      </div>
    </div>

    <div v-if="taskStore.selectedTask?.id === task.id" class="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-bounce border border-white/20 dark:border-indigo-400/50">
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  transition: all 0.3s ease;
}
</style>
