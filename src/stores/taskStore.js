import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { db } from '../db.js';
import { notificationService } from '../services/notificationService';
import { useSettingsStore } from './settingsStore';
import { useSprintStore } from './sprintStore';
import { useTimerStore } from './timerStore';
import { calculateWorkingTime, distributeDailyLogs } from '../utils/time.js';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref([]);
  const statusFilter = ref(localStorage.getItem('tass-status-filter') || 'active');
  const isLoading = ref(false);

  watch(statusFilter, (newVal) => {
    localStorage.setItem('tass-status-filter', newVal);
  });
  const selectedTask = ref(null);
  const hoveredTask = ref(null);
  const contextMenuPosition = ref({ x: 0, y: 0 });
  const lastDeletedTask = ref(null);

  const filteredTasks = computed(() => {
    const settings = useSettingsStore();
    let result = [...tasks.value];
    
    if (settings.activeSprintId !== 'all') {
      const id = parseInt(settings.activeSprintId);
      result = result.filter(t => t.sprintId === id);
    }

    if (statusFilter.value === 'active') {
      result = result.filter(t => !t.completed);
    } else if (statusFilter.value === 'completed') {
      result = result.filter(t => t.completed);
    }
    
    return result;
  });

  const boardColumns = computed({
    get: () => {
      const settings = useSettingsStore();
      const cols = [];
      for (let i = 1; i <= settings.columns; i++) {
        cols.push(
          filteredTasks.value
            .filter(t => t.columnId === i)
            .sort((a, b) => a.position - b.position)
        );
      }
      return cols;
    },
    set: () => {}
  });

  const selectedUserIdFilter = ref(null);

  const loadTasks = async (userIdFilter = undefined) => {
    isLoading.value = true;
    try {
      const filterVal = userIdFilter !== undefined ? userIdFilter : selectedUserIdFilter.value;
      let dbTasks = await db.tasks.toArray(filterVal);
      
      const runningTask = dbTasks.find(t => t.isRunning);
      if (runningTask) {
        const settings = useSettingsStore();
        const now = Date.now();
        const diff = calculateWorkingTime(runningTask.lastStartTime, now, settings);
        
        runningTask.totalTimeSpent = (runningTask.totalTimeSpent || 0) + diff;
        runningTask.totalWorked = (runningTask.totalWorked || 0) + diff;
        
        distributeDailyLogs(runningTask, runningTask.lastStartTime, now, settings);
        
        runningTask.lastStartTime = now;
        await db.tasks.update(runningTask.id, { 
          totalTimeSpent: runningTask.totalTimeSpent,
          totalWorked: runningTask.totalWorked,
          dailyLogs: runningTask.dailyLogs,
          lastStartTime: runningTask.lastStartTime 
        });
      }
      
      dbTasks.sort((a, b) => a.position - b.position);
      tasks.value = dbTasks;
    } catch (error) {
      console.error("Failed to load tasks:", error);
      notificationService.toast("Erro ao carregar as tarefas do banco de dados.", "error");
    } finally {
      isLoading.value = false;
    }
  };

  watch(selectedUserIdFilter, async (newVal) => {
    await loadTasks(newVal);
    // Sincroniza também as sprints no sprintStore
    const sprintStore = useSprintStore();
    await sprintStore.loadSprints(newVal);
  });

  const addTask = async (taskData) => {
    const targetColumn = 1;
    const updates = [];
    tasks.value.forEach(t => {
      t.position += 1;
      updates.push(db.tasks.update(t.id, { position: t.position }));
    });
    await Promise.all(updates);

    const taskToAdd = {
      ...taskData,
      position: 1,
      columnId: targetColumn,
      completed: false,
      totalTimeSpent: 0,
      totalWorked: 0,
      dailyLogs: {},
      isRunning: false,
      lastStartTime: null,
      createdAt: Date.now()
    };

    try {
      const id = await db.tasks.add(taskToAdd);
      taskToAdd.id = id;
      tasks.value.unshift(taskToAdd);
      return id;
    } catch (error) {
      console.error("Failed to add task:", error);
      notificationService.toast("Erro ao criar a tarefa no banco de dados.", "error");
      throw error;
    }
  };

  const toggleTaskCompletion = async (task) => {
    try {
      const newStatus = !task.completed;
      if (newStatus && task.isRunning) {
        const timerStore = useTimerStore();
        await timerStore.toggleTimer(task);
      }
      await updateTask(task.id, { completed: newStatus });
    } catch (error) {
      console.error("Failed to update task completion:", error);
      notificationService.toast("Erro ao alterar o estado de conclusão da tarefa.", "error");
    }
  };

  const updateTask = async (id, updates) => {
    try {
      // Remover os Proxies do Vue para evitar DataCloneError no IndexedDB
      const cleanUpdates = JSON.parse(JSON.stringify(updates));
      await db.tasks.update(id, cleanUpdates);
      
      const index = tasks.value.findIndex(t => t.id === id);
      if (index !== -1) {
        const updatedTask = { ...tasks.value[index], ...updates };
        tasks.value[index] = updatedTask;
        
        if (selectedTask.value && selectedTask.value.id === id) {
          selectedTask.value = updatedTask;
        }
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      notificationService.toast("Erro ao salvar atualizações da tarefa no banco de dados.", "error");
      throw error;
    }
  };

  const deleteTask = async (id) => {
    try {
      const taskToDelete = tasks.value.find(t => t.id === id);
      if (!taskToDelete) return;
      lastDeletedTask.value = { ...taskToDelete };
      await db.tasks.delete(id);
      
      const updates = [];
      tasks.value.forEach(t => {
        if (t.position > taskToDelete.position) {
          t.position -= 1;
          updates.push(db.tasks.update(t.id, { position: t.position }));
        }
      });
      await Promise.all(updates);
      tasks.value = tasks.value.filter(t => t.id !== id);
    } catch (error) {
      console.error("Failed to delete task:", error);
      notificationService.toast("Erro ao remover a tarefa do banco de dados.", "error");
    }
  };

  const restoreTask = async () => {
    if (!lastDeletedTask.value) return;
    try {
      const taskToRestore = { ...lastDeletedTask.value };
      const updates = [];
      tasks.value.forEach(t => {
        if (t.position >= taskToRestore.position) {
          t.position += 1;
          updates.push(db.tasks.update(t.id, { position: t.position }));
        }
      });
      await Promise.all(updates);
      
      // Sanitiza a tarefa para remover Proxies do Vue antes de salvar no IndexedDB
      const cleanTask = JSON.parse(JSON.stringify(taskToRestore));
      delete cleanTask.id;
      
      const newId = await db.tasks.add(cleanTask);
      taskToRestore.id = newId;
      
      tasks.value.push(taskToRestore);
      tasks.value.sort((a, b) => a.position - b.position);
      lastDeletedTask.value = null;
    } catch (error) {
      console.error("Failed to restore task:", error);
      notificationService.toast("Erro ao restaurar a tarefa deletada.", "error");
    }
  };

  const cloneTask = async (taskToClone) => {
    try {
      const { id, branchUrl, branchName, githubBranchUrl, githubBranchName, ...rest } = taskToClone;
      const newTaskData = {
        ...rest,
        title: `${taskToClone.title} (Cópia)`
      };
      await addTask(newTaskData);
    } catch (error) {
      console.error("Failed to clone task:", error);
      notificationService.toast("Erro ao clonar a tarefa.", "error");
    }
  };

  const migrateOrphanTasks = async (maxColumns) => {
    const orphans = tasks.value.filter(t => t.columnId > maxColumns);
    if (orphans.length === 0) return;

    const updates = [];
    orphans.forEach(t => {
      t.columnId = 1;
      updates.push(db.tasks.update(t.id, { columnId: 1 }));
    });
    await Promise.all(updates);
    notificationService.toast(`${orphans.length} tarefas órfãs movidas para a Coluna 1`);
  };

  const updateAllPositions = async (allTasksOrdered) => {
    try {
      const updates = allTasksOrdered.map((task, index) => {
        const newPos = index + 1;
        task.position = newPos;
        return db.tasks.update(task.id, { 
          position: newPos, 
          columnId: task.columnId 
        });
      });
      
      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (error) {
      console.error("Failed to update task positions:", error);
      notificationService.toast("Erro ao salvar nova posição das tarefas no banco de dados.", "error");
    }
  };

  const resetSystem = async () => {
    try {
      await db.tasks.clear();
      await db.sprints.clear();
      await db.notes.clear();
      
      tasks.value = [];
      lastDeletedTask.value = null;
      selectedTask.value = null;
      
      const sprintStore = useSprintStore();
      sprintStore.sprints = [];
      
      return true;
    } catch (error) {
      console.error("Failed to reset system:", error);
      notificationService.toast("Erro ao limpar dados do sistema no banco de dados.", "error");
      return false;
    }
  };

  return {
    tasks, isLoading, selectedTask, hoveredTask, contextMenuPosition,
    statusFilter, filteredTasks, boardColumns, lastDeletedTask, selectedUserIdFilter,
    loadTasks, addTask, updateTask, deleteTask, restoreTask, cloneTask,
    toggleTaskCompletion, migrateOrphanTasks, updateAllPositions, resetSystem
  };
});
