import Dexie from 'dexie';

export const db = new Dexie('TaskManagerDB');

db.version(4).stores({
  tasks: '++id, title, position, sprintId, color',
  sprints: '++id, endDate',
  settings: 'key',
  notes: '++id, content, updatedAt'
});
