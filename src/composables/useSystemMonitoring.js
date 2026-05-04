import { ref, onMounted, onUnmounted } from 'vue';
import { notificationService } from '../services/notificationService';

export function useSystemMonitoring(settings, taskStore) {
  const lastActivity = ref(Date.now());

  const resetInactivity = () => {
    lastActivity.value = Date.now();
  };

  /**
   * Verifica inatividade e expediente. 
   * Chamada pelo "pulso global" a cada segundo.
   */
  const checkMonitoring = () => {
    const now = Date.now();

    // 1. Monitor de Inatividade
    if (settings.trackInactivity && taskStore.activeTask) {
      const thresholdMs = (settings.inactivityThreshold || 1) * 60000;
      if (now - lastActivity.value > thresholdMs) {
        const pausedTaskName = taskStore.activeTask.title;
        taskStore.toggleTimer(taskStore.activeTask);
        notificationService.alert(
          'Monitor de Inatividade', 
          `A tarefa ativa (${pausedTaskName}) foi parada por falta de atividade.`, 
          'warning'
        );
        resetInactivity(); // Evita loops de alerta
      }
    }

    // 2. Pausa Automática Fora do Expediente
    if (settings.autoPauseOutsideWork && taskStore.activeTask) {
      const nowDate = new Date();
      const currentDay = nowDate.getDay();
      const currentTimeStr = nowDate.getHours().toString().padStart(2, '0') + ':' + 
                           nowDate.getMinutes().toString().padStart(2, '0');
      
      const isWorkDay = settings.workDays.includes(currentDay);
      const isWithinHours = currentTimeStr >= settings.workStart && currentTimeStr < settings.workEnd;
      
      if (!isWorkDay || !isWithinHours) {
        taskStore.toggleTimer(taskStore.activeTask);
        notificationService.alert(
          'Expediente Encerrado', 
          'Sua tarefa foi pausada automaticamente seguindo sua jornada de trabalho.', 
          'info'
        );
      }
    }
  };

  onMounted(() => {
    window.addEventListener('mousemove', resetInactivity);
    window.addEventListener('keydown', resetInactivity);
    window.addEventListener('click', resetInactivity);
  });

  onUnmounted(() => {
    window.removeEventListener('mousemove', resetInactivity);
    window.removeEventListener('keydown', resetInactivity);
    window.removeEventListener('click', resetInactivity);
  });

  return {
    checkMonitoring,
    resetInactivity
  };
}
