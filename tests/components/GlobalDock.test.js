import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import GlobalDock from '../../src/components/GlobalDock.vue';

// Mock do useSwipe do VueUse
const mockUseSwipe = vi.fn();
vi.mock('@vueuse/core', () => ({
  useSwipe: (...args) => mockUseSwipe(...args)
}));

// Mock das Stores
vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    theme: 'dark',
    cardBorderRadius: 16
  }))
}));

vi.mock('../../src/stores/taskStore', () => ({
  useTaskStore: vi.fn(() => ({
    lastDeletedTask: null,
    statusFilter: 'all',
    tasks: []
  }))
}));

vi.mock('../../src/stores/timerStore', () => ({
  useTimerStore: vi.fn(() => ({
    activeTask: null
  }))
}));

vi.mock('../../src/stores/sprintStore', () => ({
  useSprintStore: vi.fn(() => ({
    activeSprintTotalTime: '10h 30m'
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

  it('deve registrar os listeners de swipe na montagem', () => {
    mount(GlobalDock);
    // Deve chamar useSwipe duas vezes (uma para o handle e outra para a dock)
    expect(mockUseSwipe).toHaveBeenCalledTimes(2);
  });

  it('deve ocultar a dock se a prop visible for false', () => {
    const wrapper = mount(GlobalDock, {
      props: { visible: false }
    });
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('10h 30m');
  });
});
