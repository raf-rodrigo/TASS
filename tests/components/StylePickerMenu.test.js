import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import StylePickerMenu from '../../src/components/StylePickerMenu.vue';

const selectedTask = {
  id: 42,
  title: 'TSK-42',
  styleId: 'style-blue'
};

const taskStore = vi.hoisted(() => ({
  tasks: [
    { id: 1, title: 'Outro card', styleId: null },
    { id: 42, title: 'Card selecionado', styleId: 'style-blue' }
  ],
  updateTask: vi.fn()
}));

const uiStore = vi.hoisted(() => ({
  showStylePickerMenu: true,
  stylePickerPosition: { x: 100, y: 100 },
  previewTaskId: 42,
  previewStyleId: 'style-blue',
  triggerPresetAnimation: vi.fn(),
  closeStylePicker: vi.fn()
}));

vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: () => ({})
}));

vi.mock('../../src/stores/taskStore', () => ({
  useTaskStore: () => taskStore
}));

vi.mock('../../src/stores/taskStyleStore', () => ({
  useTaskStyleStore: () => ({
    sortedStyles: [
      { id: 'style-green', name: 'Green Preset', colors: { bgColor: '#00ff00' } }
    ]
  })
}));

vi.mock('../../src/stores/uiStore', () => ({
  useUIStore: () => uiStore
}));

vi.mock('../../src/services/notificationService', () => ({
  notificationService: { toast: vi.fn() }
}));

describe('StylePickerMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    uiStore.showStylePickerMenu = true;
    uiStore.previewTaskId = selectedTask.id;
    uiStore.previewStyleId = selectedTask.styleId;
  });

  it('mantém a prévia associada somente ao card selecionado', async () => {
    const wrapper = mount(StylePickerMenu);
    const presetButton = wrapper.findAll('button')
      .find(button => button.text().includes('Green Preset'));

    await presetButton.trigger('mouseenter');

    expect(uiStore.previewTaskId).toBe(selectedTask.id);
    expect(uiStore.previewStyleId).toBe('style-green');
    expect(taskStore.updateTask).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('aplica o preset somente ao card selecionado', async () => {
    const wrapper = mount(StylePickerMenu);
    const presetButton = wrapper.findAll('button')
      .find(button => button.text().includes('Green Preset'));

    await presetButton.trigger('click');

    expect(taskStore.updateTask).toHaveBeenCalledTimes(1);
    expect(taskStore.updateTask).toHaveBeenCalledWith(selectedTask.id, { styleId: 'style-green' });
    expect(taskStore.updateTask).not.toHaveBeenCalledWith(1, expect.anything());
    expect(uiStore.triggerPresetAnimation).toHaveBeenCalledWith(selectedTask.id);
    expect(uiStore.closeStylePicker).toHaveBeenCalled();
    wrapper.unmount();
  });
});
