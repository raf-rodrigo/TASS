<script setup>
import { computed, ref } from 'vue';
import { Play, Square, MoreVertical } from 'lucide-vue-next';
import { formatMsToHMS } from '../utils/time.js';
import { hexToRgba } from '../utils/colors.js';

// Stores
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { notificationService } from '../services/notificationService';

const settings = useSettingsStore();
const taskStore = useTaskStore();

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  columnIndex: {
    type: Number,
    default: -1
  }
});

const activeStyle = computed(() => {
  if (props.columnIndex >= 0 && settings.columnStyles && settings.columnStyles[props.columnIndex]) {
    const profileId = settings.columnStyles[props.columnIndex];
    const profile = settings.taskStyleProfiles?.find(p => p.id === profileId);
    if (profile && profile.styles) return profile.styles;
  }
  return settings;
});

const emit = defineEmits([
  'toggle-timer',
  'open-time-adjustment'
]);

const formattedTime = computed(() => formatMsToHMS(props.task.totalTimeSpent));

const isSquareLayout = computed(() => {
  return activeStyle.value.taskMinHeight >= 80 || (activeStyle.value.taskMaxWidth > 0 && activeStyle.value.taskMaxWidth <= 280);
});

const handleAdjustTime = (event) => {
  if (event) {
    taskStore.contextMenuPosition = { 
      x: event.clientX, 
      y: event.clientY 
    };
  } else {
    // Fallback centralizado se disparado sem evento direto
    taskStore.contextMenuPosition = { 
      x: window.innerWidth / 2, 
      y: window.innerHeight / 2 
    };
  }
  emit('open-time-adjustment', props.task);
};

const copyTaskContent = async () => {
  try {
    const content = props.task.title;
    
    await navigator.clipboard.writeText(content);
    notificationService.toast('Número copiado!', 'success');
  } catch (err) {
    console.error('Falha ao copiar:', err);
    notificationService.toast('Erro ao copiar', 'error');
  }
};

const handleSelect = (event) => {
  const isCurrentlySelected = taskStore.selectedTask?.id === props.task.id;
  
  if (isCurrentlySelected) {
    taskStore.selectedTask = null;
  } else {
    // Primeiro limpamos a seleção atual para forçar o fechamento do menu anterior
    taskStore.selectedTask = null;
    
    // Captura a nova posição do mouse imediatamente
    taskStore.contextMenuPosition = { 
      x: event.clientX, 
      y: event.clientY 
    };
    
    // Pequeno delay para garantir que o componente de menu seja remontado na nova posição
    setTimeout(() => {
      taskStore.selectedTask = props.task;
    }, 10);
  }
};
</script>

