import { sendNotification as nativeSend, playNotificationSound, requestNotificationPermission } from '../utils/notifications.js';
import { useNotificationStore } from '../stores/notificationStore';
import { useModalStore } from '../stores/modalStore';

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
   * Confirm an action via Custom Modal (Tailwind UI Style)
   * @param {string} title
   * @param {string} text
   * @param {string} confirmText
   * @param {string} icon (success, error, warning, info)
   * @param {string|null} denyText - If provided, the function returns 'confirmed' | 'denied' | 'cancelled'
   * @returns {Promise<boolean|string>}
   */
  async confirm(title, text, confirmText = 'Sim', icon = 'info', denyText = null) {
    const store = useModalStore();
    const result = await store.confirm({
      title,
      text,
      confirmText,
      type: icon,
      denyText
    });

    // If it's a simple confirm (no deny button), return boolean
    if (!denyText) return result === 'confirmed';

    // If it's a complex confirm, return the exact action
    return result;
  },

  /**
   * Alert a warning or error via Custom Modal
   */
  alert(title, text, icon = 'warning') {
    const store = useModalStore();
    return store.alert({ 
      title, 
      text, 
      type: icon
    });
  },

  /**
   * Prompt user for input via Custom Modal
   * @param {Object} options { title, message, value, placeholder, promptType }
   */
  prompt(options) {
    const modalStore = useModalStore();
    return modalStore.prompt(options);
  }
};
