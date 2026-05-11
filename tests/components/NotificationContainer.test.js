import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import NotificationContainer from '../../src/components/NotificationContainer.vue';

// Mock das Stores
const mockRemove = vi.fn();
vi.mock('../../src/stores/notificationStore', () => ({
  useNotificationStore: vi.fn(() => ({
    notifications: [
      { id: 1, title: 'Sucesso', message: 'Tudo OK', type: 'success' },
      { id: 2, title: 'Erro', message: 'Falhou', type: 'error' }
    ],
    remove: mockRemove
  }))
}));

vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({ theme: 'dark' }))
}));

describe('NotificationContainer.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRemove.mockClear();
  });

  it('deve renderizar a lista de notificações da store', () => {
    const wrapper = mount(NotificationContainer);
    
    expect(wrapper.text()).toContain('Sucesso');
    expect(wrapper.text()).toContain('Tudo OK');
    expect(wrapper.text()).toContain('Erro');
  });

  it('deve disparar a remoção ao clicar no botão de fechar', async () => {
    const wrapper = mount(NotificationContainer);

    const closeButton = wrapper.find('button');
    await closeButton.trigger('click');

    expect(mockRemove).toHaveBeenCalledWith(1);
  });
});