<template>
  <div 
    class="glass-panel cursor-pointer cursor-grab hover:-translate-y-0.5 group relative hover:z-[100] flex flex-col"
    :class="[
      task.isRunning ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : '',
      taskStore.selectedTask?.id === task.id ? 'ring-2 ring-indigo-500/50 border-indigo-500 z-[50]' : '',
      settings.cardOpacity > 0 ? 'backdrop-blur-xl' : ''
    ]"


    :style="{ 
      backgroundColor: taskStore.selectedTask?.id === task.id 
        ? (settings.cardOpacity > 0 ? 'rgba(99, 102, 241, 0.15)' : '') 
        : hexToRgba(task.bgColor, settings.normalizedCardOpacity),
      minHeight: activeStyle.taskMinHeight > 40 ? activeStyle.taskMinHeight + 'px' : 'auto',
      maxWidth: activeStyle.taskMaxWidth > 0 ? activeStyle.taskMaxWidth + 'px' : 'none',
      width: activeStyle.taskMaxWidth > 0 ? '100%' : 'auto',
      margin: activeStyle.taskMaxWidth > 0 ? '0 auto' : '',
      padding: activeStyle.cardPadding ? activeStyle.cardPadding + 'px' : ''
    }"
    @click.stop="handleSelect($event)"
    @contextmenu.prevent="handleSelect($event)"
  >

    <div 
      :class="[
        task.completed ? 'opacity-50' : '',
        isSquareLayout ? 'flex-col items-start h-full flex-1 w-full gap-3' : 'items-center gap-2 w-full'
      ]" 
      class="flex justify-between transition-opacity"
    >
      <div 
        class="flex flex-1 min-w-0 overflow-hidden w-full"
        :class="isSquareLayout ? 'flex-col items-start gap-2' : 'items-center gap-2'"
      >
        <span 
          class="font-bold px-2 py-1 rounded-lg leading-tight flex-shrink-0 transition-all border flex items-center justify-center gap-2 mr-2 min-w-[85px] active:scale-95" 
          :style="{ 
            backgroundColor: task.color ? `${task.color}26` : '', 
            color: task.color ? task.color : '',
            borderColor: task.color ? `${task.color}40` : 'transparent',
            fontSize: activeStyle.taskNumberSize + 'px'
          }"
          :class="[
            !task.color ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500/20' : ''
          ]"
          :data-tip="`Copiar número: ${task.title}`"
          @click.stop="copyTaskContent()"
        >
          {{ task.title }}
        </span>
          <span 
            v-if="task.description" 
            class="text-sm flex-1 min-w-0 py-0.5 leading-tight" 
            :class="[
              task.completed ? 'line-through text-app-muted' : 'text-app-sub',
              isSquareLayout ? 'line-clamp-6 mt-1 whitespace-pre-wrap' : 'line-clamp-1'
            ]"
            :style="{ fontSize: activeStyle.taskDescriptionSize + 'px' }"
            :data-tip="task.description"
          >
            {{ task.description }}
          </span>
      </div>
      <div 
        class="flex items-center gap-1.5 shrink-0 flex-row-reverse"
        :class="isSquareLayout ? 'w-full justify-between mt-auto pt-3 border-t border-slate-100 dark:border-white/5' : 'ml-auto'"
      >
        <!-- 1. Play/Stop Task (Timer) -->
        <button 
          v-if="!task.completed"
          class="transition-all flex items-center justify-center border rounded-xl" 
          :class="[
            task.color 
              ? 'hover:brightness-110' 
              : (task.isRunning ? 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20')
          ]"
          :style="{
            width: (activeStyle.taskTimerSize * 1.8) + 'px',
            height: (activeStyle.taskTimerSize * 1.8) + 'px',
            backgroundColor: task.color ? `${task.color}1A` : '',
            color: task.color ? task.color : '',
            borderColor: task.color ? `${task.color}33` : ''
          }"
          @click.stop="emit('toggle-timer', task)" 
          data-tip="Iniciar/Parar Cronômetro"
        >
          <Square v-if="task.isRunning" :size="activeStyle.taskTimerSize - 1" class="animate-pulse" />
          <Play v-else :size="activeStyle.taskTimerSize - 1" />
        </button>

        <!-- 2. Menu Trigger Icon -->
        <button 
          class="transition-all flex items-center justify-center text-app-muted hover:text-indigo-500 w-[26px] h-[26px]"
          @click.stop="handleSelect($event)"
          data-tip="Opções da Tarefa"
        >
          <MoreVertical class="w-4 h-4" />
        </button>

        <!-- Contador (Tempo) -->
        <span 
          class="hidden sm:inline font-bold leading-none mr-1 cursor-pointer transition-colors"
          :class="[
            task.isRunning ? 'animate-pulse' : 'text-app-sub hover:text-indigo-500'
          ]"
          :style="{ 
            fontSize: activeStyle.taskTimerSize + 'px',
            color: task.isRunning ? (task.color || '#ef4444') : ''
          }"
          data-tip="Clique para ajustar o tempo"
          @click.stop="handleAdjustTime"
        >
          {{ formattedTime }}
        </span>
      </div>
    </div>

    <!-- Indicador de Seleção -->
    <div v-if="taskStore.selectedTask?.id === task.id" class="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-bounce border border-white/20 dark:border-indigo-400/50">
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos do card se necessário */
</style>
