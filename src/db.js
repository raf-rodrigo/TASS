import Dexie from 'dexie';

const API_BASE = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  ? ''
  : 'http://localhost:5176';

// Função auxiliar para requisições fetch
export async function apiFetch(url, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-TASS-Client': 'true'
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tass_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const options = {
    method,
    headers
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `API Error: ${res.statusText}`);
  }
  return res.json();
}

// ----------------------------------------------------
// 🚀 PROCESSO DE MIGRAÇÃO AUTOMÁTICA (IndexedDB -> SQLite/JSON)
// ----------------------------------------------------
if (typeof window !== 'undefined' && !localStorage.getItem('tass_migrated')) {
  (async () => {
    try {
      console.log('[TASS Migration] Iniciando verificação de migração de dados...');
      const localDb = new Dexie('TaskManagerDB');
      
      // Define a estrutura para o Dexie conseguir abrir a base antiga
      localDb.version(9).stores({
        tasks: '++id, title, position, sprintId, columnId, styleId',
        sprints: '++id, endDate',
        settings: 'key',
        notes: '++id, content, updatedAt',
        radios: '++id, name, url, stars',
        taskStyles: 'id, name'
      });

      // Verifica se o banco IndexedDB existe
      const exists = await Dexie.exists('TaskManagerDB');
      if (exists) {
        await localDb.open();
        
        const tasks = await localDb.tasks.toArray();
        const sprints = await localDb.sprints.toArray();
        const settings = await localDb.settings.toArray();
        const notes = await localDb.notes.toArray();
        const radios = await localDb.radios.toArray();
        const taskStyles = await localDb.taskStyles.toArray();

        // Se houver qualquer dado local, realiza a migração
        if (tasks.length > 0 || sprints.length > 0 || settings.length > 0 || notes.length > 0 || radios.length > 0) {
          console.log('[TASS Migration] Dados locais encontrados. Migrando para o servidor...');
          await apiFetch('/api/migration/import', 'POST', {
            tasks,
            sprints,
            settings,
            notes,
            radios,
            taskStyles
          });
          console.log('[TASS Migration] Migração concluída com sucesso!');
        } else {
          console.log('[TASS Migration] Nenhum dado local para migrar.');
        }
        
        await localDb.close();
        await Dexie.delete('TaskManagerDB'); // Limpa o banco local
      }
      
      localStorage.setItem('tass_migrated', 'true');
    } catch (err) {
      console.error('[TASS Migration] Falha crítica na migração dos dados:', err);
    }
  })();
}

