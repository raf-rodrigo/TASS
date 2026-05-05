<script setup>
import { ref } from 'vue';
import draggable from 'vuedraggable';
import TaskCard from './TaskCard.vue';
import { Plus } from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';

const settings = useSettingsStore();
const taskStore = useTaskStore();

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
  'edit-task',
  'toggle-completion',
  'delete-task',
  'drag-start',
  'drag-end'
]);

const handleBoardChange = (evt, colIdx) => {
  emit('update-board', evt, colIdx);
};
</script>

<template>
  <section 
    class="grid gap-4 w-full items-start" 
    :class="{
      'grid-cols-1': settings.columns === 1 || !settings.columns,
      'grid-cols-1 md:grid-cols-2': settings.columns === 2,
      'grid-cols-1 lg:grid-cols-3': settings.columns === 3,
      'grid-cols-1 lg:grid-cols-4': settings.columns === 4
    }"
  >
    <div v-for="colIdx in settings.columns" :key="colIdx" class="flex flex-col gap-4 min-h-[150px] md:min-h-[500px] relative min-w-0 w-full">
      <!-- Cabeçalho da Coluna -->
      <div 
        v-if="settings.columnTitles[colIdx-1]" 
        class="flex items-center gap-2 px-3 py-2 rounded-2xl border mb-2 group transition-all hover:brightness-110"
        :style="{ 
          backgroundColor: `rgba(var(--app-bg-raw), var(--app-card-opacity))`,
          borderColor: settings.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          backdropFilter: settings.cardOpacity < 100 ? 'blur(8px)' : 'none'
        }"
      >
        <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
        <h3 class="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest truncate">
          {{ settings.columnTitles[colIdx-1] }}
        </h3>
        <span class="ml-auto text-[9px] font-bold text-slate-400 opacity-50">
          {{ boardColumns[colIdx-1]?.length || 0 }}
        </span>
      </div>

      <!-- Placeholders vazios -->
      <div 
        v-if="(settings.showEmptyPlaceholders || isDraggingTask) && boardColumns[colIdx-1]?.length === 0" 
        class="absolute inset-0 flex items-center justify-center p-2 pt-14 pointer-events-none"
      >
        <div 
          class="w-full h-full flex flex-col items-center justify-center border-2 border-dashed rounded-[2.5rem] text-slate-400 transition-all"
          :style="{ 
            borderColor: `rgba(var(--app-bg-raw), 0.1)`,
            backgroundColor: settings.cardOpacity < 100 ? `rgba(var(--app-bg-raw), 0.05)` : 'transparent',
            backdropFilter: settings.cardOpacity < 100 ? 'blur(4px)' : 'none'
          }"
        >
          <Plus class="w-10 h-10 mb-4 opacity-20" />
          <span class="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 text-center px-8">
            Arraste para cá
          </span>
        </div>
      </div>

      <!-- Área de Arrastar da Coluna -->
      <draggable 
        v-model="boardColumns[colIdx-1]" 
        item-key="id" 
        group="tasks"
        class="flex flex-col gap-4 flex-1 relative z-10"
        :class="{ 'justify-center': boardColumns[colIdx-1]?.length === 0 }"
        ghost-class="tass-ghost-effect" 
        drag-class="tass-drag-effect" 
        animation="400" 
        handle=".cursor-grab"
        @start="emit('drag-start')"
        @end="emit('drag-end')"
        @change="(evt) => handleBoardChange(evt, colIdx)"
      >
        <template #item="{ element: task }">
          <TaskCard 
            :task="task" 
            @toggle-completion="(t) => emit('toggle-completion', t)" 
            @delete-task="(id) => emit('delete-task', id)" 
            @edit-task="(t) => emit('edit-task', t)" 
            @toggle-timer="taskStore.toggleTimer" 
          />
        </template>
      </draggable>
    </div>
  </section>
</template>
