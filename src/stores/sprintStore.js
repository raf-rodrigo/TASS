import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db.js';
import { useSettingsStore } from './settingsStore';
import { useTaskStore } from './taskStore';
import { formatMsToHMS } from '../utils/time.js';
import { notificationService } from '../services/notificationService';

export const useSprintStore = defineStore('sprint', () => {
  const sprints = ref([]);

  const loadSprints = async (userIdFilter = null) => {
    try {
      sprints.value = await db.sprints.toArray(userIdFilter);
    } catch (error) {
      console.error("Failed to load sprints:", error);
      notificationService.toast("Erro ao carregar as sprints do banco de dados.", "error");
    }
  };

  const activeSprintName = computed(() => {
    const settings = useSettingsStore();
    if (settings.activeSprintId === 'all') return 'Todas as Sprints';
    const sprint = sprints.value.find(s => s.id === parseInt(settings.activeSprintId));
    if (!sprint) return 'Sprint...';
    const startStr = sprint.startDate ? new Date(sprint.startDate).toLocaleDateString('pt-BR') : '';
    const endStr = new Date(sprint.endDate).toLocaleDateString('pt-BR');
    return startStr ? `Sprint de ${startStr} a ${endStr}` : `Sprint até ${endStr}`;
  });

  const activeSprintTotalTime = computed(() => {
    const settings = useSettingsStore();
    const taskStore = useTaskStore();
    let filtered = taskStore.tasks;
    if (settings.activeSprintId !== 'all') {
      const id = parseInt(settings.activeSprintId);
      filtered = filtered.filter(t => t.sprintId === id);
    }
    const totalMs = filtered.reduce((acc, t) => acc + (t.totalWorked || t.totalTimeSpent || 0), 0);
    return formatMsToHMS(totalMs, true);
  });

  return {
    sprints,
    loadSprints,
    activeSprintName,
    activeSprintTotalTime
  };
});
