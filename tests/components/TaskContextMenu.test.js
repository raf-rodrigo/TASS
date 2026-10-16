import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TaskContextMenu from '../../src/components/TaskContextMenu.vue';

const settings = vi.hoisted(() => ({
  contextMenuStyle: 'floating',
  contextMenuMode: 'stack',
  gitProvider: 'gitlab'
}));

const taskStore = vi.hoisted(() => ({
  contextMenuPosition: { x: 120, y: 90 },
  updateTask: vi.fn(),
  cloneTask: vi.fn(),
  toggleTaskCompletion: vi.fn(),
  deleteTask: vi.fn()
}));

const uiStore = vi.hoisted(() => ({
  openTaskModal: vi.fn(),
  openTimeAdjustment: vi.fn(),
  previewTaskId: null,
  previewStyleId: null,
  triggerPresetAnimation: vi.fn()
}));

vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: () => settings
}));

vi.mock('../../src/stores/taskStore', () => ({
  useTaskStore: () => taskStore
}));

vi.mock('../../src/stores/timerStore', () => ({
  useTimerStore: () => ({
    resetTaskTime: vi.fn(),
    toggleTimer: vi.fn()
  })
}));

vi.mock('../../src/stores/uiStore', () => ({
  useUIStore: () => uiStore
}));

vi.mock('../../src/stores/taskStyleStore', () => ({
  useTaskStyleStore: () => ({
    sortedStyles: [
      { id: 'style-green', name: 'Green Preset', colors: { bgColor: '#00ff00' } }
    ]
  })
}));

vi.mock('../../src/services/taskActionService', () => ({
  taskActionService: { promptQuickUpdate: vi.fn() }
}));

vi.mock('../../src/services/gitProvider', () => ({
  gitProviderService: {
    hasBranch: vi.fn(() => false),
    getProviderName: vi.fn(() => 'GitLab'),
    handleGitFlow: vi.fn()
  }
}));

vi.mock('../../src/services/notificationService', () => ({
  notificationService: {
    confirm: vi.fn(),
    toast: vi.fn()
  }
}));

const task = {
  id: 42,
  title: 'TSK-42',
  description: 'Card selecionado',
  completed: false,
  isRunning: false,
  styleId: 'style-blue',
  styleLocked: false
};

describe('TaskContextMenu', () => {
  beforeEach(() => {
    settings.contextMenuStyle = 'floating';
    uiStore.previewTaskId = null;
    uiStore.previewStyleId = null;
    vi.clearAllMocks();
  });

  it.each([
    ['Criar branch', 'floating'],
    ['Criar branch', 'dock']
  ])('usa o rótulo "%s" no menu %s', async (label, menuStyle) => {
    settings.contextMenuStyle = menuStyle;
    const wrapper = mount(TaskContextMenu, { props: { task } });

    if (menuStyle === 'floating') {
      expect(wrapper.text()).toContain(label);
      expect(wrapper.text()).not.toContain('Criar Branch Automática');
    } else {
      expect(wrapper.get(`[data-tip="${label}"]`).exists()).toBe(true);
    }

    wrapper.unmount();
  });

  it('abre no hover o mesmo submenu visual e limita a prévia ao card selecionado', async () => {
    const wrapper = mount(TaskContextMenu, { props: { task } });

    await wrapper.get('[data-test="task-presets-container"]').trigger('mouseenter');
    expect(wrapper.get('[data-test="task-presets-submenu"]').isVisible()).toBe(true);

    await wrapper.get('[data-test="preset-option-style-green"]').trigger('mouseenter');

    expect(uiStore.previewTaskId).toBe(task.id);
    expect(uiStore.previewStyleId).toBe('style-green');
    expect(taskStore.updateTask).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('aplica o preset somente ao card selecionado', async () => {
    const wrapper = mount(TaskContextMenu, { props: { task } });

    await wrapper.get('[data-test="task-presets-container"]').trigger('mouseenter');
    await wrapper.get('[data-test="preset-option-style-green"]').trigger('click');

    expect(taskStore.updateTask).toHaveBeenCalledTimes(1);
    expect(taskStore.updateTask).toHaveBeenCalledWith(task.id, { styleId: 'style-green' });
    expect(uiStore.triggerPresetAnimation).toHaveBeenCalledWith(task.id);
    wrapper.unmount();
  });

  it('oferece o mesmo submenu por hover quando o menu do card usa o modo dock', async () => {
    settings.contextMenuStyle = 'dock';
    const wrapper = mount(TaskContextMenu, { props: { task } });

    await wrapper.get('[data-test="task-presets-container-dock"]').trigger('mouseenter');

    expect(wrapper.get('[data-test="task-presets-submenu-dock"]').isVisible()).toBe(true);
    wrapper.unmount();
  });

  it.each(['floating', 'dock'])('não oferece ambientes no menu %s', menuStyle => {
    settings.contextMenuStyle = menuStyle;
    const wrapper = mount(TaskContextMenu, {
      props: {
        task: {
          ...task,
          devUrl: 1,
          homologUrl: 1,
          prodUrl: 1
        }
      }
    });

    expect(wrapper.text()).not.toContain('Ambientes');
    expect(wrapper.text()).not.toMatch(/\b(PRD|HML|DEV)\b/);
    wrapper.unmount();
  });
});
