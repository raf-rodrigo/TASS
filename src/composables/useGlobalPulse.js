import { onMounted, onUnmounted } from 'vue';

/**
 * Orquestra os timers globais do sistema (1s e 10s)
 * @param {Object} timerStore - Store de timers
 * @param {Function} checkMonitoringCallback - Função de monitoramento de sistema
 */
export function useGlobalPulse(timerStore, checkMonitoringCallback) {
  let timerInterval = null;
  let autoSaveInterval = null;

  const startPulse = () => {
    // Timer de 1 segundo (Interface e Monitoramento)
    timerInterval = setInterval(() => {
      timerStore.updateRunningTasks();
      if (checkMonitoringCallback) {
        checkMonitoringCallback();
      }
    }, 1000);

    // Timer de 10 segundos (Persistência no Banco)
    autoSaveInterval = setInterval(() => {
      timerStore.autoSaveRunningTasks();
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
