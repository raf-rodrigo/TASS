import { beforeEach, describe, expect, it, vi } from 'vitest';
const { fsMock } = vi.hoisted(() => ({ fsMock: { readFile: vi.fn(), mkdir: vi.fn(), writeFile: vi.fn(), rename: vi.fn() } }));
vi.mock('fs/promises', () => ({ default: fsMock }));
beforeEach(() => vi.resetModules());
describe('exclusão de sprints no servidor', () => {
  it('desvincula IDs numéricos e textuais sem excluir tarefas de outros usuários', async () => {
    fsMock.readFile.mockResolvedValue(JSON.stringify({ users: [], sprints: [{ id: 1, userId: 7 }], tasks: [
      { id: 1, userId: 7, sprintId: '1' }, { id: 2, userId: 7, sprintId: 1 }, { id: 3, userId: 8, sprintId: 1 }
    ] }));
    const { database } = await import('../database');
    await database.deleteSprint(7, 1);
    expect(await database.getSprints(7)).toEqual([]);
    expect((await database.getTasks(7)).map(t => t.sprintId)).toEqual([null, null]);
    expect((await database.getTasks(8))[0].sprintId).toBe(1);
  });
});
