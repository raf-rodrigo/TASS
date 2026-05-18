import { describe, it, expect, vi, beforeEach } from 'vitest';
import { googleDriveService } from '../../src/services/googleDriveService';

// Mock do notificationService
vi.mock('../../src/services/notificationService', () => ({
  notificationService: {
    toast: vi.fn(),
    alert: vi.fn()
  }
}));

// Mock global de fetch
global.fetch = vi.fn();

// Mock do objeto google para passar no init
global.google = {
  accounts: {
    oauth2: {
      initTokenClient: vi.fn((config) => ({
        requestAccessToken: () => config.callback({ access_token: 'mock_token', expires_in: 3600 })
      }))
    }
  }
};

describe('googleDriveService - Isolamento e Lógica', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Reset manual de variáveis internas via métodos públicos ou mock
    googleDriveService.clearSession();
    
    // Mock inicial do getUserProfile que ocorre no login
    fetch.mockResolvedValue({ ok: true, json: async () => ({ name: 'Test' }) });
    
    await googleDriveService.init();
    await googleDriveService.login();
    
    // Limpa os mocks após o setup do login para focar nos métodos reais
    vi.clearAllMocks();
  });

  describe('getOrCreateFolder', () => {
    it('deve buscar e retornar pasta TASS existente', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [{ id: 'folder_abc', name: 'TASS', mimeType: 'application/vnd.google-apps.folder' }]
        })
      });

      const id = await googleDriveService.getOrCreateFolder();
      expect(id).toBe('folder_abc');
    });

    it('deve criar a pasta TASS se não existir', async () => {
      // 1. Busca retorna vazio
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] })
      });
      // 2. Criação da pasta
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new_folder_xyz' })
      });

      const id = await googleDriveService.getOrCreateFolder();
      expect(id).toBe('new_folder_xyz');
    });
  });

  describe('listImageFiles', () => {
    it('deve retornar lista de imagens da pasta TASS', async () => {
      // 1. getOrCreateFolder (busca)
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [{ id: 'folder_id', name: 'TASS' }] })
      });
      // 2. listagem de imagens
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [{ id: 'img_id', name: 'test.png', thumbnailLink: 'link' }]
        })
      });

      const images = await googleDriveService.listImageFiles();
      expect(images).toHaveLength(1);
      expect(images[0].name).toBe('test.png');
    });
  });

  describe('importWallpaper', () => {
    it('deve comunicar com a API local 5176', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, url: '/wallpapers/hash.jpg' })
      });

      const res = await googleDriveService.importWallpaper('fid', 'name.jpg');
      expect(res.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining(':5176/api/drive/import-wallpaper'), expect.any(Object));
    });
  });
});
