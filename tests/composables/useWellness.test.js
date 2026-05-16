import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWellness } from '../../src/composables/useWellness';
import { ref } from 'vue';

describe('useWellness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSettings = {
    wellnessEnabled: true,
    wellnessInterval: 20 // minutos
  };

  it('deve disparar uma mensagem e exibi-la por 8 segundos', () => {
    const { currentMessage, showMessage, triggerWellness } = useWellness(mockSettings);
    
    triggerWellness(true, 'Mensagem Teste');
    
    expect(showMessage.value).toBe(true);
    expect(currentMessage.value).toBe('Mensagem Teste');
    
    // Avança 8 segundos
    vi.advanceTimersByTime(8000);
    expect(showMessage.value).toBe(false);
  });

  it('não deve disparar se estiver desativado nas configurações', () => {
    const disabledSettings = { ...mockSettings, wellnessEnabled: false };
    const { showMessage, triggerWellness } = useWellness(disabledSettings);
    
    triggerWellness();
    
    expect(showMessage.value).toBe(false);
  });

  it('deve respeitar o intervalo configurado para o loop', () => {
    const { showMessage } = useWellness(mockSettings);
    
    // Intervalo de 20 minutos = 1,200,000ms
    vi.advanceTimersByTime(1200000);
    
    expect(showMessage.value).toBe(true);
  });
});
