<script setup>
import { computed, ref } from 'vue';
import { Play, Square } from 'lucide-vue-next';
import { formatMsToHMS } from '../utils/time.js';

// Stores
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';

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

const formattedTime = computed(() => formatMsToHMS(props.task.totalTimeSpent));

const handleSelect = () => {
  if (taskStore.selectedTask?.id === props.task.id) {
    taskStore.selectedTask = null;
  } else {
    taskStore.selectedTask = props.task;
  }
};
</script>

<template>
  <div 
    class="glass-panel cursor-pointer cursor-grab hover:-translate-y-0.5 group relative hover:z-[100]"
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
            task.isRunning ? 'bg-slate-100 dark:bg-slate-900/50 text-indigo-600 dark:text-indigo-400 border-indigo-500/40 font-mono text-[11px] shadow-sm shadow-indigo-500/10' : ''
          ]"
          :title="task.isRunning ? 'Tempo Decorrido' : task.title"
        >
          {{ task.isRunning ? formattedTime : task.title }}
        </span>
        <span 
          v-if="task.description || task.isRunning" 
          class="text-sm truncate flex-1 min-w-0" 
          :class="task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'"
          :style="{ fontSize: settings.taskDescriptionSize + 'px' }"
          :title="task.isRunning ? `${task.title} - ${task.description}` : task.description"
        >
          <template v-if="task.isRunning">
            <span class="font-bold mr-1" :style="{ color: task.color || 'var(--app-indigo-500)' }">{{ task.title }}</span>
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
              ? 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20 hover:bg-red-500/20' 
              : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
          ]" 
          @click.stop="emit('toggle-timer', task)" 
          data-tip="Iniciar/Parar Cronômetro"
        >
          <Square v-if="task.isRunning" class="w-3.5 h-3.5 animate-pulse" />
          <Play v-else class="w-3.5 h-3.5" />
        </button>

        <!-- Contador (Tempo) - Escondido quando rodando ou no mobile -->
        <span v-if="!task.isRunning" class="hidden sm:inline text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-none mr-1">{{ formattedTime }}</span>
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
