import { ref, onMounted, onUnmounted, watch } from 'vue';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
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

  const triggerWaterAlert = () => {
    // 1. Modal Imediato e Robusto
    Swal.fire({
      title: 'Hora de se hidratar! 💧',
      text: 'Uma pausa rápida para beber água faz bem para o foco e para a saúde.',
      icon: 'info',
      toast: false,
      position: 'center',
      timer: 30000,
      showConfirmButton: true,
      confirmButtonText: 'Bebido! 👍',
      confirmButtonColor: '#6366f1', // Indigo do TASS
      cancelButtonColor: '#ef4444',
      background: settings.theme === 'dark' ? '#1e293b' : '#ffffff',
      color: settings.theme === 'dark' ? '#f8fafc' : '#1e293b',
      customClass: {
        popup: 'tass-modal !p-8',
        title: 'text-2xl font-black text-indigo-600 dark:text-indigo-400'
      }
    });

    // 2. Efeitos secundários
    try {
      playNotificationSound();
      flashTitle();
      sendNotification("Hora de se hidratar! 💧", "Beba um copo d'água agora.");
    } catch (e) {
      console.warn("Falha nos efeitos de notificação:", e);
    }
  };

  const startWaterReminder = () => {
    if (waterTimer) clearInterval(waterTimer);
    if (!settings.waterReminderEnabled) return;

    waterTimer = setInterval(() => {
      triggerWaterAlert();
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