// ----------------------------------------------------
// 📦 MOCK DO WRAPPER DEXIE.JS PARA AS STORES DO PINIA
// ----------------------------------------------------
export const db = {
  tasks: {
    async toArray() {
      return apiFetch('/api/tasks');
    },
    async add(task) {
      const res = await apiFetch('/api/tasks', 'POST', task);
      return res.id;
    },
    async update(id, updates) {
      await apiFetch(`/api/tasks/${id}`, 'PUT', updates);
      return 1;
    },
    async delete(id) {
      await apiFetch(`/api/tasks/${id}`, 'DELETE');
      return 1;
    },
    async clear() {
      const list = await apiFetch('/api/tasks');
      await Promise.all(list.map(t => apiFetch(`/api/tasks/${t.id}`, 'DELETE')));
      return 1;
    },
    async bulkPut(tasksArray) {
      await Promise.all(tasksArray.map(t => apiFetch('/api/tasks', 'POST', t)));
      return 1;
    }
  },

  sprints: {
    async toArray() {
      return apiFetch('/api/sprints');
    },
    async add(sprint) {
      const res = await apiFetch('/api/sprints', 'POST', sprint);
      return res.id;
    },
    async delete(id) {
      await apiFetch(`/api/sprints/${id}`, 'DELETE');
      return 1;
    },
    async clear() {
      const list = await apiFetch('/api/sprints');
      await Promise.all(list.map(s => apiFetch(`/api/sprints/${s.id}`, 'DELETE')));
      return 1;
    },
    async bulkPut(sprintsArray) {
      await Promise.all(sprintsArray.map(s => apiFetch('/api/sprints', 'POST', s)));
      return 1;
    }
  },

  settings: {
    async toArray() {
      const res = await apiFetch('/api/settings');
      return Object.entries(res).map(([key, value]) => ({ key, value }));
    },
    async put(setting) {
      await apiFetch('/api/settings', 'POST', setting);
      return setting.key;
    },
    async bulkPut(settingsArray) {
      await Promise.all(settingsArray.map(s => apiFetch('/api/settings', 'POST', s)));
      return 1;
    },
    async clear() {
      // Configurações normalmente não são limpas completamente
      return 1;
    }
  },

  notes: {
    async toArray() {
      return apiFetch('/api/notes');
    },
    async add(note) {
      const res = await apiFetch('/api/notes', 'POST', note);
      return res.id;
    },
    async update(id, updates) {
      await apiFetch(`/api/notes/${id}`, 'PUT', updates);
      return 1;
    },
    async delete(id) {
      await apiFetch(`/api/notes/${id}`, 'DELETE');
      return 1;
    },
    async clear() {
      const list = await apiFetch('/api/notes');
      await Promise.all(list.map(n => apiFetch(`/api/notes/${n.id}`, 'DELETE')));
      return 1;
    },
    async bulkPut(notesArray) {
      await Promise.all(notesArray.map(n => apiFetch('/api/notes', 'POST', n)));
      return 1;
    },
    toCollection() {
      return {
        async last() {
          const notes = await apiFetch('/api/notes');
          return notes.length > 0 ? notes[notes.length - 1] : null;
        }
      };
    }
  },

  radios: {
    async toArray() {
      return apiFetch('/api/radios');
    },
    async add(radio) {
      const res = await apiFetch('/api/radios', 'POST', radio);
      return res.id;
    },
    async update(id, updates) {
      await apiFetch('/api/radios', 'POST', { ...updates, id });
      return 1;
    },
    async delete(id) {
      await apiFetch(`/api/radios/${id}`, 'DELETE');
      return 1;
    },
    async bulkPut(radiosArray) {
      await Promise.all(radiosArray.map(r => apiFetch('/api/radios', 'POST', r)));
      return 1;
    },
    async clear() {
      const list = await apiFetch('/api/radios');
      await Promise.all(list.map(r => apiFetch(`/api/radios/${r.id}`, 'DELETE')));
      return 1;
    }
  },

  taskStyles: {
    async toArray() {
      return apiFetch('/api/task-styles');
    },
    async bulkAdd(stylesArray) {
      await apiFetch('/api/task-styles', 'POST', stylesArray);
      return 1;
    },
    async bulkPut(stylesArray) {
      await apiFetch('/api/task-styles', 'POST', stylesArray);
      return 1;
    },
    async clear() {
      await apiFetch('/api/task-styles', 'POST', []);
      return 1;
    },
    async update(id, updates) {
      const styles = await apiFetch('/api/task-styles');
      const idx = styles.findIndex(s => s.id === id);
      if (idx !== -1) {
        styles[idx] = { ...styles[idx], ...updates };
        await apiFetch('/api/task-styles', 'POST', styles);
      }
      return 1;
    },
    async add(style) {
      const styles = await apiFetch('/api/task-styles');
      styles.push(style);
      await apiFetch('/api/task-styles', 'POST', styles);
      return style.id;
    },
    async delete(id) {
      const styles = await apiFetch('/api/task-styles');
      const filtered = styles.filter(s => s.id !== id);
      await apiFetch('/api/task-styles', 'POST', filtered);
      return 1;
    }
  },

  auth: {
    async login(username, password) {
      const res = await apiFetch('/api/auth/login', 'POST', { username, password });
      if (res.token) {
        localStorage.setItem('tass_auth_token', res.token);
        localStorage.setItem('tass_user', JSON.stringify(res.user));
      }
      return res;
    },
    async register(username, password) {
      return apiFetch('/api/auth/register', 'POST', { username, password });
    },
    logout() {
      localStorage.removeItem('tass_auth_token');
      localStorage.removeItem('tass_user');
      window.location.href = '/login';
    },
    async getMe() {
      try {
        return await apiFetch('/api/auth/me');
      } catch (e) {
        return null;
      }
    }
  },

  system: {
    async importBackup(data) {
      return apiFetch('/api/migration/import', 'POST', data);
    }
  }
};
