import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'tass-db.json');

// Inicialização padrão do banco de dados JSON para multiusuário
const defaultDb = {
  users: [],
  tasks: [],
  sprints: [],
  settings: {}, // Armazenado como { "key": { "userId": value } }
  notes: [],
  radios: [],
  taskStyles: []
};

// Cache em memória para evitar leituras de disco repetidas e condições de corrida de escrita
let cachedDb = null;

// Carrega os dados do arquivo JSON
async function loadDb() {
  if (cachedDb) {
    return cachedDb;
  }
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    cachedDb = JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      cachedDb = JSON.parse(JSON.stringify(defaultDb));
      await saveDb(cachedDb);
      return cachedDb;
    }
    console.error('[TASS Database] Erro ao carregar o banco JSON:', error);
    cachedDb = JSON.parse(JSON.stringify(defaultDb));
  }
  
  if (!cachedDb.users) cachedDb.users = [];
  if (!cachedDb.tasks) cachedDb.tasks = [];
  if (!cachedDb.sprints) cachedDb.sprints = [];
  if (!cachedDb.settings) cachedDb.settings = {};
  if (!cachedDb.notes) cachedDb.notes = [];
  if (!cachedDb.radios) cachedDb.radios = [];
  if (!cachedDb.taskStyles) cachedDb.taskStyles = [];
  return cachedDb;
}

// Fila para garantir escritas sequenciais (sem concorrência de rename)
let writeQueue = Promise.resolve();

