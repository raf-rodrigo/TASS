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
  
  // Prioridade 3: Padrão Global
  return {
    color: null,
    bgColor: '',
    textLightColor: '',
    textDarkColor: ''
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
    // Pequeno delay para garantir que o componente de menu seja remontado na nova posição
    setTimeout(() => {
      taskStore.selectedTask = props.task;
    }, 10);
  }
};

// =========================================================================
// COMPUTED PROPERTIES SEMÂNTICAS (Evitando Síndrome do Gênio)
// =========================================================================

/**
 * Calcula os estilos dinâmicos do cartão (Cor de fundo, Borda e Sombra)
 * Levando em conta se a tarefa está selecionada, se está rodando ou se tem cor customizada.
 */
const cardDynamicStyles = computed(() => {
  const isSelected = taskStore.selectedTask?.id === props.task.id;
  const isRunning = props.task.isRunning;
  const hasCustomColor = !!taskColors.value.color;
  const customColor = taskColors.value.color;
  const baseBgColor = taskColors.value.bgColor;
  const opacity = settings.normalizedCardOpacity;
  const isGlassActive = opacity < 1.0;

  // 1. Calculando o Background
  let bgColor = hexToRgba(baseBgColor, opacity); // Fundo padrão

  if (isSelected) {
    if (isGlassActive) {
      // Quando o vidro está ativo, a seleção fica translúcida
      bgColor = hasCustomColor ? hexToRgba(customColor, 0.15) : 'rgba(99, 102, 241, 0.15)';
    } else {
      // Quando vidro está desligado, seleção mantém a cor sólida
      bgColor = hexToRgba(baseBgColor, opacity);
    }
  }

  // 2. Calculando a Borda
  let borderColor = '';
  if (isSelected && hasCustomColor) {
    borderColor = customColor;
  } else if (isRunning && hasCustomColor) {
    borderColor = customColor;
  }

  // 3. Calculando a Sombra
  let boxShadow = '';
  if (isSelected && hasCustomColor) {
    boxShadow = `0 0 0 2px ${customColor}80`;
  } else if (isRunning && hasCustomColor) {
    boxShadow = `0 0 15px ${customColor}33`;
  }

  return {
    backgroundColor: bgColor,
    borderColor: borderColor,
    boxShadow: boxShadow,
    minHeight: activeStyle.value.taskMinHeight > 40 ? activeStyle.value.taskMinHeight + 'px' : 'auto',
    maxWidth: activeStyle.value.taskMaxWidth > 0 ? activeStyle.value.taskMaxWidth + 'px' : 'none',
    width: activeStyle.value.taskMaxWidth > 0 ? '100%' : 'auto',
    margin: activeStyle.value.taskMaxWidth > 0 ? '0 auto' : '',
    justifyContent: activeStyle.value.taskVerticalAlign === 'center' ? 'center' : 
                    activeStyle.value.taskVerticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
    padding: `${activeStyle.value.cardPadding || 16}px`
  };
});

/**
 * Classes descritivas para o botão de Play/Stop
 */
const timerButtonClasses = computed(() => {
  if (taskColors.value.color) {
    // Se a tarefa tem uma cor customizada, apenas aplicamos o brilho no hover
    return 'hover:brightness-110';
  }
  
  if (props.task.isRunning) {
    // Estado ativo rodando (Vermelho alerta)
    return 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20 hover:bg-red-500/20';
  }
  
  // Estado padrão parado (Azul/Índigo calmante)
  return 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20';
});
</script>

<template>
  <div 
    class="glass-panel cursor-pointer cursor-grab hover:-translate-y-0.5 group relative hover:z-[100] flex flex-col"
    :class="[
      task.isRunning && !taskColors.color ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : '',
      taskStore.selectedTask?.id === task.id ? `z-[50] ${!taskColors.color ? 'ring-2 ring-indigo-500/50 border-indigo-500' : ''}` : ''
    ]"


    :style="cardDynamicStyles"
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
      
      <div 
        class="flex items-center shrink-0 flex-row-reverse"
        :class="isSquareLayout ? 'w-full justify-between mt-auto pt-3 border-t border-slate-500/10' : 'ml-auto'"
        :style="!isSquareLayout ? { gap: (activeStyle.taskTimerSize * 0.4) + 'px' } : {}"
      >
        <div 
          class="flex items-center flex-row-reverse"
          :style="{ gap: (activeStyle.taskTimerSize * 0.4) + 'px' }"
        >
          <!-- 1. Play/Stop Task (Timer) -->
          <button 
            v-if="!task.completed"
            class="transition-all flex items-center justify-center border" 
            :class="timerButtonClasses"
            :style="{
              width: (activeStyle.taskTimerSize * 1.8) + 'px',
              height: (activeStyle.taskTimerSize * 1.8) + 'px',
              borderRadius: (activeStyle.taskTimerSize * 0.4) + 'px',
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

          <!-- 2. Menu Trigger Icon -->
          <button 
            class="transition-all flex items-center justify-center text-app-muted hover:text-indigo-500 hover:bg-slate-500/10"
            :style="{
              width: (activeStyle.taskTimerSize * 1.8) + 'px',
              height: (activeStyle.taskTimerSize * 1.8) + 'px',
              borderRadius: (activeStyle.taskTimerSize * 0.4) + 'px'
            }"
            @click.stop="handleSelect($event)"
            data-tip="Opções da Tarefa"
          >
            <MoreVertical :size="activeStyle.taskTimerSize" />
          </button>
        </div>

        <!-- Contador (Tempo) -->
        <span 
          class="hidden sm:inline font-bold leading-none cursor-pointer transition-colors hover:opacity-80"
          :class="[
            task.isRunning ? 'animate-pulse' : ''
          ]"
          :style="{ 
            fontSize: activeStyle.taskTimerSize + 'px',
            color: task.isRunning ? (taskColors.color || '#ef4444') : currentTextColor,
            marginRight: (activeStyle.taskTimerSize * 0.2) + 'px'
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
