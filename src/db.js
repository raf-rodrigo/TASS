import Dexie from 'dexie';

export const db = new Dexie('TaskManagerDB');

db.version(5).stores({
  tasks: '++id, title, position, sprintId, color, columnId',
  sprints: '++id, endDate',
  settings: 'key',
  notes: '++id, content, updatedAt'
});

db.version(6).stores({
  radios: '++id, name, url, isDefault, apiUrl'
});

db.version(7).stores({
  radios: '++id, name, url, stars'
});
