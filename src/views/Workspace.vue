<script setup>
import { ref, watch, onMounted } from 'vue';
import TaskBoard from '../components/TaskBoard.vue';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import { notificationService } from '../services/notificationService';

const props = defineProps({
  isDraggingTask: Boolean
});

const emit = defineEmits([
  'edit-task', 
  'open-time-adjustment', 
  'drag-start', 
  'drag-end',
  'toggle-completion'
]);

const taskStore = useTaskStore();
const settings = useSettingsStore();

// Board State Proxy
const boardColumns = ref([[], [], [], [], [], []]);

const syncBoardWithStore = () => {
  const newCols = [[], [], [], [], [], []];
  for (let i = 1; i <= 6; i++) {
    newCols[i-1] = taskStore.filteredTasks
      .filter(t => t.columnId === i)
      .sort((a, b) => a.position - b.position);
  }
  boardColumns.value = newCols;
};

// Sincroniza o board local quando as tarefas ou filtros mudam
watch(
  [() => taskStore.filteredTasks, () => taskStore.statusFilter, () => settings.activeSprintId], 
  () => {
    syncBoardWithStore();
  }, 
  { deep: true, immediate: true }
);

const handleBoardChange = async (evt, columnId) => {
  if (evt.added) {
    evt.added.element.columnId = columnId;
  }
  
  const allOrderedTasks = [];
  boardColumns.value.forEach((col, colIdx) => {
    const targetColumnId = colIdx + 1;
    col.forEach((task) => {
      task.columnId = targetColumnId;
      allOrderedTasks.push(task);
    });
  });

  await taskStore.updateAllPositions(allOrderedTasks);
};

const deleteTask = async (id) => {
  await taskStore.deleteTask(id);
};

const toggleTaskCompletion = (task) => emit('toggle-completion', task);

onMounted(() => {
  syncBoardWithStore();
});
</script>

<template>
  <div class="w-full flex-1 flex flex-col">
    <TaskBoard 
      :boardColumns="boardColumns"
      :isDraggingTask="isDraggingTask"
      @update-board="handleBoardChange"
      @edit-task="(task) => emit('edit-task', task)"
      @toggle-completion="toggleTaskCompletion"
      @delete-task="deleteTask"
      @drag-start="() => emit('drag-start')"
      @drag-end="() => emit('drag-end')"
      @open-time-adjustment="(task) => emit('open-time-adjustment', task)"
    />
  </div>
</template>
