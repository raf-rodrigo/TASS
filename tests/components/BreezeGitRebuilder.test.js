import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import GitRebuilder from '../../src/components/breeze/GitRebuilder.vue';
import ActionPanel from '../../src/components/breeze/ActionPanel.vue';
import BranchList from '../../src/components/breeze/BranchList.vue';

const environments = [
  { id: 'base', branch: 'stable', alias: 'Produção' },
  { id: 'target', branch: 'quality', alias: 'Qualidade' }
];

const settingsStore = vi.hoisted(() => ({
  gitProvider: 'gitlab',
  gitlabProjectId: '123',
  gitlabToken: 'token',
  githubOwner: '',
  githubRepo: '',
  githubToken: '',
  activeEnvironments: [
    { id: 'base', branch: 'stable', alias: 'Produção' },
    { id: 'target', branch: 'quality', alias: 'Qualidade' }
  ],
  activeBaseEnvironmentId: 'base',
  activeBaseEnvironment: { id: 'base', branch: 'stable', alias: 'Produção' },
  activeBaseBranch: 'stable',
  consoleFontSize: 11,
  saveSetting: vi.fn()
}));

const gitProviderService = vi.hoisted(() => ({
  getProviderName: vi.fn(() => 'GitLab'),
  breezeGetBranches: vi.fn(async () => []),
  breezeCheckMergeStatus: vi.fn(async () => ({
    status: 'mergeable',
    message: 'Merge disponível.'
  })),
  breezeCloseMergeRequest: vi.fn(async () => undefined),
  breezeExecuteMergeRequest: vi.fn(async () => undefined),
  breezeCreateBranch: vi.fn(async () => undefined),
  breezeDeleteBranch: vi.fn(async () => undefined)
}));

vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: () => settingsStore
}));

vi.mock('../../src/services/gitProvider', () => ({
  gitProviderService
}));

const BaseModalStub = {
  name: 'BaseModal',
  props: ['title'],
  emits: ['close', 'cancel', 'ok', 'maximized-change'],
  template: `
    <div data-test="base-modal">
      <slot name="header-actions" />
      <slot name="sidebar" />
      <slot />
      <slot name="footer" />
    </div>
  `
};

const mountBreeze = () => shallowMount(GitRebuilder, {
  global: {
    stubs: {
      BaseModal: BaseModalStub
    }
  }
});

describe('Breeze GitRebuilder', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.head.querySelectorAll('link[href="/breeze-favicon.png"]').forEach(link => link.remove());
  });

  it('descarta a seleção oculta ao iniciar uma nova busca', async () => {
    vi.useFakeTimers();
    const wrapper = mountBreeze();
    const branchList = wrapper.findComponent(BranchList);

    branchList.vm.$emit('toggle-selection', 'feature/antiga');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(ActionPanel).props('selectedBranches')).toEqual(['feature/antiga']);

    branchList.vm.$emit('update:searchQuery', 'feature/nova');
    branchList.vm.$emit('search');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(ActionPanel).props('selectedBranches')).toEqual([]);

    branchList.vm.$emit('toggle-selection', 'feature/nova');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(ActionPanel).props('selectedBranches')).toEqual(['feature/nova']);

    wrapper.unmount();
  });

  it('limpa a branch de origem quando a tentativa de merge é cancelada', async () => {
    const wrapper = mountBreeze();
    const branchList = wrapper.findComponent(BranchList);

    branchList.vm.$emit('toggle-selection', 'feature/antiga');
    await wrapper.vm.$nextTick();

    wrapper.findComponent(ActionPanel).vm.$emit('merge-to-target', environments[1]);
    await flushPromises();

    const confirmationModal = wrapper.findAllComponents(BaseModalStub)
      .find(modal => modal.props('title') === 'Confirmar Mesclagem de Branch');

    expect(confirmationModal).toBeDefined();
    confirmationModal.vm.$emit('cancel');
    await flushPromises();

    expect(wrapper.findComponent(ActionPanel).props('selectedBranches')).toEqual([]);
    wrapper.unmount();
  });
});
