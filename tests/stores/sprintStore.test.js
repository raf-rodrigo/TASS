import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSprintStore } from '../../src/stores/sprintStore';
import { db } from '../../src/db.js';
const { settings, taskStore } = vi.hoisted(() => ({
  settings: { activeSprintId: '1' }, taskStore: { tasks: [], loadTasks: vi.fn() }
}));
vi.mock('../../src/db.js', () => ({ db: { sprints: { add: vi.fn(), delete: vi.fn(), toArray: vi.fn() } } }));
vi.mock('../../src/stores/settingsStore', () => ({ useSettingsStore: () => settings }));
vi.mock('../../src/stores/taskStore', () => ({ useTaskStore: () => taskStore }));
vi.mock('../../src/services/notificationService', () => ({ notificationService: { toast: vi.fn() } }));
beforeEach(() => {
  setActivePinia(createPinia()); vi.resetAllMocks(); settings.activeSprintId = '1';
  db.sprints.toArray.mockResolvedValue([]);
});
describe('SprintStore', () => {
  it('salva o nome normalizado junto ao período', async () => {
    const store = useSprintStore();
    await store.saveSprint({ name: '  Entrega Outubro  ', startDate: '2026-10-01', endDate: '2026-10-15' });
    expect(db.sprints.add).toHaveBeenCalledWith(expect.objectContaining({ name: 'Entrega Outubro', startDate: '2026-10-01', endDate: '2026-10-15' }));
  });
  it('rejeita nomes vazios e períodos inválidos antes de gravar', async () => {
    const store = useSprintStore();
    for (const data of [
      { name: ' ', startDate: '2026-10-01', endDate: '2026-10-15' },
      { name: 'Sprint', startDate: '2026-10-20', endDate: '2026-10-01' },
      { name: 'Sprint', startDate: '2026-02-30', endDate: '2026-03-05' }
    ]) await expect(store.saveSprint(data)).rejects.toThrow();
    expect(db.sprints.add).not.toHaveBeenCalled();
  });
  it('exclui a sprint ativa, retorna a todas e recarrega tarefas mantendo o filtro de usuário', async () => {
    const store = useSprintStore();
    await store.loadSprints(7);
    await store.deleteSprint(1);
    expect(db.sprints.delete).toHaveBeenCalledWith(1);
    expect(settings.activeSprintId).toBe('all');
    expect(db.sprints.toArray).toHaveBeenLastCalledWith(7);
    expect(taskStore.loadTasks).toHaveBeenCalled();
  });
  it('mantém seleção e dados quando a exclusão falha', async () => {
    const store = useSprintStore(); db.sprints.delete.mockRejectedValue(new Error('offline'));
    await expect(store.deleteSprint(1)).rejects.toThrow('offline');
    expect(settings.activeSprintId).toBe('1'); expect(taskStore.loadTasks).not.toHaveBeenCalled();
  });
  it('exibe nome e datas, mantendo compatibilidade com sprints antigas', () => {
    const store = useSprintStore();
    store.sprints = [{ id: 1, name: 'Entrega', endDate: '2026-10-15' }];
    expect(store.activeSprintName).toContain('Entrega');
    expect(store.activeSprintName).toContain('15/10/2026');
    store.sprints[0].name = ''; expect(store.activeSprintName).toBe('Sprint até 15/10/2026');
  });
});
