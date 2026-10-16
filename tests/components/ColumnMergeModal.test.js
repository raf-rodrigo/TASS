import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, shallowMount } from '@vue/test-utils';
import ColumnMergeModal from '../../src/components/ColumnMergeModal.vue';

const gitProviderService = vi.hoisted(() => ({
  getProviderName: vi.fn(() => 'GitLab'),
  breezeCheckMergeStatus: vi.fn(),
  breezeCloseMergeRequest: vi.fn(async () => undefined),
  breezeExecuteMergeRequest: vi.fn(async () => undefined)
}));

const notificationService = vi.hoisted(() => ({
  toast: vi.fn()
}));

vi.mock('../../src/stores/settingsStore.js', () => ({
  useSettingsStore: () => ({ gitProvider: 'gitlab' })
}));

vi.mock('../../src/services/gitProvider.js', () => ({
  gitProviderService
}));

vi.mock('../../src/services/notificationService.js', () => ({
  notificationService
}));

const BaseModalStub = {
  name: 'BaseModal',
  props: ['title', 'okText', 'cancelText', 'okLoading'],
  emits: ['close', 'cancel', 'ok'],
  template: '<div><slot /></div>'
};

const targetEnvironment = {
  id: 'hml',
  branch: 'quality',
  alias: 'Qualidade'
};

const mountModal = () => shallowMount(ColumnMergeModal, {
  props: {
    sourceBranch: 'feature/task-1',
    targetEnvironment
  },
  global: {
    stubs: { BaseModal: BaseModalStub }
  }
});

describe('ColumnMergeModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('em caso de conflito informa o resultado e oferece apenas cancelar', async () => {
    gitProviderService.breezeCheckMergeStatus.mockResolvedValue({
      status: 'conflict',
      message: 'Conflito. Arquivos: 2',
      mrIid: 41
    });

    const wrapper = mountModal();
    await flushPromises();

    const baseModal = wrapper.getComponent(BaseModalStub);
    expect(baseModal.props('okText')).toBe('');
    expect(baseModal.props('cancelText')).toBe('Cancelar');
    expect(wrapper.text()).toContain('Conflito. Arquivos: 2');

    baseModal.vm.$emit('cancel');
    await flushPromises();

    expect(gitProviderService.breezeCloseMergeRequest).toHaveBeenCalledWith(
      expect.objectContaining({ gitProvider: 'gitlab' }),
      41
    );
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('libera a ação somente após a análise confirmar que o merge é seguro', async () => {
    gitProviderService.breezeCheckMergeStatus.mockResolvedValue({
      status: 'mergeable',
      message: 'Pode ser mesclado. Arquivos: 3',
      mrIid: 52
    });

    const wrapper = mountModal();
    await flushPromises();

    const baseModal = wrapper.getComponent(BaseModalStub);
    expect(baseModal.props('okText')).toBe('Mesclar');

    baseModal.vm.$emit('ok');
    await flushPromises();

    expect(gitProviderService.breezeExecuteMergeRequest).toHaveBeenCalledWith(
      expect.objectContaining({ gitProvider: 'gitlab' }),
      52
    );
    expect(wrapper.emitted('merged')).toHaveLength(1);
    expect(notificationService.toast).toHaveBeenCalledWith(
      expect.stringContaining("feature/task-1"),
      'success'
    );
  });
});
