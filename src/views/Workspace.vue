<script setup>
import { ref, watch, onMounted } from 'vue';
import TaskBoard from '../components/TaskBoard.vue';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import ColumnMergeModal from '../components/ColumnMergeModal.vue';
import { notificationService } from '../services/notificationService.js';
import {
  getColumnMergeEnvironment,
  getTaskMergeSourceBranch
} from '../utils/columnMerge.js';

defineProps({
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
const pendingColumnMerge = ref(null);

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
  const movedTask = evt.added?.element || null;

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

  if (movedTask) {
    await requestColumnMerge(movedTask, columnId);
  }
};

const requestColumnMerge = async (task, columnId) => {
  const targetEnvironment = getColumnMergeEnvironment({
    targets: settings.columnMergeTargets,
    provider: settings.gitProvider,
    columnId,
    environments: settings.activeEnvironments
  });

  if (!targetEnvironment) return;

  const sourceBranch = getTaskMergeSourceBranch(task, settings.gitProvider);
  if (!sourceBranch) {
    notificationService.toast(
      `A tarefa '${task.title}' foi movida, mas não possui uma branch vinculada para o merge.`,
      'warning'
    );
    return;
  }

  if (sourceBranch === targetEnvironment.branch) {
    notificationService.toast(
      `A tarefa já aponta para a branch de destino '${targetEnvironment.branch}'.`,
      'info'
    );
    return;
  }

  const confirmed = await notificationService.confirm(
    'Analisar merge da tarefa?',
    `Ao mover '${task.title}' para esta coluna, deseja verificar e mesclar '${sourceBranch}' em '${targetEnvironment.branch}' (${targetEnvironment.alias})?`,
    'Analisar merge',
    'info'
  );

  if (!confirmed) return;

  pendingColumnMerge.value = {
    taskId: task.id,
    sourceBranch,
    targetEnvironment
  };
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

    <ColumnMergeModal
      v-if="pendingColumnMerge"
      :key="`${pendingColumnMerge.taskId}-${pendingColumnMerge.targetEnvironment.id}`"
      :source-branch="pendingColumnMerge.sourceBranch"
      :target-environment="pendingColumnMerge.targetEnvironment"
      @close="pendingColumnMerge = null"
    />
  </div>
</template>
