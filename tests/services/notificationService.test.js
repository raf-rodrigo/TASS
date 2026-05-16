import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../../src/services/notificationService';
import { setActivePinia, createPinia } from 'pinia';

// Mocks dos utilitários nativos
vi.mock('../../src/utils/notifications.js', () => ({
  sendNotification: vi.fn(),
  playNotificationSound: vi.fn(),
  requestNotificationPermission: vi.fn()
}));

// Mocks das Stores
vi.mock('../../src/stores/notificationStore', () => ({
  useNotificationStore: vi.fn(() => ({
    add: vi.fn().mockReturnValue(1)
  }))
}));

vi.mock('../../src/stores/modalStore', () => ({
  useModalStore: vi.fn(() => ({
    confirm: vi.fn().mockResolvedValue('confirmed'),
    alert: vi.fn().mockResolvedValue(true),
    prompt: vi.fn().mockResolvedValue('user input')
  }))
}));

describe('notificationService', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
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

  it('deve disparar prompts através da modalStore', async () => {
    const input = await notificationService.prompt({ title: 'Input' });
    expect(input).toBe('user input');
  });
});
