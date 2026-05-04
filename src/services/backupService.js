import { db } from '../db.js';
import { notificationService } from './notificationService';

export const backupService = {
  /**
   * Exporta apenas as tarefas para JSON
   */
  async exportTasks() {
    try {
      const data = await db.tasks.toArray();
      this.downloadJson(data, 'tass_tasks_backup.json');
      notificationService.toast('Backup de tarefas exportado!');
    } catch (error) {
      console.error("Export failed:", error);
      notificationService.alert('Falha na exportação', 'Não foi possível gerar o arquivo.', 'error');
    }
  },

  /**
   * Exporta todo o sistema (Tarefas, Sprints, Configs, Notas)
   */
  async exportSystem() {
    try {
      const fullData = {
        tasks: await db.tasks.toArray(),
        sprints: await db.sprints.toArray(),
        settings: await db.settings.toArray(),
        notes: await db.notes.toArray(),
        version: '1.0',
        timestamp: new Date().toISOString()
      };
      this.downloadJson(fullData, 'tass_full_system_backup.json');
      notificationService.toast('Backup completo exportado!');
    } catch (error) {
      console.error("System export failed:", error);
      notificationService.alert('Falha na exportação', 'Erro ao gerar backup completo.', 'error');
    }
  },

  /**
   * Importa tarefas de um arquivo JSON
   */
  async importTasks(file, taskStore) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const tasks = Array.isArray(data) ? data : (data.tasks || null);
          
          if (!tasks) throw new Error("Formato inválido");
          
          await db.tasks.bulkPut(tasks);
          await taskStore.loadTasks();
          notificationService.toast('Tarefas importadas com sucesso!');
          resolve();
        } catch (error) {
          notificationService.alert('Falha na importação', 'Arquivo de tarefas inválido.', 'error');
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  },

  /**
   * Restaura o sistema completo
   */
  async importSystem(file, settingsStore, taskStore) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.tasks || !data.settings) throw new Error("Backup incompleto");

          // Importação sequencial
          if (data.tasks) await db.tasks.bulkPut(data.tasks);
          if (data.sprints) await db.sprints.bulkPut(data.sprints);
          if (data.settings) await db.settings.bulkPut(data.settings);
          if (data.notes) await db.notes.bulkPut(data.notes);
          
          await settingsStore.loadSettings();
          await taskStore.loadTasks();
          await taskStore.loadSprints();
          
          notificationService.toast('Sistema restaurado com sucesso!');
          resolve();
        } catch (error) {
          notificationService.alert('Falha na restauração', 'O arquivo não é um backup válido.', 'error');
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  },

  /**
   * Helper para disparar o download no navegador
   */
  downloadJson(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
};
