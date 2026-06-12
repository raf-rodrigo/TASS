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
   * Exporta as paletas de cores para JSON
   */
  exportPalettes(settingsStore) {
    try {
      const data = {
        titlePalette: settingsStore.titlePalette || [],
        bodyPalette: settingsStore.bodyPalette || [],
        textLightPalette: settingsStore.textLightPalette || [],
        textDarkPalette: settingsStore.textDarkPalette || []
      };
      this.downloadJson(data, 'tass_paletas_customizadas.json');
      notificationService.toast('Paletas exportadas com sucesso!');
    } catch (error) {
      console.error("Palette export failed:", error);
      notificationService.alert('Falha na exportação', 'Não foi possível exportar as paletas.', 'error');
    }
  },


  /**
   * Obtém todo o sistema (Tarefas, Sprints, Configs, Notas) em um objeto
   */
  async getFullBackupData() {
    return {
      tasks: await db.tasks.toArray(),
      sprints: await db.sprints.toArray(),
      settings: await db.settings.toArray(),
      notes: await db.notes.toArray(),
      radios: await db.radios.toArray(),
      taskStyles: await db.taskStyles.toArray(),
      version: '1.0',
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Exporta todo o sistema (Tarefas, Sprints, Configs, Notas)
   */
  async exportSystem() {
    try {
      const fullData = await this.getFullBackupData();
      this.downloadJson(fullData, 'tass_full_system_backup.json');
      notificationService.toast('Backup completo exportado!');
    } catch (error) {
      console.error("System export failed:", error);
      notificationService.alert('Falha na exportação', 'Erro ao gerar backup completo.', 'error');
    }
  },

  /**
   * Importa tarefas de um arquivo JSON (Merge Seguro)
   */
  async importTasks(file, taskStore) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const tasksData = Array.isArray(data) ? data : (data.tasks || null);
          
          if (!tasksData) throw new Error("Formato inválido");

          // Processamento para Merge Seguro
          const processedTasks = tasksData.map(task => {
            // Remove o ID para que o Dexie gere um novo
            const { id, ...taskWithoutId } = task;
            return {
              ...taskWithoutId,
              sprintId: 'all',      // Desvincula de sprints órfãs
              isRunning: false,     // Garante que não venha rodando
              lastStartTime: null   // Limpa estado do timer
            };
          });
          
          await db.tasks.bulkAdd(processedTasks);
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
   * Aplica os dados de um backup ao banco de dados e atualiza as stores
   */
  async applyBackupData(data, settingsStore, taskStore) {
    try {
      if (!data.tasks || !data.settings) throw new Error("Backup incompleto");

      // Importação sequencial e limpa
      if (data.tasks) {
        const stoppedTasks = data.tasks.map(task => ({
          ...task,
          isRunning: false,
          lastStartTime: null
        }));
        await db.tasks.clear();
        await db.tasks.bulkPut(stoppedTasks);
      }
      if (data.sprints) {
        await db.sprints.clear();
        await db.sprints.bulkPut(data.sprints);
      }
      if (data.settings) {
        await db.settings.clear();
        await db.settings.bulkPut(data.settings);
      }
      if (data.notes) {
        await db.notes.clear();
        await db.notes.bulkPut(data.notes);
      }
      if (data.radios) {
        await db.radios.clear();
        await db.radios.bulkPut(data.radios);
      }
      if (data.taskStyles) {
        await db.taskStyles.clear();
        await db.taskStyles.bulkPut(data.taskStyles);
      }
      
      await settingsStore.loadSettings();
      await taskStore.loadTasks();
      
      notificationService.toast('Sistema restaurado! Recarregando...', 'success');
      
      // Força o recarregamento da página para garantir que todas as stores (Radio, Notes, etc.)
      // inicializem com os dados novos do banco de dados perfeitamente.
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
      return true;
    } catch (error) {
      console.error("Failed to apply backup data:", error);
      notificationService.alert('Falha na restauração', 'O conteúdo do backup é inválido ou está incompleto.', 'error');
      return false;
    }
  },

  /**
   * Restaura o sistema completo a partir de um arquivo
   */
  async importSystem(file, settingsStore, taskStore) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const success = await this.applyBackupData(data, settingsStore, taskStore);
          if (success) resolve();
          else reject(new Error("Apply failed"));
        } catch (error) {
          notificationService.alert('Erro de Leitura', 'Não foi possível ler o arquivo de backup.', 'error');
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
