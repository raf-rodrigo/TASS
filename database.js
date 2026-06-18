import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'tass-db.json');

// Inicialização padrão do banco de dados JSON
const defaultDb = {
  tasks: [],
  sprints: [],
  settings: {},
  notes: [],
  radios: [],
  taskStyles: []
};

// Carrega os dados do arquivo JSON
async function loadDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Cria o arquivo se ele não existir
      await saveDb(defaultDb);
      return defaultDb;
    }
    console.error('[TASS Database] Erro ao carregar o banco JSON:', error);
    return defaultDb;
  }
}

// Salva os dados de forma atômica no arquivo JSON
async function saveDb(data) {
  try {
    const tempPath = `${dbPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempPath, dbPath);
  } catch (error) {
    console.error('[TASS Database] Erro ao salvar o banco JSON:', error);
    throw error;
  }
}

// Operações auxiliares exportadas para o backend
export const database = {
  // --- Sprints ---
  async getSprints() {
    const db = await loadDb();
    return db.sprints || [];
  },
  async saveSprint(sprint) {
    const db = await loadDb();
    if (!db.sprints) db.sprints = [];
    
    if (sprint.id) {
      const idx = db.sprints.findIndex(s => s.id === sprint.id);
      if (idx !== -1) db.sprints[idx] = sprint;
    } else {
      sprint.id = db.sprints.length > 0 ? Math.max(...db.sprints.map(s => s.id)) + 1 : 1;
      db.sprints.push(sprint);
    }
    await saveDb(db);
    return sprint;
  },
  async deleteSprint(id) {
    const db = await loadDb();
    db.sprints = (db.sprints || []).filter(s => s.id !== id);
    // Também limpa o sprintId das tarefas pertencentes a este sprint
    db.tasks = (db.tasks || []).map(t => t.sprintId === id ? { ...t, sprintId: null } : t);
    await saveDb(db);
    return true;
  },

  // --- Tasks ---
  async getTasks() {
    const db = await loadDb();
    return db.tasks || [];
  },
  async saveTask(task) {
    const db = await loadDb();
    if (!db.tasks) db.tasks = [];

    if (task.id) {
      const idx = db.tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        db.tasks[idx] = { ...db.tasks[idx], ...task };
      }
    } else {
      task.id = db.tasks.length > 0 ? Math.max(...db.tasks.map(t => t.id)) + 1 : 1;
      db.tasks.push(task);
    }
    await saveDb(db);
    return task;
  },
  async saveTasksBatch(tasks) {
    const db = await loadDb();
    if (!db.tasks) db.tasks = [];

    tasks.forEach(updatedTask => {
      const idx = db.tasks.findIndex(t => t.id === updatedTask.id);
      if (idx !== -1) {
        db.tasks[idx] = { ...db.tasks[idx], ...updatedTask };
      } else {
        db.tasks.push(updatedTask);
      }
    });
    await saveDb(db);
    return true;
  },
  async deleteTask(id) {
    const db = await loadDb();
    db.tasks = (db.tasks || []).filter(t => t.id !== id);
    await saveDb(db);
    return true;
  },

  // --- Settings ---
  async getSettings() {
    const db = await loadDb();
    return db.settings || {};
  },
  async saveSetting(key, value) {
    const db = await loadDb();
    if (!db.settings) db.settings = {};
    db.settings[key] = value;
    await saveDb(db);
    return { key, value };
  },

  // --- Notes ---
  async getNotes() {
    const db = await loadDb();
    return db.notes || [];
  },
  async saveNote(note) {
    const db = await loadDb();
    if (!db.notes) db.notes = [];

    if (note.id) {
      const idx = db.notes.findIndex(n => n.id === note.id);
      if (idx !== -1) {
        db.notes[idx] = { ...db.notes[idx], ...note, updatedAt: new Date().toISOString() };
      }
    } else {
      note.id = db.notes.length > 0 ? Math.max(...db.notes.map(n => n.id)) + 1 : 1;
      note.updatedAt = new Date().toISOString();
      db.notes.push(note);
    }
    await saveDb(db);
    return note;
  },
  async deleteNote(id) {
    const db = await loadDb();
    db.notes = (db.notes || []).filter(n => n.id !== id);
    await saveDb(db);
    return true;
  },

  // --- Radios ---
  async getRadios() {
    const db = await loadDb();
    return db.radios || [];
  },
  async saveRadio(radio) {
    const db = await loadDb();
    if (!db.radios) db.radios = [];

    if (radio.id) {
      const idx = db.radios.findIndex(r => r.id === radio.id);
      if (idx !== -1) {
        db.radios[idx] = { ...db.radios[idx], ...radio };
      }
    } else {
      radio.id = db.radios.length > 0 ? Math.max(...db.radios.map(r => r.id)) + 1 : 1;
      db.radios.push(radio);
    }
    await saveDb(db);
    return radio;
  },
  async deleteRadio(id) {
    const db = await loadDb();
    db.radios = (db.radios || []).filter(r => r.id !== id);
    await saveDb(db);
    return true;
  },

  // --- Task Styles ---
  async getTaskStyles() {
    const db = await loadDb();
    return db.taskStyles || [];
  },
  async saveTaskStyles(styles) {
    const db = await loadDb();
    db.taskStyles = styles;
    await saveDb(db);
    return true;
  },

  // --- Importação de Migração de Dados ---
  async importAllData(data) {
    const db = await loadDb();
    if (data.tasks) db.tasks = data.tasks;
    if (data.sprints) db.sprints = data.sprints;
    if (data.settings) {
      // Se for um array vindo direto do Dexie, converte para objeto key/value
      if (Array.isArray(data.settings)) {
        db.settings = {};
        data.settings.forEach(s => {
          db.settings[s.key] = s.value !== undefined ? s.value : s;
        });
      } else {
        db.settings = data.settings;
      }
    }
    if (data.notes) db.notes = data.notes;
    if (data.radios) db.radios = data.radios;
    if (data.taskStyles) db.taskStyles = data.taskStyles;

    await saveDb(db);
    console.log('[TASS Database] Importação de migração realizada com sucesso!');
    return true;
  }
};
