import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import SettingsModal from '../../src/components/SettingsModal.vue';

const { settings } = vi.hoisted(() => ({ settings: {
  gitProvider: 'github', githubOwner: 'example', githubRepo: 'TASS', githubToken: 'test-token',
  gitlabUrl: 'https://gitlab.com', gitlabIntegrationMode: 'api', gitlabProjectId: '123', gitlabToken: 'test-token',
  gitlabEnvironments: [], githubEnvironments: [], workDays: [], workStart: '08:00', workEnd: '18:00'
} }));
vi.mock('../../src/stores/settingsStore', () => ({ useSettingsStore: () => settings }));
vi.mock('../../src/stores/taskStore', () => ({ useTaskStore: () => ({}) }));
vi.mock('../../src/stores/uiStore', () => ({ useUIStore: () => ({}) }));
vi.mock('../../src/db.js', () => ({ db: {} }));
vi.mock('../../src/services/backupService', () => ({ backupService: {} }));
vi.mock('../../src/services/googleDriveService', () => ({ googleDriveService: {
  isAuthenticated: () => false, getProfile: () => null, init: vi.fn()
} }));
vi.mock('../../src/services/nextcloudService.js', () => ({ nextcloudService: {
  isAuthenticated: () => false, initialize: vi.fn()
} }));
vi.mock('../../src/composables/useTabSwipe', () => ({ useTabSwipe: () => ({}) }));
vi.mock('@vuepic/vue-datepicker', () => ({ VueDatePicker: { template: '<div />' } }));

beforeEach(() => vi.unstubAllGlobals());
describe('SettingsModal: teste de conexão Git', () => {
  it.each(['github', 'gitlab'])('mantém o sucesso da conexão %s sem chamar funções inexistentes', async provider => {
    settings.gitProvider = provider;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ full_name: 'example/TASS', name_with_namespace: 'Example / TASS' }) });
    vi.stubGlobal('fetch', fetchMock);
    const wrapper = shallowMount(SettingsModal, { global: { stubs: { RouterLink: true } } });
    await flushPromises();
    await wrapper.vm.$.setupState.testGitConnection();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(wrapper.vm.$.setupState.testGitStatus).toBe('success');
    expect(wrapper.vm.$.setupState.testGitMessage).toContain('Conectado!');
    wrapper.unmount();
    vi.unstubAllGlobals();
  });
});
