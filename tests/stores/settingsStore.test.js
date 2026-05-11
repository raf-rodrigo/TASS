import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { db } from '../../src/db.js';

// Mocks do DB
vi.mock('../../src/db.js', () => ({
  db: {
    settings: {
      toArray: vi.fn(),
      put: vi.fn(),
      bulkPut: vi.fn()
    }
  }
}));

describe('SettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  it('deve carregar configurações do banco de dados na inicialização', async () => {
    const store = useSettingsStore();
    db.settings.toArray.mockResolvedValue([
      { key: 'app-theme', value: 'light' },
      { key: 'app-columns', value: 4 }
    ]);

    await store.loadSettings();

    expect(store.theme).toBe('light');
    expect(store.columns).toBe(4);
    expect(store.isInitialized).toBe(true);
  });

  it('deve salvar uma configuração individual', async () => {
    const store = useSettingsStore();
    await store.saveSetting('app-theme', 'dark');
    expect(db.settings.put).toHaveBeenCalledWith({ key: 'app-theme', value: 'dark' });
  });

  it('deve realizar auto-upgrade da largura se estiver no padrão antigo', async () => {
    const store = useSettingsStore();
    db.settings.toArray.mockResolvedValue([{ key: 'app-width', value: 1000 }]);

    await store.loadSettings();

    expect(store.appWidth).toBe(1400);
    expect(db.settings.put).toHaveBeenCalledWith({ key: 'app-width', value: 1400 });
  });
});