// Salva os dados de forma sequencial no arquivo JSON
async function saveDb(data) {
  cachedDb = data; // Garante que o cache em memória esteja sempre atualizado
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const tempPath = `${dbPath}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
        await fs.rename(tempPath, dbPath);
        resolve();
      } catch (error) {
        console.error('[TASS Database] Erro ao salvar o banco JSON:', error);
        reject(error);
        throw error; // Propaga para que a fila saiba da falha, mas limpe
      }
    }).catch(() => {
      // Consome o erro para evitar que a fila de escrita permaneça em estado rejeitado
    });
  });
}

// Operações auxiliares exportadas para o backend
export const database = {
  // --- Autenticação & Usuários ---
  async findUserByUsername(username) {
    const db = await loadDb();
    return db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  async createUser(username, password) {
    const db = await loadDb();
    const existing = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      throw new Error('Usuário já existe.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = {
      id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
      username,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    await saveDb(db);
    return { id: newUser.id, username: newUser.username };
  },

  async getUsers() {
    const db = await loadDb();
    return (db.users || []).map(u => ({ id: u.id, username: u.username }));
  },

  // --- Sprints ---
  async getSprints(userId, filterUserId = null) {
    const db = await loadDb();
    const sprints = db.sprints || [];
    if (filterUserId === 'all') {
      return sprints;
    } else if (filterUserId !== null) {
      const targetId = Number(filterUserId);
      return sprints.filter(s => s.userId === targetId);
    }
    return sprints.filter(s => s.userId === userId);
  },
  async saveSprint(userId, sprint) {
    const db = await loadDb();
    sprint.userId = userId;
    
    if (sprint.id) {
      const idx = db.sprints.findIndex(s => s.id === sprint.id && s.userId === userId);
      if (idx !== -1) {
        db.sprints[idx] = { ...db.sprints[idx], ...sprint };
      }
    } else {
      sprint.id = db.sprints.length > 0 ? Math.max(...db.sprints.map(s => s.id)) + 1 : 1;
      db.sprints.push(sprint);
    }
    await saveDb(db);
    return sprint;
  },
  async deleteSprint(userId, id) {
    const db = await loadDb();
    db.sprints = (db.sprints || []).filter(s => !(s.id === id && s.userId === userId));
    // Desvincula sprintId das tasks associadas ao usuário
    db.tasks = (db.tasks || []).map(t => (t.sprintId === id && t.userId === userId) ? { ...t, sprintId: null } : t);
    await saveDb(db);
    return true;
  },

  // --- Tasks ---
  async getTasks(userId, filterUserId = null) {
    const db = await loadDb();
    let tasks = db.tasks || [];
    
    if (filterUserId === 'all') {
      // return all tasks
    } else if (filterUserId !== null) {
      const targetId = Number(filterUserId);
      tasks = tasks.filter(t => t.userId === targetId);
    } else {
      tasks = tasks.filter(t => t.userId === userId);
    }
    
    return tasks.map(t => {
      const user = db.users.find(u => u.id === t.userId);
      return {
        ...t,
        creatorName: user ? user.username : 'Desconhecido'
      };
    });
  },
  async saveTask(userId, task) {
    const db = await loadDb();

    if (task.id) {
      const idx = db.tasks.findIndex(t => t.id === task.id);
      if (idx !== -1) {
        // Preserva o criador original da tarefa
        task.userId = db.tasks[idx].userId;
        db.tasks[idx] = { ...db.tasks[idx], ...task };
      }
    } else {
      task.userId = userId;
      task.id = db.tasks.length > 0 ? Math.max(...db.tasks.map(t => t.id)) + 1 : 1;
      db.tasks.push(task);
    }
    await saveDb(db);
    return task;
  },
  async saveTasksBatch(userId, tasks) {
    const db = await loadDb();
    if (!db.tasks) db.tasks = [];

    tasks.forEach(updatedTask => {
      const idx = db.tasks.findIndex(t => t.id === updatedTask.id);
      if (idx !== -1) {
        // Preserva o criador original da tarefa
        updatedTask.userId = db.tasks[idx].userId;
        db.tasks[idx] = { ...db.tasks[idx], ...updatedTask };
      } else {
        updatedTask.userId = userId;
        db.tasks.push(updatedTask);
      }
    });
    await saveDb(db);
    return true;
  },
  async deleteTask(userId, id) {
    const db = await loadDb();
    db.tasks = (db.tasks || []).filter(t => t.id !== id);
    await saveDb(db);
    return true;
  },

  // --- Settings ---
  async getSettings(userId) {
    const db = await loadDb();
    const userSettings = {};
    Object.entries(db.settings || {}).forEach(([key, valuesObj]) => {
      if (valuesObj && typeof valuesObj === 'object' && valuesObj[userId] !== undefined) {
        userSettings[key] = valuesObj[userId];
      }
    });
    return userSettings;
  },
  async saveSetting(userId, key, value) {
    const db = await loadDb();
    if (!db.settings) db.settings = {};
    if (!db.settings[key] || typeof db.settings[key] !== 'object') {
      db.settings[key] = {};
    }
    db.settings[key][userId] = value;
    await saveDb(db);
    return { key, value };
  },

  // --- Notes ---
  async getNotes(userId) {
    const db = await loadDb();
    return (db.notes || []).filter(n => n.userId === userId);
  },
  async saveNote(userId, note) {
    const db = await loadDb();
    note.userId = userId;

    if (note.id) {
      const idx = db.notes.findIndex(n => n.id === note.id && n.userId === userId);
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
  async deleteNote(userId, id) {
    const db = await loadDb();
    db.notes = (db.notes || []).filter(n => !(n.id === id && n.userId === userId));
    await saveDb(db);
    return true;
  },

  // --- Radios ---
  async getRadios(userId) {
    const db = await loadDb();
    return (db.radios || []).filter(r => r.userId === userId);
  },
  async saveRadio(userId, radio) {
    const db = await loadDb();
    radio.userId = userId;

    if (radio.id) {
      const idx = db.radios.findIndex(r => r.id === radio.id && r.userId === userId);
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
  async deleteRadio(userId, id) {
    const db = await loadDb();
    db.radios = (db.radios || []).filter(r => !(r.id === id && r.userId === userId));
    await saveDb(db);
    return true;
  },

  // --- Task Styles ---
  async getTaskStyles(userId) {
    const db = await loadDb();
    return (db.taskStyles || []).filter(s => s.userId === userId);
  },
  async saveTaskStyles(userId, styles) {
    const db = await loadDb();
    
    // Filtra estilos antigos do mesmo usuário
    db.taskStyles = (db.taskStyles || []).filter(s => s.userId !== userId);
    
    // Adiciona os novos marcando com o userId
    const mappedStyles = styles.map(s => ({ ...s, userId }));
    db.taskStyles.push(...mappedStyles);
    
    await saveDb(db);
    return true;
  },

  // --- Importação de Migração de Dados ---
  async importAllData(userId, data) {
    const db = await loadDb();
    
    // Limpa dados antigos do usuário antes da migração
    db.tasks = (db.tasks || []).filter(t => t.userId !== userId);
    db.sprints = (db.sprints || []).filter(s => s.userId !== userId);
    db.notes = (db.notes || []).filter(n => n.userId !== userId);
    db.radios = (db.radios || []).filter(r => r.userId !== userId);
    db.taskStyles = (db.taskStyles || []).filter(s => s.userId !== userId);

    if (data.tasks) {
      db.tasks.push(...data.tasks.map(t => ({ ...t, userId })));
    }
    if (data.sprints) {
      db.sprints.push(...data.sprints.map(s => ({ ...s, userId })));
    }
    if (data.settings) {
      let settingsObj = {};
      if (Array.isArray(data.settings)) {
        data.settings.forEach(s => {
          if (s && typeof s === 'object' && s.key !== undefined) {
            settingsObj[s.key] = s.value !== undefined ? s.value : s;
          }
        });
      } else {
        settingsObj = data.settings;
      }
      
      Object.entries(settingsObj).forEach(([key, value]) => {
        if (!db.settings[key] || typeof db.settings[key] !== 'object') {
          db.settings[key] = {};
        }
        db.settings[key][userId] = value;
      });
    }
    if (data.notes) {
      db.notes.push(...data.notes.map(n => ({ ...n, userId })));
    }
    if (data.radios) {
      db.radios.push(...data.radios.map(r => ({ ...r, userId })));
    }
    if (data.taskStyles) {
      db.taskStyles.push(...data.taskStyles.map(s => ({ ...s, userId })));
    }

    await saveDb(db);
    console.log(`[TASS Database] Importação de migração realizada com sucesso para usuário id=${userId}`);
    return true;
  }
};
