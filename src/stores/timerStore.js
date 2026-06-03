import { defineStore } from 'pinia';
import { computed } from 'vue';
import { db } from '../db.js';
import { useSettingsStore } from './settingsStore';
import { useTaskStore } from './taskStore';
import { notificationService } from '../services/notificationService';
import { formatMsToHMS } from '../utils/time.js';

export const useTimerStore = defineStore('timer', () => {
  const taskStore = useTaskStore();
  const settings = useSettingsStore();

  const activeTask = computed(() => taskStore.tasks.find(t => t.isRunning));

  const activeTaskTimeFormatted = computed(() => {
    return activeTask.value ? formatMsToHMS(activeTask.value.totalTimeSpent) : '00:00:00';
  });

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
      await taskStore.updateTask(task.id, { 
        isRunning: false, 
        totalTimeSpent: task.totalTimeSpent, 
        totalWorked: task.totalWorked,
        lastStartTime: null 
      });
    } else {
      const nowDate = new Date();
      const currentDay = nowDate.getDay();
      const currentTimeStr = nowDate.getHours().toString().padStart(2, '0') + ':' + 
                             nowDate.getMinutes().toString().padStart(2, '0');
      
      const isWorkDay = settings.workDays.includes(currentDay);
      let isWithinHours = false;
      
      if (settings.workStart <= settings.workEnd) {
        isWithinHours = currentTimeStr >= settings.workStart && currentTimeStr < settings.workEnd;
      } else {
        isWithinHours = currentTimeStr >= settings.workStart || currentTimeStr < settings.workEnd;
      }

      if (!isWorkDay) {
        notificationService.alert('Acesso Negado', 'Você não pode iniciar tarefas porque hoje não é um dia útil configurado na sua jornada.', 'warning');
        return;
      } else if (!isWithinHours) {
        notificationService.alert('Acesso Negado', 'Você não pode iniciar tarefas fora do horário da sua jornada configurada.', 'warning');
        return;
      }

      // Parar qualquer outra tarefa que esteja rodando
      for (const t of taskStore.tasks) {
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
      await taskStore.updateTask(task.id, { isRunning: true, lastStartTime: now });
    }
  };

  const resetTaskTime = async (id) => {
    try {
      await taskStore.updateTask(id, { 
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
    taskStore.tasks.forEach(task => {
      if (task.isRunning && task.lastStartTime) {
        const diff = now - task.lastStartTime;
        task.totalTimeSpent += diff;
        task.totalWorked = (task.totalWorked || 0) + diff;
        task.lastStartTime = now;
      }
    });
  };

  const autoSaveRunningTasks = async () => {
    const promises = taskStore.tasks
      .filter(t => t.isRunning)
      .map(t => db.tasks.update(t.id, { 
        totalTimeSpent: t.totalTimeSpent, 
        totalWorked: t.totalWorked,
        lastStartTime: t.lastStartTime 
      }));
    await Promise.all(promises);
  };

  const adjustTaskTime = async (taskId, newMs, field = 'totalTimeSpent') => {
    try {
      const task = taskStore.tasks.find(t => t.id === taskId);
      if (!task) return;

      const updates = { [field]: newMs };
      
      if (field === 'totalTimeSpent') {
        const diff = newMs - task.totalTimeSpent;
        updates.totalWorked = (task.totalWorked || 0) + diff;
      }

      await taskStore.updateTask(taskId, updates);
      notificationService.toast('Tempo da tarefa ajustado!', 'success');
    } catch (error) {
      console.error("Failed to adjust task time:", error);
      notificationService.toast('Erro ao ajustar tempo', 'error');
    }
  };

  return {
    activeTask,
    activeTaskTimeFormatted,
    toggleTimer,
    resetTaskTime,
    updateRunningTasks,
    autoSaveRunningTasks,
    adjustTaskTime
  };
});
