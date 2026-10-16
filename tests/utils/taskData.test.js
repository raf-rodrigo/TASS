import { describe, expect, it } from 'vitest';
import {
  removeLegacyTaskEnvironmentFields,
  sanitizeTaskData
} from '../../src/utils/taskData.js';

describe('taskData', () => {
  it('gera uma cópia da tarefa sem as flags legadas de ambiente', () => {
    const task = {
      id: 1,
      title: 'Tarefa',
      devUrl: 1,
      homologUrl: 0,
      prodUrl: 1
    };

    const sanitizedTask = sanitizeTaskData(task);

    expect(sanitizedTask).toEqual({ id: 1, title: 'Tarefa' });
    expect(sanitizedTask).not.toBe(task);
    expect(task).toHaveProperty('devUrl', 1);
  });

  it('remove as flags no próprio registro durante a migração do IndexedDB', () => {
    const task = {
      id: 1,
      title: 'Tarefa',
      devUrl: 1,
      homologUrl: 1,
      prodUrl: 1
    };

    expect(removeLegacyTaskEnvironmentFields(task)).toBe(task);
    expect(task).toEqual({ id: 1, title: 'Tarefa' });
  });
});
