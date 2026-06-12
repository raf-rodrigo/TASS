import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTimerStore } from '../../src/stores/timerStore';
import { useTaskStore } from '../../src/stores/taskStore';
import { db } from '../../src/db.js';

// Mocks do Banco de Dados
vi.mock('../../src/db.js', () => ({
  db: {
    tasks: {
      update: vi.fn(),
    }
  }
}));

// Mock do SettingsStore
vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    trackInactivity: false,
    inactivityThreshold: 10,
    workDays: [1, 2, 3, 4, 5],
    workStart: '09:00',
    workEnd: '18:00',
    autoPauseOutsideWork: false
  }))
}));

describe('TimerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Definir data para uma quarta-feira (dia útil) às 12:00 (dentro do horário comercial)
    vi.setSystemTime(new Date('2024-05-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Lógica do Cronômetro', () => {
    it('deve iniciar o timer de uma tarefa e parar as outras', async () => {
      const taskStore = useTaskStore();
      const timerStore = useTimerStore();
      const task1 = { id: 1, isRunning: false, totalTimeSpent: 0, completed: false };
      const task2 = { id: 2, isRunning: true, lastStartTime: Date.now(), totalTimeSpent: 100, completed: false };
      
      taskStore.tasks = [task1, task2];

      await timerStore.toggleTimer(task1);

      expect(task1.isRunning).toBe(true);
      expect(task2.isRunning).toBe(false);
      expect(db.tasks.update).toHaveBeenCalled();
    });

    it('deve calcular o tempo acumulado ao parar o timer', async () => {
      const taskStore = useTaskStore();
      const timerStore = useTimerStore();
      const now = Date.now();
      const startTime = now - 5000; // 5 segundos atrás
      const task = { id: 1, isRunning: true, lastStartTime: startTime, totalTimeSpent: 1000, completed: false };
      
      taskStore.tasks = [task];

      await timerStore.toggleTimer(task);

      expect(task.isRunning).toBe(false);
      // 1000 original + 5000 passados = 6000ms
      expect(task.totalTimeSpent).toBeGreaterThanOrEqual(6000);
    });

    it('deve ajustar o tempo da tarefa manualmente (adjustTaskTime)', async () => {
      const taskStore = useTaskStore();
      const timerStore = useTimerStore();
      const initialTask = { id: 1, totalTimeSpent: 1000, totalWorked: 1000 };
      taskStore.tasks = [initialTask];
      
      const newTime = 5000;
      await timerStore.adjustTaskTime(1, newTime);

      const updatedTask = taskStore.tasks[0];
      expect(updatedTask.totalTimeSpent).toBe(5000);
      expect(updatedTask.totalWorked).toBe(5000);
      expect(db.tasks.update).toHaveBeenCalledWith(1, expect.objectContaining({ totalTimeSpent: 5000 }));
    });
  });
});
