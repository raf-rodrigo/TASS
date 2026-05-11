import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotificationStore } from './notificationStore';

describe('NotificationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve adicionar uma notificação à fila', () => {
    const store = useNotificationStore();
    store.add({ title: 'Teste', message: 'Olá' });
    
    expect(store.notifications.length).toBe(1);
    expect(store.notifications[0].title).toBe('Teste');
  });

  it('deve remover a notificação automaticamente após a duração', () => {
    const store = useNotificationStore();
    store.add({ duration: 1000 });
    
    expect(store.notifications.length).toBe(1);
    
    // Avançamos o relógio do sistema
    vi.advanceTimersByTime(1000);
    
    expect(store.notifications.length).toBe(0);
  });

  it('deve permitir a remoção manual', () => {
    const store = useNotificationStore();
    const id = store.add({ title: 'Manual' });
    
    store.remove(id);
    expect(store.notifications.length).toBe(0);
  });
});
