import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db.js';
import { notificationService } from '../services/notificationService';
import { useSettingsStore } from './settingsStore';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref([]);
  const sprints = ref([]);
  const filter = ref('all');
  const isLoading = ref(false);
  const selectedTask = ref(null);

  const activeTask = computed(() => tasks.value.find(t => t.isRunning));

  const loadTasks = async () => {
    isLoading.value = true;
    try {
      let dbTasks = await db.tasks.toArray();
      
      // Migration for position if needed
      const needsMigration = dbTasks.some(t => typeof t.position !== 'number');
      if (needsMigration) {
        dbTasks.sort((a, b) => b.createdAt - a.createdAt);
        const updates = [];
        dbTasks.forEach((t, index) => {
          t.position = index + 1;
          updates.push(db.tasks.update(t.id, { position: t.position }));
        });
        await Promise.all(updates);
      }
      
      // Sync running task time (Safety check for system shutdown/sleep)
      const now = Date.now();
      const settings = useSettingsStore();
      const runningTask = dbTasks.find(t => t.isRunning);
      if (runningTask && runningTask.lastStartTime) {
        const timePassed = now - runningTask.lastStartTime;
        
        // Se o tempo passado for maior que 1 minuto e a configuração de inatividade estiver DESATIVADA
        if (timePassed > 60000 && !settings.trackInactivity) { 
          runningTask.isRunning = false;
          runningTask.lastStartTime = null;
          await db.tasks.update(runningTask.id, { 
            isRunning: false,
            lastStartTime: null
          });
          console.log(`[Timer] Auto-pause ativado: Detectado salto de tempo de ${Math.round(timePassed/60000)}min.`);
        } else {
          // Se estiver ATIVADO ou for um tempo curto, somamos normalmente.
          runningTask.totalTimeSpent += timePassed;
          runningTask.lastStartTime = now;
          await db.tasks.update(runningTask.id, { 
            totalTimeSpent: runningTask.totalTimeSpent,
            lastStartTime: runningTask.lastStartTime
          });
        }
      }
      
      dbTasks.sort((a, b) => a.position - b.position);
      tasks.value = dbTasks;
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      isLoading.value = false;
    }
  };

  const loadSprints = async () => {
    try {
      sprints.value = await db.sprints.toArray();
    } catch (error) {
      console.error("Failed to load sprints:", error);
    }
  };

  const addTask = async (taskData) => {
    const updates = [];
    tasks.value.forEach(t => {
      t.position += 1;
      updates.push(db.tasks.update(t.id, { position: t.position }));
    });
    await Promise.all(updates);

    const taskToAdd = {
      ...taskData,
      position: 1,
      completed: false,
      totalTimeSpent: 0,
      isRunning: false,
      lastStartTime: null,
      createdAt: Date.now()
    };

    try {
      const id = await db.tasks.add(taskToAdd);
      taskToAdd.id = id;
      tasks.value.unshift(taskToAdd);
      notificationService.toast('Tarefa adicionada!');
      return id;
    } catch (error) {
      console.error("Failed to add task:", error);
      throw error;
    }
  };

  const updateTask = async (id, updates) => {
    try {
      await db.tasks.update(id, updates);
      const index = tasks.value.findIndex(t => t.id === id);
      if (index !== -1) {
        Object.assign(tasks.value[index], updates);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error;
    }
  };

  const lastDeletedTask = ref(null);

  const deleteTask = async (id) => {
    try {
      const taskToDelete = tasks.value.find(t => t.id === id);
      if (!taskToDelete) return;
      
      // Backup da tarefa antes de excluir
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
      
      notificationService.toast('Tarefa excluída');

    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const restoreTask = async () => {
    if (!lastDeletedTask.value) return;
    
    try {
      const taskToRestore = { ...lastDeletedTask.value };
      
      // Ajustar posições para abrir espaço
      const updates = [];
      tasks.value.forEach(t => {
        if (t.position >= taskToRestore.position) {
          t.position += 1;
          updates.push(db.tasks.update(t.id, { position: t.position }));
        }
      });
      await Promise.all(updates);
      
      delete taskToRestore.id;
      
      const id = await db.tasks.add(taskToRestore);
      taskToRestore.id = id;
      
      tasks.value.push(taskToRestore);
      tasks.value.sort((a, b) => a.position - b.position);
      
      lastDeletedTask.value = null;
      notificationService.toast('Tarefa restaurada!');
    } catch (error) {
      console.error("Failed to restore task:", error);
      notificationService.alert('Erro ao restaurar tarefa.', '', 'error');
    }
  };

  const toggleTimer = async (task) => {
    if (task.completed) return;
    const now = Date.now();

    if (task.isRunning) {
      task.isRunning = false;
      if (task.lastStartTime) {
        task.totalTimeSpent += (now - task.lastStartTime);
      }
      task.lastStartTime = null;
      await updateTask(task.id, {
        isRunning: false,
        totalTimeSpent: task.totalTimeSpent,
        lastStartTime: null
      });
    } else {
      for (const t of tasks.value) {
        if (t.isRunning && t.id !== task.id) {
          t.isRunning = false;
          if (t.lastStartTime) {
            t.totalTimeSpent += (now - t.lastStartTime);
          }
          t.lastStartTime = null;
          await db.tasks.update(t.id, {
            isRunning: false,
            totalTimeSpent: t.totalTimeSpent,
            lastStartTime: null
          });
        }
      }

      task.isRunning = true;
      task.lastStartTime = now;
      await updateTask(task.id, {
        isRunning: true,
        lastStartTime: now
      });
    }
  };

  const updateRunningTasks = () => {
    const now = Date.now();
    tasks.value.forEach(task => {
      if (task.isRunning && task.lastStartTime) {
        task.totalTimeSpent += (now - task.lastStartTime);
        task.lastStartTime = now;
      }
    });
  };

  const autoSaveRunningTasks = async () => {
    const promises = tasks.value
      .filter(t => t.isRunning)
      .map(t => db.tasks.update(t.id, {
        totalTimeSpent: t.totalTimeSpent,
        lastStartTime: t.lastStartTime
      }));
    await Promise.all(promises);
  };

  const updateTaskPositions = async (newTasks) => {
    if (newTasks.length < tasks.value.length) {
      const updatedTasks = [...tasks.value];
      const visibleIds = newTasks.map(t => t.id);
      const originalIndices = updatedTasks
        .map((t, idx) => visibleIds.includes(t.id) ? idx : -1)
        .filter(idx => idx !== -1)
        .sort((a, b) => a - b);
      
      originalIndices.forEach((originalIdx, i) => {
        updatedTasks[originalIdx] = newTasks[i];
      });
      
      tasks.value = updatedTasks;
    } else {
      tasks.value = [...newTasks];
    }
    
    const updates = tasks.value.map((task, index) => {
      const newPos = index + 1;
      task.position = newPos;
      return db.tasks.update(task.id, { position: newPos });
    });
    
    try {
      await Promise.all(updates);
    } catch (error) {
      console.error("Failed to persist new task positions:", error);
    }
  };

  return {
    tasks,
    sprints,
    filter,
    isLoading,
    selectedTask,
    activeTask,
    loadTasks,
    loadSprints,
    addTask,
    updateTask,
    deleteTask,
    restoreTask,
    lastDeletedTask,
    toggleTimer,
    updateRunningTasks,
    autoSaveRunningTasks,
    updateTaskPositions
  };
});
