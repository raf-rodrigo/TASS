import { describe, it, expect, vi, beforeEach } from 'vitest';
import { backupService } from '../../src/services/backupService';

// Mock do DB Dexie
vi.mock('../../src/db.js', () => ({
  db: {
    tasks: { toArray: vi.fn(), bulkPut: vi.fn(), bulkAdd: vi.fn() },
    sprints: { toArray: vi.fn(), bulkPut: vi.fn() },
    settings: { toArray: vi.fn(), bulkPut: vi.fn() },
    notes: { toArray: vi.fn(), bulkPut: vi.fn() },
    radios: { toArray: vi.fn(), bulkPut: vi.fn(), clear: vi.fn() },
    taskStyles: { toArray: vi.fn(), bulkPut: vi.fn(), clear: vi.fn() }
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
      db.radios.toArray.mockResolvedValue([{ id: 1, name: 'Radio 1' }]);
      db.taskStyles.toArray.mockResolvedValue([{ id: 1, name: 'Style 1' }]);

      await backupService.exportSystem();

      expect(backupService.downloadJson).toHaveBeenCalledWith(
        expect.objectContaining({
          tasks: expect.arrayContaining([{ id: 1, title: 'Task 1' }]),
          radios: expect.arrayContaining([{ id: 1, name: 'Radio 1' }]),
          version: '1.0'
        }),
        'tass_full_system_backup.json'
      );
    });
  });

  describe('importTasks', () => {
    it('deve realizar um Merge Seguro (remover ID, resetar status e usar bulkAdd)', async () => {
      const { db } = await import('../../src/db.js');
      const mockTaskStore = { loadTasks: vi.fn() };
      const originalTask = { id: 1, title: 'Importada', sprintId: '123', isRunning: true, lastStartTime: 5000 };
      const mockFileContent = JSON.stringify([originalTask]);
      const mockFile = new Blob([mockFileContent], { type: 'application/json' });

      // Simula o comportamento do FileReader
      const importPromise = backupService.importTasks(mockFile, mockTaskStore);
      
      await importPromise;

      // Verifica se o bulkAdd foi chamado com a tarefa processada
      expect(db.tasks.bulkAdd).toHaveBeenCalledWith([
        { 
          title: 'Importada', 
          sprintId: 'all', 
          isRunning: false, 
          lastStartTime: null 
        }
      ]);
      // Garante que o ID foi removido (não está presente no objeto enviado ao bulkAdd)
      const calledWith = db.tasks.bulkAdd.mock.calls[0][0][0];
      expect(calledWith.id).toBeUndefined();
      
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
