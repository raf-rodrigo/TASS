import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useModalStore } from './modalStore';

describe('ModalStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('deve abrir um modal de confirmação e retornar a ação do usuário', async () => {
    const store = useModalStore();
    
    // Disparamos o confirm (que retorna uma Promise)
    const confirmPromise = store.confirm({ title: 'Apagar?', text: 'Cuidado' });
    
    expect(store.isOpen).toBe(true);
    expect(store.title).toBe('Apagar?');
    
    // Simulamos o clique no botão confirmar
    store.handleConfirm();
    
    const result = await confirmPromise;
    expect(result).toBe('confirmed');
    expect(store.isOpen).toBe(false);
  });

  it('deve suportar o botão "Negar" para fluxos complexos', async () => {
    const store = useModalStore();
    const confirmPromise = store.confirm({ denyText: 'Não' });
    
    store.handleDeny();
    
    const result = await confirmPromise;
    expect(result).toBe('denied');
  });

  it('deve abrir um prompt e retornar o valor digitado', async () => {
    const store = useModalStore();
    const promptPromise = store.prompt({ title: 'Nome', value: 'Original' });
    
    expect(store.isPrompt).toBe(true);
    store.promptValue = 'Modificado';
    store.handleConfirm();
    
    const result = await promptPromise;
    expect(result).toBe('Modificado');
  });
});
