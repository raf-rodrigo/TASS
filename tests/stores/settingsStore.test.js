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

  describe('syncWallpapers (Normalização Local)', () => {
    it('deve corrigir URLs locais para a porta 5176 e adicionar isLocal: true', async () => {
      const store = useSettingsStore();
      store.customWallpapers = [
        { name: 'Antigo', url: 'http://localhost:5175/wallpapers/old.jpg' },
        { name: 'Relativo', url: '/wallpapers/relative.jpg' }
      ];

      await store.syncWallpapers();

      expect(store.customWallpapers[0].url).toBe('http://localhost:5176/wallpapers/old.jpg');
      expect(store.customWallpapers[0].isLocal).toBe(true);
      expect(store.customWallpapers[1].url).toBe('http://localhost:5176/wallpapers/relative.jpg');
      expect(store.customWallpapers[1].isLocal).toBe(true);
    });

    it('não deve alterar wallpapers externos', async () => {
      const store = useSettingsStore();
      const externalUrl = 'https://images.unsplash.com/foto.jpg';
      store.customWallpapers = [{ name: 'Externo', url: externalUrl }];

      await store.syncWallpapers();

      expect(store.customWallpapers[0].url).toBe(externalUrl);
      expect(store.customWallpapers[0].isLocal).toBeUndefined();
    });
  });
});
