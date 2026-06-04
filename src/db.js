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

db.version(8).stores({
  tasks: '++id, title, position, sprintId, color, columnId, styleId',
  taskStyles: 'id, name'
});

db.version(9).stores({
  tasks: '++id, title, position, sprintId, columnId, styleId' // Removido 'color'
}).upgrade(async tx => {
  // Limpar propriedades de cores embutidas nas tarefas (Legado)
  await tx.tasks.toCollection().modify(task => {
    delete task.color;
    delete task.bgColor;
    delete task.textLightColor;
    delete task.textDarkColor;
  });

  // Limpar paletas de cores globais das configurações (Legado do AppColorPicker)
  const keysToDelete = [
    'app-title-palette',
    'app-body-palette',
    'app-text-light-palette',
    'app-text-dark-palette'
  ];
  await tx.settings.where('key').anyOf(keysToDelete).delete();
});
