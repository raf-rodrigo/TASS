import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import GlobalDock from '../../src/components/GlobalDock.vue';
import { useSettingsStore } from '../../src/stores/settingsStore';

// Mock do useSwipe do VueUse
const mockUseSwipe = vi.fn();
vi.mock('@vueuse/core', () => ({
  useSwipe: (...args) => mockUseSwipe(...args)
}));

// Mock das Stores
vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    theme: 'dark',
    cardBorderRadius: 16,
    dockIconSize: 16,
    dockBackgroundEnabled: true,
    dockOpacity: 80,
    normalizedDockOpacity: 0.2,
    globalGlassEnabled: true,
    dockVisibleItems: {
      addTask: true,
      workedHours: true,
      sprints: true,
      weather: true,
      filters: true,
      gitRebuilder: true,
      radio: true,
      notes: true,
      themeToggle: true,
      settings: true
    }
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

  it('deve ocultar o botão de adicionar tarefa se configurado como oculto', () => {
    useSettingsStore.mockReturnValueOnce({
      theme: 'dark',
      cardBorderRadius: 16,
      dockIconSize: 16,
      dockBackgroundEnabled: true,
      dockOpacity: 80,
      normalizedDockOpacity: 0.2,
      globalGlassEnabled: true,
      dockVisibleItems: {
        addTask: false,
        workedHours: true,
        sprints: true,
        weather: true,
        filters: true,
        gitRebuilder: true,
        radio: true,
        notes: true,
        themeToggle: true,
        settings: true
      }
    });

    const wrapper = mount(GlobalDock);
    const buttons = wrapper.findAll('button');
    const hasPlus = buttons.some(b => b.html().includes('Plus') || b.attributes('data-tip') === 'Nova Tarefa (n)');
    expect(hasPlus).toBe(false);
  });

  it('deve ocultar o marcador de horas trabalhadas se configurado como oculto', () => {
    useSettingsStore.mockReturnValueOnce({
      theme: 'dark',
      cardBorderRadius: 16,
      dockIconSize: 16,
      dockBackgroundEnabled: true,
      dockOpacity: 80,
      normalizedDockOpacity: 0.2,
      globalGlassEnabled: true,
      dockVisibleItems: {
        addTask: true,
        workedHours: false,
        sprints: true,
        weather: true,
        filters: true,
        gitRebuilder: true,
        radio: true,
        notes: true,
        themeToggle: true,
        settings: true
      }
    });

    const wrapper = mount(GlobalDock);
    expect(wrapper.text()).not.toContain('10h 30m');
  });

  it('deve aplicar o tamanho correto de ícone especificado na store', () => {
    useSettingsStore.mockReturnValueOnce({
      theme: 'dark',
      cardBorderRadius: 16,
      dockIconSize: 22,
      dockBackgroundEnabled: true,
      dockOpacity: 80,
      normalizedDockOpacity: 0.2,
      globalGlassEnabled: true,
      dockVisibleItems: {
        addTask: true,
        workedHours: true,
        sprints: true,
        weather: true,
        filters: true,
        gitRebuilder: true,
        radio: true,
        notes: true,
        themeToggle: true,
        settings: true
      }
    });

    const wrapper = mount(GlobalDock);
    const plusIcon = wrapper.findComponent({ name: 'Plus' });
    if (plusIcon.exists()) {
      expect(plusIcon.props('size')).toBe(22);
    }
  });

  it('deve ocultar a doca completamente se todos os itens configurados forem ocultados', () => {
    useSettingsStore.mockReturnValueOnce({
      theme: 'dark',
      cardBorderRadius: 16,
      dockIconSize: 16,
      dockBackgroundEnabled: true,
      dockOpacity: 80,
      normalizedDockOpacity: 0.2,
      globalGlassEnabled: true,
      dockVisibleItems: {
        addTask: false,
        workedHours: false,
        sprints: false,
        weather: false,
        filters: false,
        gitRebuilder: false,
        radio: false,
        notes: false,
        themeToggle: false,
        settings: false
      }
    });

    const wrapper = mount(GlobalDock);
    expect(wrapper.find('.dynamic-island').exists()).toBe(false);
  });

  it('deve remover borda, sombra e anel se o fundo da doca estiver desabilitado', () => {
    useSettingsStore.mockReturnValueOnce({
      theme: 'dark',
      cardBorderRadius: 16,
      dockIconSize: 16,
      dockBackgroundEnabled: false,
      dockOpacity: 80,
      normalizedDockOpacity: 0.2,
      globalGlassEnabled: true,
      dockVisibleItems: {
        addTask: true,
        workedHours: true,
        sprints: true,
        weather: true,
        filters: true,
        gitRebuilder: true,
        radio: true,
        notes: true,
        themeToggle: true,
        settings: true
      }
    });

    const wrapper = mount(GlobalDock);
    const island = wrapper.find('.dynamic-island');
    expect(island.classes()).toContain('border-transparent');
    expect(island.classes()).toContain('shadow-none');
    expect(island.classes()).toContain('ring-0');
  });

  it('deve aplicar a opacidade da Doca especificada de forma independente', () => {
    useSettingsStore.mockReturnValueOnce({
      theme: 'dark',
      cardBorderRadius: 16,
      dockIconSize: 16,
      dockBackgroundEnabled: true,
      dockOpacity: 50,
      normalizedDockOpacity: 0.5,
      globalGlassEnabled: true,
      dockVisibleItems: {
        addTask: true,
        workedHours: true,
        sprints: true,
        weather: true,
        filters: true,
        gitRebuilder: true,
        radio: true,
        notes: true,
        themeToggle: true,
        settings: true
      }
    });

    const wrapper = mount(GlobalDock);
    const island = wrapper.find('.dynamic-island');
    expect(island.attributes('style')).toContain('rgba(var(--app-bg-raw), 0.5)');
  });
});
