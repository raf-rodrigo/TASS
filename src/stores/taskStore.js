import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db.js';
import { notificationService } from '../services/notificationService';
import { useSettingsStore } from './settingsStore';
import { formatMsToHMS } from '../utils/time.js';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref([]);
  const sprints = ref([]);
  const filter = ref('all');
  const isLoading = ref(false);
  const selectedTask = ref(null);

  const activeTask = computed(() => tasks.value.find(t => t.isRunning));

  const activeTaskTimeFormatted = computed(() => {
    return activeTask.value ? formatMsToHMS(activeTask.value.totalTimeSpent) : '00:00:00';
  });

  const activeSprintName = computed(() => {
    const settings = useSettingsStore();
    if (settings.activeSprintId === 'all') return 'Todas as Sprints';
    const sprint = sprints.value.find(s => s.id === parseInt(settings.activeSprintId));
    if (!sprint) return 'Sprint...';
    return `Sprint ${new Date(sprint.endDate).toLocaleDateString('pt-BR')}`;
  });

  const activeSprintTotalTime = computed(() => {
    const settings = useSettingsStore();
    let filtered = tasks.value;
    if (settings.activeSprintId !== 'all') {
      const id = parseInt(settings.activeSprintId);
      filtered = filtered.filter(t => t.sprintId === id);
    }
    const totalMs = filtered.reduce((acc, t) => acc + (t.totalTimeSpent || 0), 0);
    return formatMsToHMS(totalMs, true);
  });

  const loadTasks = async () => {
    isLoading.value = true;
    try {
      let dbTasks = await db.tasks.toArray();
      
      const needsColumnMigration = dbTasks.some(t => t.columnId === undefined);
      if (needsColumnMigration) {
        const updates = [];
        dbTasks.forEach(t => {
          if (t.columnId === undefined) {
            t.columnId = 1;
            updates.push(db.tasks.update(t.id, { columnId: 1 }));
          }
        });
        await Promise.all(updates);
      }

      const needsPositionMigration = dbTasks.some(t => typeof t.position !== 'number');
      if (needsPositionMigration) {
        dbTasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const updates = [];
        dbTasks.forEach((t, index) => {
          t.position = index + 1;
          updates.push(db.tasks.update(t.id, { position: t.position }));
        });
        await Promise.all(updates);
      }
      
      const now = Date.now();
      const settings = useSettingsStore();
      const runningTask = dbTasks.find(t => t.isRunning);
      if (runningTask && runningTask.lastStartTime) {
        const timePassed = now - runningTask.lastStartTime;
        if (timePassed > 60000 && !settings.trackInactivity) { 
          runningTask.isRunning = false;
          runningTask.lastStartTime = null;
          await db.tasks.update(runningTask.id, { isRunning: false, lastStartTime: null });
        } else {
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
    }
  };

  const toggleTimer = async (task) => {
    if (task.completed) return;
    const now = Date.now();
    if (task.isRunning) {
      task.isRunning = false;
      if (task.lastStartTime) task.totalTimeSpent += (now - task.lastStartTime);
      task.lastStartTime = null;
      await updateTask(task.id, { isRunning: false, totalTimeSpent: task.totalTimeSpent, lastStartTime: null });
    } else {
      for (const t of tasks.value) {
        if (t.isRunning && t.id !== task.id) {
          t.isRunning = false;
          if (t.lastStartTime) t.totalTimeSpent += (now - t.lastStartTime);
          t.lastStartTime = null;
          await db.tasks.update(t.id, { isRunning: false, totalTimeSpent: t.totalTimeSpent, lastStartTime: null });
        }
      }
      task.isRunning = true;
      task.lastStartTime = now;
      await updateTask(task.id, { isRunning: true, lastStartTime: now });
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
      .map(t => db.tasks.update(t.id, { totalTimeSpent: t.totalTimeSpent, lastStartTime: t.lastStartTime }));
    await Promise.all(promises);
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
    const updates = [];
    allTasksOrdered.forEach((task, index) => {
      const newPos = index + 1;
      if (task.position !== newPos) {
        task.position = newPos;
        updates.push(db.tasks.update(task.id, { position: newPos }));
      }
    });
    if (updates.length > 0) await Promise.all(updates);
  };

  const resetSystem = async () => {
    try {
      await db.tasks.clear();
      await db.sprints.clear();
      await db.notes.clear();
      
      // Limpeza manual da memória para evitar o reload
      tasks.value = [];
      sprints.value = [];
      lastDeletedTask.value = null;
      selectedTask.value = null;
      
      return true;
    } catch (error) {
      console.error("Failed to reset system:", error);
      return false;
    }
  };

  return {
    tasks, sprints, filter, isLoading, selectedTask, activeTask,
    loadTasks, loadSprints, addTask, updateTask, deleteTask, restoreTask,
    lastDeletedTask, toggleTimer, updateRunningTasks, autoSaveRunningTasks,
    migrateOrphanTasks, updateAllPositions, resetSystem,
    activeTaskTimeFormatted, activeSprintName, activeSprintTotalTime
  };
});
