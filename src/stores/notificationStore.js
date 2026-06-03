import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([]);

  /**
   * Adiciona uma nova notificação à fila
   * @param {Object} notification { title, message, type, duration }
   */
  const add = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      title: notification.title || 'Notificação',
      message: notification.message || '',
      type: notification.type || 'success', // success, error, warning, info
      duration: notification.duration || 500
    };

    notifications.value.push(newNotification);

    if (newNotification.duration > 0) {
      setTimeout(() => {
        remove(id);
      }, newNotification.duration);
    }

    return id;
  };

  const remove = (id) => {
    notifications.value = notifications.value.filter(n => n.id !== id);
  };

  return {
    notifications,
    add,
    remove
  };
});
