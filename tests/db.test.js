import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('dexie', () => ({ default: class {} }));

let db;
beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  localStorage.setItem('tass_migrated', 'true');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  ({ db } = await import('../src/db.js'));
});

describe('adaptador do banco no servidor', () => {
  it('importa tarefas sem IDs usando a API e devolve os novos IDs', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ id: 42 }) });
    expect(await db.tasks.bulkAdd([{ title: 'Importada' }])).toEqual([42]);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/tasks'), expect.objectContaining({
      method: 'POST', body: JSON.stringify({ title: 'Importada' })
    }));
  });

  it('mantém as credenciais Nextcloud somente neste navegador', async () => {
    const setting = { key: 'app-nextcloud-credentials', value: { username: 'local', appPassword: 'segredo' } };
    await db.settings.put(setting);
    expect(await db.settings.get(setting.key)).toEqual(setting);
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockResolvedValue({ ok: true, json: async () => ({ 'app-theme': 'dark' }) });
    expect(await db.settings.toArray()).toContainEqual(setting);
    await db.settings.delete(setting.key);
    expect(await db.settings.get(setting.key)).toBeUndefined();
  });
  it('restaura o backup no servidor sem enviar credenciais do navegador', async () => {
    await db.system.importBackup({ tasks: [{ id: 1 }], settings: [
      { key: 'app-theme', value: 'light' },
      { key: 'app-nextcloud-credentials', value: { appPassword: 'segredo' } }
    ] });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      tasks: [{ id: 1 }], settings: [{ key: 'app-theme', value: 'light' }]
    });
  });

});
