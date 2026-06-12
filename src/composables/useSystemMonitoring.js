import { ref, onMounted, onUnmounted } from 'vue';
import { notificationService } from '../services/notificationService';

export function useSystemMonitoring(settings, timerStore) {
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
    if (settings.trackInactivity && timerStore.activeTask) {
      const thresholdMs = (settings.inactivityThreshold || 1) * 60000;
      if (now - lastActivity.value > thresholdMs) {
        const pausedTaskName = timerStore.activeTask.title;
        timerStore.toggleTimer(timerStore.activeTask);
        notificationService.alert(
          'Monitor de Inatividade', 
          `A tarefa ativa (${pausedTaskName}) foi parada por falta de atividade.`, 
          'warning'
        );
        resetInactivity(); // Evita loops de alerta
      }
    }

    // 2. Pausa Automática Fora do Expediente
    if (settings.autoPauseOutsideWork && timerStore.activeTask) {
      const nowDate = new Date();
      const currentDay = nowDate.getDay();
      const currentTimeStr = nowDate.getHours().toString().padStart(2, '0') + ':' + 
                           nowDate.getMinutes().toString().padStart(2, '0');
      
      const isWorkDay = settings.workDays.includes(currentDay);
      
      let isWithinHours;
      if (settings.workStart <= settings.workEnd) {
        // Horário comercial comum (ex: 08:00 às 18:00)
        isWithinHours = currentTimeStr >= settings.workStart && currentTimeStr < settings.workEnd;
      } else {
        // Turno da noite (ex: 22:00 às 06:00)
        isWithinHours = currentTimeStr >= settings.workStart || currentTimeStr < settings.workEnd;
      }
      
      if (!isWorkDay) {
        timerStore.toggleTimer(timerStore.activeTask);
        notificationService.alert(
          'Expediente Encerrado', 
          'Sua tarefa foi pausada porque hoje não é um dia útil configurado na sua jornada de trabalho.', 
          'info'
        );
      } else if (!isWithinHours) {
        timerStore.toggleTimer(timerStore.activeTask);
        notificationService.alert(
          'Expediente Encerrado', 
          'Sua tarefa foi pausada automaticamente porque você está fora do horário da sua jornada.', 
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
