import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../../src/services/notificationService';
import { setActivePinia, createPinia } from 'pinia';

const notificationStore = vi.hoisted(() => ({
  add: vi.fn().mockReturnValue(1)
}));

const modalStore = vi.hoisted(() => ({
  confirm: vi.fn().mockResolvedValue('confirmed'),
  alert: vi.fn().mockResolvedValue(true),
  prompt: vi.fn().mockResolvedValue('user input')
}));

// Mocks dos utilitários nativos
vi.mock('../../src/utils/notifications.js', () => ({
  sendNotification: vi.fn(),
  playNotificationSound: vi.fn(),
  requestNotificationPermission: vi.fn()
}));

// Mocks das Stores
vi.mock('../../src/stores/notificationStore', () => ({
  useNotificationStore: vi.fn(() => notificationStore)
}));

vi.mock('../../src/stores/modalStore', () => ({
  useModalStore: vi.fn(() => modalStore)
}));

describe('notificationService', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    notificationStore.add.mockReturnValue(1);
    modalStore.confirm.mockResolvedValue('confirmed');
  });

  it('deve disparar um toast através da notificationStore', () => {
    const result = notificationService.toast('Sucesso!', 'success', 'Tudo certo');
    expect(result).toBe(1); // Retorno do mock add
  });

  it('deve disparar som e notificação nativa em notify()', async () => {
    const { playNotificationSound, sendNotification } = await import('../../src/utils/notifications.js');
    
    notificationService.notify('Título', 'Corpo');
    
    expect(playNotificationSound).toHaveBeenCalled();
    expect(sendNotification).toHaveBeenCalledWith('Título', 'Corpo');
  });

  it('deve usar a modalStore para confirmações simples (retorno boolean)', async () => {
    const confirmed = await notificationService.confirm('Título', 'Mensagem');
    expect(confirmed).toBe(true); // 'confirmed' mapeado para true
  });

  it('deve retornar a string de ação para confirmações complexas (denyText)', async () => {
    const action = await notificationService.confirm('Título', 'Msg', 'Sim', 'info', 'Não');
    expect(action).toBe('confirmed');
  });

  it('deve exibir, copiar e confirmar um comando', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });

    const copied = await notificationService.copyCommand({
      title: 'Branch criada',
      message: 'Use no terminal.',
      command: 'git checkout feature/task-1'
    });

    expect(modalStore.confirm).toHaveBeenCalledWith({
      title: 'Branch criada',
      message: 'Use no terminal.',
      code: 'git checkout feature/task-1',
      confirmText: 'Copiar comando',
      cancelText: 'Fechar',
      type: 'success'
    });
    expect(writeText).toHaveBeenCalledWith('git checkout feature/task-1');
    expect(copied).toBe(true);
  });

  it('deve apenas fechar sem copiar quando o usuário cancelar', async () => {
    modalStore.confirm.mockResolvedValueOnce('cancelled');

    const copied = await notificationService.copyCommand({
      title: 'Branch criada',
      message: 'Use no terminal.',
      command: 'git checkout feature/task-1'
    });

    expect(copied).toBe(false);
  });

  it('deve disparar prompts através da modalStore', async () => {
    const input = await notificationService.prompt({ title: 'Input' });
    expect(input).toBe('user input');
  });
});
