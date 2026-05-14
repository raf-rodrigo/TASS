import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db.js';
import { notificationService } from '../services/notificationService';
import { useSettingsStore } from './settingsStore';
import { formatMsToHMS } from '../utils/time.js';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref([]);
  const sprints = ref([]);
  const statusFilter = ref('all');
  const isLoading = ref(false);
  const selectedTask = ref(null);
  const contextMenuPosition = ref({ x: 0, y: 0 });

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
    const totalMs = filtered.reduce((acc, t) => acc + (t.totalWorked || t.totalTimeSpent || 0), 0);
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
      
      const runningTask = dbTasks.find(t => t.isRunning);
      if (runningTask) {
        // Se a tarefa estava rodando, ela continua rodando ao iniciar o sistema.
        // No entanto, resetamos o lastStartTime para 'agora'.
        // Isso garante que o tempo em que o PC esteve desligado NÃO seja somado,
        // mas a tarefa retome sua contagem automaticamente a partir do momento atual.
        runningTask.lastStartTime = Date.now();
        await db.tasks.update(runningTask.id, { lastStartTime: runningTask.lastStartTime });
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
      totalWorked: 0,
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
        // Substituímos o objeto inteiro para garantir reatividade total
        const updatedTask = { ...tasks.value[index], ...updates };
        tasks.value[index] = updatedTask;
        
        // Sincroniza a tarefa selecionada se for a mesma que foi editada
        if (selectedTask.value && selectedTask.value.id === id) {
          selectedTask.value = updatedTask;
        }
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
      if (task.lastStartTime) {
        const diff = now - task.lastStartTime;
        task.totalTimeSpent += diff;
        task.totalWorked = (task.totalWorked || 0) + diff;
      }
      task.lastStartTime = null;
      await updateTask(task.id, { 
        isRunning: false, 
        totalTimeSpent: task.totalTimeSpent, 
        totalWorked: task.totalWorked,
        lastStartTime: null 
      });
    } else {
      for (const t of tasks.value) {
        if (t.isRunning && t.id !== task.id) {
          t.isRunning = false;
          if (t.lastStartTime) {
            const diff = now - t.lastStartTime;
            t.totalTimeSpent += diff;
            t.totalWorked = (t.totalWorked || 0) + diff;
          }
          t.lastStartTime = null;
          await db.tasks.update(t.id, { 
            isRunning: false, 
            totalTimeSpent: t.totalTimeSpent, 
            totalWorked: t.totalWorked,
            lastStartTime: null 
          });
        }
      }
      task.isRunning = true;
      task.lastStartTime = now;
      await updateTask(task.id, { isRunning: true, lastStartTime: now });
    }
  };

  const resetTaskTime = async (id) => {
    try {
      await updateTask(id, { 
        totalTimeSpent: 0, 
        lastStartTime: null,
        isRunning: false 
      });
      notificationService.toast('Cronômetro da tarefa zerado!');
    } catch (error) {
      console.error("Failed to reset task time:", error);
    }
  };

  const updateRunningTasks = () => {
    const now = Date.now();
    tasks.value.forEach(task => {
      if (task.isRunning && task.lastStartTime) {
        const diff = now - task.lastStartTime;
        task.totalTimeSpent += diff;
        task.totalWorked = (task.totalWorked || 0) + diff;
        task.lastStartTime = now;
      }
    });
  };

  const autoSaveRunningTasks = async () => {
    const promises = tasks.value
      .filter(t => t.isRunning)
      .map(t => db.tasks.update(t.id, { 
        totalTimeSpent: t.totalTimeSpent, 
        totalWorked: t.totalWorked,
        lastStartTime: t.lastStartTime 
      }));
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
    try {
      const updates = allTasksOrdered.map((task, index) => {
        const newPos = index + 1;
        // Atualiza o objeto local sincronamente
        task.position = newPos;
        // Retorna a promise de update do banco
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
    }
  };

  const resetSystem = async () => {
    try {
      await db.tasks.clear();
      await db.sprints.clear();
      await db.notes.clear();
      
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

  const adjustTaskTime = async (taskId, newMs, field = 'totalTimeSpent') => {
    try {
      const task = tasks.value.find(t => t.id === taskId);
      if (!task) return;

      const updates = { [field]: newMs };
      
      // Se estivermos ajustando a sessão atual (totalTimeSpent), 
      // também atualizamos proporcionalmente o total trabalhado (totalWorked)
      if (field === 'totalTimeSpent') {
        const diff = newMs - task.totalTimeSpent;
        updates.totalWorked = (task.totalWorked || 0) + diff;
      }

      await updateTask(taskId, updates);
      notificationService.toast('Tempo da tarefa ajustado!', 'success');
    } catch (error) {
      console.error("Failed to adjust task time:", error);
      notificationService.toast('Erro ao ajustar tempo', 'error');
    }
  };

  return {
    tasks, sprints, isLoading, selectedTask, activeTask,
    statusFilter, filteredTasks, boardColumns,
    loadTasks, loadSprints, addTask, updateTask, deleteTask, restoreTask, resetTaskTime,
    lastDeletedTask, toggleTimer, updateRunningTasks, autoSaveRunningTasks,
    migrateOrphanTasks, updateAllPositions, resetSystem, adjustTaskTime,
    activeTaskTimeFormatted, activeSprintName, activeSprintTotalTime
  };
});
