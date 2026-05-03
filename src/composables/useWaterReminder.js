import { ref, onMounted, onUnmounted, watch } from 'vue';
import { toast as sToast } from '../utils/swal.js';
import { sendNotification, playNotificationSound } from '../utils/notifications.js';

export function useWaterReminder(settings) {
  let waterTimer = null;
  let flashInterval = null;
  const originalTitle = document.title;

  const flashTitle = () => {
    if (flashInterval) return;
    flashInterval = setInterval(() => {
      document.title = document.title === originalTitle ? '💧 BEBER ÁGUA!' : originalTitle;
    }, 1000);

    const stopFlash = () => {
      if (flashInterval) {
        clearInterval(flashInterval);
        flashInterval = null;
        document.title = originalTitle;
      }
      window.removeEventListener('focus', stopFlash);
    };
    window.addEventListener('focus', stopFlash);
  };

  const startWaterReminder = () => {
    if (waterTimer) clearInterval(waterTimer);
    if (!settings.waterReminderEnabled) return;

    waterTimer = setInterval(() => {
      playNotificationSound();
      flashTitle();
      sendNotification("Hora de se hidratar! 💧", "Uma pausa rápida para beber água faz bem para o foco e para a saúde.");
      
      sToast.fire({
        title: 'Hora de se hidratar! 💧',
        text: 'Uma pausa rápida para beber água faz bem para o foco e para a saúde.',
        icon: 'info',
        toast: false,
        position: 'center',
        timer: 20000,
        showConfirmButton: true,
        confirmButtonText: 'Bebido! 👍',
        confirmButtonColor: '#6366f1',
        customClass: {
          popup: 'tass-modal !p-8',
          title: 'text-2xl font-bold text-indigo-600 dark:text-indigo-400'
        }
      });
    }, settings.waterReminderInterval * 60 * 1000);
  };

  const stopWaterReminder = () => {
    if (waterTimer) {
      clearInterval(waterTimer);
      waterTimer = null;
    }
  };

  // Auto-restart if settings change
  watch(
    () => [settings.waterReminderEnabled, settings.waterReminderInterval],
    () => {
      startWaterReminder();
    }
  );

  onUnmounted(() => {
    stopWaterReminder();
    if (flashInterval) clearInterval(flashInterval);
  });

  return {
    startWaterReminder,
    stopWaterReminder
  };
}
