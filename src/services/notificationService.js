import Swal, { confirm as sConfirm } from '../utils/swal.js';
import { sendNotification as nativeSend, playNotificationSound, requestNotificationPermission } from '../utils/notifications.js';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * Unified Notification Service for TASS
 * Handles both in-app toasts/modals and system notifications
 */
export const notificationService = {
  /**
   * Send a quick toast message (Custom Tailwind UI style)
   */
  toast(title, type = 'success', message = '') {
    const store = useNotificationStore();
    return store.add({ title, message, type });
  },

  /**
   * Send a system notification with sound
   */
  notify(title, body, sound = true) {
    if (sound) playNotificationSound();
    return nativeSend(title, body);
  },

  /**
   * Request permission for native notifications
   */
  requestPermission() {
    return requestNotificationPermission();
  },

  /**
   * Confirm an action via Modal
   */
  async confirm(title, text, confirmText = 'Sim', icon = 'info', confirmClass = 'btn btn-primary') {
    const result = await sConfirm({
      title,
      text,
      confirmText,
      icon,
      confirmClass
    });
    return result.isConfirmed;
  },

  /**
   * Alert a warning or error
   */
  alert(title, text, icon = 'warning') {
    return Swal.fire({ 
      title, 
      text, 
      icon,
      customClass: {
        popup: 'app-modal',
        confirmButton: 'btn btn-primary !px-10'
      },
      buttonsStyling: false,
      confirmButtonText: 'Entendido'
    });
  }
};
