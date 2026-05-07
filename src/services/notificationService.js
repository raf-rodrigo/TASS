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
   */
  async confirm(title, text, confirmText = 'Sim', icon = 'info') {
    const store = useModalStore();
    return await store.confirm({
      title,
      text,
      confirmText,
      type: icon
    });
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
   */
  prompt(options) {
    const store = useModalStore();
    return store.prompt(options);
  }
};
