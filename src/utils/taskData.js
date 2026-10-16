export const LEGACY_TASK_ENVIRONMENT_FIELDS = Object.freeze([
  'devUrl',
  'homologUrl',
  'prodUrl'
]);

/**
 * Remove as antigas flags de ambiente vinculadas diretamente às tarefas.
 * Retorna uma cópia para não alterar objetos reativos ou dados de backups.
 */
export const sanitizeTaskData = (task = {}) => {
  const sanitizedTask = { ...task };
  LEGACY_TASK_ENVIRONMENT_FIELDS.forEach(field => {
    delete sanitizedTask[field];
  });
  return sanitizedTask;
};

/**
 * Variante mutável para migrações do Dexie, cujo modify opera no registro atual.
 */
export const removeLegacyTaskEnvironmentFields = task => {
  LEGACY_TASK_ENVIRONMENT_FIELDS.forEach(field => {
    delete task[field];
  });
  return task;
};
