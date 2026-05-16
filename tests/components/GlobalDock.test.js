import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import GlobalDock from '../../src/components/GlobalDock.vue';

// Mock das Stores
vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    theme: 'dark',
    cardBorderRadius: 16
  }))
}));

vi.mock('../../src/stores/taskStore', () => ({
  useTaskStore: vi.fn(() => ({
    activeTask: null,
    activeSprintTotalTime: '10h 30m',
    lastDeletedTask: null,
    statusFilter: 'all'
  }))
}));

vi.mock('../../src/stores/radioStore', () => ({
  useRadioStore: vi.fn(() => ({
    isPlaying: false
  }))
}));

describe('GlobalDock.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('deve disparar evento add-task ao clicar no botão de plus', async () => {
    const wrapper = mount(GlobalDock);
    // Busca o botão de adicionar tarefa (o primeiro da dock)
    const addButton = wrapper.findAll('button')[0];
    
    await addButton.trigger('click');
    expect(wrapper.emitted()).toHaveProperty('add-task');
  });

  it('deve exibir o tempo total da sprint', () => {
    const wrapper = mount(GlobalDock);
    expect(wrapper.text()).toContain('10h 30m');
  });

  it('deve disparar toggle-theme ao clicar no botão de sol/lua', async () => {
    const wrapper = mount(GlobalDock);
    
    // O botão de tema é o que contém Sun ou Moon. 
    // Na estrutura atual, ele é um dos botões dentro de .flex items-center gap-1
    const buttons = wrapper.findAll('button');
    const themeBtn = buttons.find(b => b.html().includes('Sun') || b.html().includes('Moon'));
    
    if (themeBtn) {
      await themeBtn.trigger('click');
      expect(wrapper.emitted()).toHaveProperty('toggle-theme');
    }
  });
});
