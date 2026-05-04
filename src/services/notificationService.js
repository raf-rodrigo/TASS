import Swal, { toast as sToast, confirm as sConfirm } from '../utils/swal.js';
import { sendNotification as nativeSend, playNotificationSound, requestNotificationPermission } from '../utils/notifications.js';

/**
 * Unified Notification Service for TASS
 * Handles both in-app toasts/modals and system notifications
 */
export const notificationService = {
  /**
   * Send a quick toast message
   */
  toast(title, icon = 'success', timer = 3000) {
    return sToast.fire({ title, icon, timer });
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
  async confirm(title, text, confirmText = 'Sim', type = 'info') {
    const result = await sConfirm({
      title,
      message: text,
      confirmText,
      type
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
        popup: 'tass-modal',
        confirmButton: 'btn btn-primary !px-10'
      },
      buttonsStyling: false,
      confirmButtonText: 'Entendido'
    });
  }
};
