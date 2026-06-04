<script setup>
import { ref, computed } from 'vue';
import draggable from 'vuedraggable';
import TaskCard from './TaskCard.vue';
import { Plus } from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { useTimerStore } from '../stores/timerStore';
import { useUIStore } from '../stores/uiStore';
import { useTaskStyleStore } from '../stores/taskStyleStore';

const settings = useSettingsStore();
const taskStore = useTaskStore();
const timerStore = useTimerStore();
const uiStore = useUIStore();

const props = defineProps({
  boardColumns: {
    type: Array,
    required: true
  },
  isDraggingTask: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update-board',
  'drag-start',
  'drag-end'
]);

const handleBoardChange = (evt, colIdx) => {
  emit('update-board', evt, colIdx);
};

/**
 * Estilos dinâmicos do placeholder de coluna vazia.
 * Respeita a opacidade do painel e a Chave Mestra global do efeito de vidro.
 */
const placeholderStyles = computed(() => {
  const isGlassActive = settings.normalizedCardOpacity < 1.0;
  
  return {
    borderColor: `rgba(var(--app-bg-raw), 0.1)`,
    backgroundColor: isGlassActive ? `rgba(var(--app-bg-raw), 0.05)` : 'transparent',
    backdropFilter: isGlassActive ? 'blur(var(--app-glass-blur))' : 'none'
  };
});
</script>

<template>
  <section 
    class="flex flex-nowrap lg:grid gap-6 w-full items-stretch overflow-x-auto lg:overflow-x-visible pb-8 lg:pb-0 snap-x snap-mandatory custom-scrollbar min-h-[50vh]" 
    :class="{
      'lg:grid-cols-1': settings.columns === 1 || !settings.columns,
      'lg:grid-cols-2': settings.columns === 2,
      'lg:grid-cols-3': settings.columns === 3,
      'lg:grid-cols-4': settings.columns === 4,
      'lg:grid-cols-5': settings.columns === 5,
      'lg:grid-cols-6': settings.columns === 6
    }"
  >
    <div 
      v-for="colIdx in settings.columns" 
      :key="colIdx" 
      class="flex flex-col gap-4 min-h-[500px] relative flex-shrink-0 lg:flex-shrink snap-center lg:snap-align-none w-[90vw] md:w-[45vw] lg:w-full first:ml-[5vw] last:mr-[5vw] lg:first:ml-0 lg:last:mr-0 pb-10"
    >
      <!-- Cabeçalho da Coluna -->
      <div 
        v-if="settings.columnTitles[colIdx-1]" 
        class="flex items-center justify-center mb-1 px-1"
      >
        <div 
          class="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)] mr-2"
        ></div>
        <h3 class="text-[10px] font-black text-app-sub uppercase tracking-[0.2em] truncate">
          {{ settings.columnTitles[colIdx-1] }}
        </h3>
        <span class="ml-2 text-[9px] font-black text-indigo-500/50">
          {{ boardColumns[colIdx-1]?.length || 0 }}
        </span>
      </div>

      <!-- Área de Conteúdo da Coluna (Placeholder + Draggable) -->
      <div class="flex-1 relative flex flex-col">
        <div 
          v-if="(settings.showEmptyPlaceholders || isDraggingTask) && boardColumns[colIdx-1]?.length === 0" 
          class="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div 
            class="w-full h-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl text-app-muted/30 transition-all"
            :style="placeholderStyles"
          >
            <Plus class="w-10 h-10 mb-4 opacity-20" />
            <span class="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 text-center px-8">
              Arraste para cá
            </span>
          </div>
        </div>

        <!-- Área de Arrastar da Coluna -->
        <draggable 
          :list="boardColumns[colIdx-1]" 
          item-key="id" 
          group="tasks"
          class="flex flex-col gap-4 flex-1 relative z-10 min-h-[150px]"
          ghost-class="app-ghost-effect" 
          drag-class="app-drag-effect" 
          :force-fallback="true"
          :fallback-on-body="true"
          animation="400" 
          @start="emit('drag-start')"
          @end="emit('drag-end')"
          @change="(evt) => handleBoardChange(evt, colIdx)"
        >
          <template #item="{ element: task }">
            <TaskCard 
              :task="task" 
              :columnIndex="colIdx - 1"
              @toggle-completion="taskStore.toggleTaskCompletion" 
              @delete-task="taskStore.deleteTask" 
              @edit-task="uiStore.openTaskModal" 
              @toggle-timer="timerStore.toggleTimer" 
              @open-time-adjustment="uiStore.openTimeAdjustment"
            />
          </template>
        </draggable>
      </div>
    </div>
  </section>
</template>
