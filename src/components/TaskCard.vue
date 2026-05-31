<script setup>
import { computed, ref } from 'vue';
import { Play, Square, MoreVertical, ArrowDown, ArrowRight, ArrowUp, AlertOctagon } from 'lucide-vue-next';
import { formatMsToHMS } from '../utils/time.js';
import { hexToRgba } from '../utils/colors.js';

// Stores
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { useTaskStyleStore } from '../stores/taskStyleStore';
import { notificationService } from '../services/notificationService';

const settings = useSettingsStore();
const taskStore = useTaskStore();
const taskStyleStore = useTaskStyleStore();

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
  // Prioridade 1: Estilo imposto temporariamente pela Coluna (Sobreposição)
  if (props.columnIndex >= 0 && settings.columnStyles && settings.columnStyles[props.columnIndex]) {
    const profileId = settings.columnStyles[props.columnIndex];
    const profile = taskStyleStore.getStyleById(profileId);
    if (profile && profile.styles) return profile.styles;
  }

  // Prioridade 2: Estilo próprio da Tarefa
  if (props.task.styleId) {
    const profile = taskStyleStore.getStyleById(props.task.styleId);
    if (profile && profile.styles) return profile.styles;
  }
  
  // Prioridade 3: Padrão Global
  return settings;
});

const taskColors = computed(() => {
  // Prioridade 1: Estilo imposto temporariamente pela Coluna (Sobreposição)
  if (props.columnIndex >= 0 && settings.columnStyles && settings.columnStyles[props.columnIndex]) {
    const profileId = settings.columnStyles[props.columnIndex];
    const profile = taskStyleStore.getStyleById(profileId);
    if (profile && profile.colors && profile.colors.color) return profile.colors;
  }

  // Prioridade 2: Estilo próprio da Tarefa
  if (props.task.styleId) {
    const profile = taskStyleStore.getStyleById(props.task.styleId);
    if (profile && profile.colors && profile.colors.color) return profile.colors;
  }
  
  // Prioridade 3: Padrão Global (ou fallback de legado)
  return {
    color: props.task.color || null,
    bgColor: props.task.bgColor || '',
    textLightColor: props.task.textLightColor || '',
    textDarkColor: props.task.textDarkColor || ''
  };
});

const emit = defineEmits([
  'toggle-timer',
  'open-time-adjustment'
]);

const formattedTime = computed(() => formatMsToHMS(props.task.totalTimeSpent));

const isSquareLayout = computed(() => {
  return activeStyle.value.taskMinHeight >= 80 || (activeStyle.value.taskMaxWidth > 0 && activeStyle.value.taskMaxWidth <= 280);
});

