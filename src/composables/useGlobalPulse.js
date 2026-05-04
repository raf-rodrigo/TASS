import { onMounted, onUnmounted } from 'vue';

/**
 * Orquestra os timers globais do sistema (1s e 10s)
 * @param {Object} taskStore - Store de tarefas
 * @param {Function} checkMonitoringCallback - Função de monitoramento de sistema
 */
export function useGlobalPulse(taskStore, checkMonitoringCallback) {
  let timerInterval = null;
  let autoSaveInterval = null;

  const startPulse = () => {
    // Timer de 1 segundo (Interface e Monitoramento)
    timerInterval = setInterval(() => {
      taskStore.updateRunningTasks();
      if (checkMonitoringCallback) {
        checkMonitoringCallback();
      }
    }, 1000);

    // Timer de 10 segundos (Persistência no Banco)
    autoSaveInterval = setInterval(() => {
      taskStore.autoSaveRunningTasks();
    }, 10000);
  };

  const stopPulse = () => {
    if (timerInterval) clearInterval(timerInterval);
    if (autoSaveInterval) clearInterval(autoSaveInterval);
  };

  onMounted(() => {
    startPulse();
  });

  onUnmounted(() => {
    stopPulse();
  });

  return {
    startPulse,
    stopPulse
  };
}
