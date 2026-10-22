import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db.js';
import { useSettingsStore } from './settingsStore';
import { useTaskStore } from './taskStore';
import { formatMsToHMS, safeFormatDate } from '../utils/time.js';
import { notificationService } from '../services/notificationService';

export const useSprintStore = defineStore('sprint', () => {
  const sprints = ref([]);

  let selectedUserIdFilter = null;

  const loadSprints = async (userIdFilter = selectedUserIdFilter) => {
    selectedUserIdFilter = userIdFilter;
    try {
      sprints.value = await db.sprints.toArray(userIdFilter);
    } catch (error) {
      console.error("Failed to load sprints:", error);
      notificationService.toast("Erro ao carregar as sprints do banco de dados.", "error");
    }
  };

  const sprintLabel = (sprint) => {
    const startStr = sprint.startDate ? safeFormatDate(sprint.startDate) : '';
    const endStr = safeFormatDate(sprint.endDate);
    const period = startStr ? `Sprint de ${startStr} a ${endStr}` : `Sprint até ${endStr}`;
    return sprint.name?.trim() ? `${sprint.name.trim()} · ${period}` : period;
  };

  const saveSprint = async (sprint) => {
    const name = String(sprint.name || '').trim();
    if (!name) throw new Error('Informe o nome da sprint.');
    const validDate = value => {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    };
    if (!validDate(sprint.endDate) || (!sprint.id && !validDate(sprint.startDate))
      || (sprint.startDate && (!validDate(sprint.startDate) || sprint.endDate < sprint.startDate))) {
      throw new Error('Informe um período válido, com o fim igual ou posterior ao início.');
    }
    await db.sprints.add({ ...sprint, name, createdAt: sprint.createdAt ?? Date.now() });
    await loadSprints();
  };

  const deleteSprint = async (id) => {
    await db.sprints.delete(id);
    const settings = useSettingsStore();
    if (String(settings.activeSprintId) === String(id)) settings.activeSprintId = 'all';
    await Promise.all([loadSprints(), useTaskStore().loadTasks()]);
  };

  const activeSprintName = computed(() => {
    const settings = useSettingsStore();
    if (settings.activeSprintId === 'all') return 'Todas as Sprints';
    const sprint = sprints.value.find(s => String(s.id) === String(settings.activeSprintId));
    return sprint ? sprintLabel(sprint) : 'Sprint...';
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
    saveSprint,
    deleteSprint,
    sprintLabel,
    activeSprintName,
    activeSprintTotalTime
  };
});
