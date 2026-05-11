import { describe, it, expect, vi, beforeEach } from 'vitest';
import { backupService } from '../../src/services/backupService';

// Mock do DB Dexie
vi.mock('../../src/db.js', () => ({
  db: {
    tasks: { toArray: vi.fn(), bulkPut: vi.fn() },
    sprints: { toArray: vi.fn(), bulkPut: vi.fn() },
    settings: { toArray: vi.fn(), bulkPut: vi.fn() },
    notes: { toArray: vi.fn(), bulkPut: vi.fn() }
  }
}));

// Mock do notificationService
vi.mock('../../src/services/notificationService', () => ({
  notificationService: {
    toast: vi.fn(),
    alert: vi.fn()
  }
}));

describe('backupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock do download para evitar erros de DOM real
    vi.spyOn(backupService, 'downloadJson').mockImplementation(() => {});
  });

  describe('exportSystem', () => {
    it('deve coletar dados de todas as tabelas e chamar downloadJson', async () => {
      const { db } = await import('../../src/db.js');
      db.tasks.toArray.mockResolvedValue([{ id: 1, title: 'Task 1' }]);
      db.sprints.toArray.mockResolvedValue([{ id: 10 }]);
      db.settings.toArray.mockResolvedValue([{ key: 'theme', value: 'dark' }]);
      db.notes.toArray.mockResolvedValue([{ content: 'Nota 1' }]);

      await backupService.exportSystem();

      expect(backupService.downloadJson).toHaveBeenCalledWith(
        expect.objectContaining({
          tasks: expect.arrayContaining([{ id: 1, title: 'Task 1' }]),
          version: '1.0'
        }),
        'tass_full_system_backup.json'
      );
    });
  });

  describe('importTasks', () => {
    it('deve processar um arquivo JSON e salvar no banco de dados', async () => {
      const { db } = await import('../../src/db.js');
      const mockTaskStore = { loadTasks: vi.fn() };
      const mockFileContent = JSON.stringify([{ id: 1, title: 'Importada' }]);
      const mockFile = new Blob([mockFileContent], { type: 'application/json' });

      // Simula o comportamento do FileReader
      const importPromise = backupService.importTasks(mockFile, mockTaskStore);
      
      // Dexie bulkPut é chamado após o parse do JSON
      await importPromise;

      expect(db.tasks.bulkPut).toHaveBeenCalledWith([{ id: 1, title: 'Importada' }]);
      expect(mockTaskStore.loadTasks).toHaveBeenCalled();
    });

    it('deve disparar um alerta se o formato do arquivo for inválido', async () => {
      const { notificationService } = await import('../../src/services/notificationService');
      const mockTaskStore = { loadTasks: vi.fn() };
      const mockFile = new Blob(['invalid-json'], { type: 'application/json' });

      await expect(backupService.importTasks(mockFile, mockTaskStore)).rejects.toThrow();
      expect(notificationService.alert).toHaveBeenCalledWith(
        'Falha na importação', 
        expect.any(String), 
        'error'
      );
    });
  });
});