const currentTextColor = computed(() => {
  // Se não tiver cor definida, cai pro default vazio e o Tailwind reassume
  if (settings.theme === 'dark' && taskColors.value.textDarkColor) return taskColors.value.textDarkColor;
  if (settings.theme !== 'dark' && taskColors.value.textLightColor) return taskColors.value.textLightColor;
  return 'var(--app-text-sub)'; // Cor padrão do texto (text-app-sub)
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

const priorityConfig = computed(() => {
  switch (props.task.priority) {
    case 'Baixa': return { icon: ArrowDown, class: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    case 'Alta': return { icon: ArrowUp, class: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
    case 'Urgente': return { icon: AlertOctagon, class: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    case 'Normal':
    default: return { icon: ArrowRight, class: 'text-slate-400 dark:text-slate-500 bg-slate-500/5 border-slate-500/10 opacity-50' };
  }
});

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
      task.isRunning && !taskColors.color ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : '',
      taskStore.selectedTask?.id === task.id ? `z-[50] ${!taskColors.color ? 'ring-2 ring-indigo-500/50 border-indigo-500' : ''}` : '',
      settings.cardOpacity > 0 ? 'backdrop-blur-xl' : ''
    ]"


    :style="{ 
      backgroundColor: taskStore.selectedTask?.id === task.id 
        ? (settings.cardOpacity > 0 ? (taskColors.color ? hexToRgba(taskColors.color, 0.15) : 'rgba(99, 102, 241, 0.15)') : hexToRgba(taskColors.bgColor, settings.normalizedCardOpacity)) 
        : hexToRgba(taskColors.bgColor, settings.normalizedCardOpacity),
      borderColor: taskStore.selectedTask?.id === task.id && taskColors.color 
        ? taskColors.color 
        : (task.isRunning && taskColors.color ? taskColors.color : ''),
      boxShadow: taskStore.selectedTask?.id === task.id && taskColors.color 
        ? `0 0 0 2px ${taskColors.color}80` 
        : (task.isRunning && taskColors.color ? `0 0 15px ${taskColors.color}33` : ''),
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
            backgroundColor: taskColors.color ? `${taskColors.color}26` : '', 
            color: taskColors.color ? taskColors.color : '',
            borderColor: taskColors.color ? `${taskColors.color}40` : 'transparent',
            fontSize: activeStyle.taskNumberSize + 'px'
          }"
          :class="[
            !taskColors.color ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500/20' : ''
          ]"
          :data-tip="`Copiar número: ${task.title}`"
          @click.stop="copyTaskContent()"
        >
          {{ task.title }}
        </span>
          <span 
            v-if="task.description" 
            class="text-sm flex-1 min-w-0 py-0.5 leading-tight text-justify" 
            :class="[
              task.completed ? 'line-through opacity-60' : '',
              isSquareLayout ? 'line-clamp-6 mt-1 whitespace-pre-wrap' : 'line-clamp-1'
            ]"
            :style="{ 
              fontSize: activeStyle.taskDescriptionSize + 'px', 
              color: currentTextColor 
            }"
            :data-tip="task.description"
          >
            {{ task.description }}
          </span>
      </div>
      
      <div v-if="isSquareLayout" class="w-full h-px opacity-15 bg-current mt-auto mb-3"></div>
      
      <div 
        class="flex items-center shrink-0 flex-row-reverse"
        :class="isSquareLayout ? 'w-full justify-between' : 'ml-auto gap-1.5'"
      >
        <div class="flex items-center gap-1.5 flex-row-reverse">
          <!-- 1. Play/Stop Task (Timer) -->
          <button 
            v-if="!task.completed"
            class="transition-all flex items-center justify-center border rounded-xl" 
            :class="[
              taskColors.color 
                ? 'hover:brightness-110' 
                : (task.isRunning ? 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20')
            ]"
            :style="{
              width: (activeStyle.taskTimerSize * 1.8) + 'px',
              height: (activeStyle.taskTimerSize * 1.8) + 'px',
              backgroundColor: taskColors.color ? `${taskColors.color}1A` : '',
              color: taskColors.color ? taskColors.color : '',
              borderColor: taskColors.color ? `${taskColors.color}33` : ''
            }"
            @click.stop="emit('toggle-timer', task)" 
            data-tip="Iniciar/Parar Cronômetro"
          >
            <Square v-if="task.isRunning" :size="activeStyle.taskTimerSize - 1" class="animate-pulse" />
            <Play v-else :size="activeStyle.taskTimerSize - 1" />
          </button>

          <!-- NEW: Priority Icon -->
          <div 
            class="flex items-center justify-center rounded-lg border transition-all"
            :class="priorityConfig.class"
            :style="{
              width: (activeStyle.taskTimerSize * 1.4) + 'px',
              height: (activeStyle.taskTimerSize * 1.4) + 'px'
            }"
            :data-tip="`Prioridade ${task.priority || 'Normal'}`"
          >
            <component :is="priorityConfig.icon" :size="activeStyle.taskTimerSize - 3" />
          </div>

          <!-- 2. Menu Trigger Icon -->
          <button 
            class="transition-all flex items-center justify-center text-app-muted hover:text-indigo-500 w-[26px] h-[26px]"
            @click.stop="handleSelect($event)"
            data-tip="Opções da Tarefa"
          >
            <MoreVertical class="w-4 h-4" />
          </button>
        </div>

        <!-- Contador (Tempo) -->
        <span 
          class="hidden sm:inline font-bold leading-none mr-1 cursor-pointer transition-colors hover:opacity-80"
          :class="[
            task.isRunning ? 'animate-pulse' : ''
          ]"
          :style="{ 
            fontSize: activeStyle.taskTimerSize + 'px',
            color: task.isRunning ? (taskColors.color || '#ef4444') : currentTextColor
          }"
          data-tip="Clique para ajustar o tempo"
          @click.stop="handleAdjustTime"
        >
          {{ formattedTime }}
        </span>
      </div>
    </div>

    <!-- Selection Indicator Dot -->
    <div 
      v-if="taskStore.selectedTask?.id === task.id" 
      class="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-bounce border border-white/20"
      :class="!taskColors.color ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] dark:border-indigo-400/50' : 'dark:border-white/20'"
      :style="taskColors.color ? {
        backgroundColor: taskColors.color,
        boxShadow: `0 0 10px ${taskColors.color}80`
      } : {}"
    >
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos do card se necessário */
</style>
