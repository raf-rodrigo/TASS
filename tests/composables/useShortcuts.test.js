import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useShortcuts } from '../../src/composables/useShortcuts';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';

// Criamos um componente wrapper para testar o composable dentro do ciclo de vida do Vue
const TestComponent = defineComponent({
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    useShortcuts({
      onToggleNotes: (val) => emit('toggle', val),
      onOpenAddModal: () => emit('add'),
      onOpenSettings: () => emit('settings'),
      onWellnessTest: () => emit('wellness'),
      isNotesOpen: () => props.isOpen
    });
    return () => null;
  }
});

describe('useShortcuts', () => {
  beforeEach(() => {
    // Não usar stubGlobal('document') aqui para não quebrar o JSDOM interno do mount
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve disparar onToggleNotes ao pressionar "t"', async () => {
    const wrapper = mount(TestComponent);
    
    const event = new KeyboardEvent('keydown', { key: 't' });
    window.dispatchEvent(event);

    expect(wrapper.emitted()).toHaveProperty('toggle');
  });

  it('não deve disparar nada ao pressionar "n", "c" ou "Alt + w"', async () => {
    const wrapper = mount(TestComponent);
    
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', altKey: true }));

    expect(wrapper.emitted()).not.toHaveProperty('toggle');
    expect(wrapper.emitted()).not.toHaveProperty('add');
    expect(wrapper.emitted()).not.toHaveProperty('settings');
    expect(wrapper.emitted()).not.toHaveProperty('wellness');
  });

  it('não deve disparar atalhos se o usuário estiver digitando em um input', async () => {
    const wrapper = mount(TestComponent);
    
    // Criamos um input real e focamos nele usando JSDOM nativo
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 't' });
    window.dispatchEvent(event);

    expect(wrapper.emitted()).not.toHaveProperty('toggle');
    
    document.body.removeChild(input);
  });

  it('não deve disparar atalhos se o input estiver dentro de um container de modal (simulando closest())', async () => {
    const wrapper = mount(TestComponent);

    // Simula um input dentro de um div pai (como um modal) — cenário real do bug
    const modal = document.createElement('div');
    const input = document.createElement('input');
    modal.appendChild(input);
    document.body.appendChild(modal);
    input.focus();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));

    expect(wrapper.emitted()).not.toHaveProperty('toggle');

    document.body.removeChild(modal);
  });

  it('quando aberto, deve permitir apenas Escape para fechar e ignorar outras teclas', async () => {
    const wrapper = mount(TestComponent, {
      props: { isOpen: true }
    });

    // Pressiona 't' -> Não deve alternar ou disparar evento toggle (bloqueado)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
    expect(wrapper.emitted('toggle')).toBeUndefined();

    // Pressiona Escape -> Deve disparar toggle com o valor false para fechar
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('toggle')[0]).toEqual([false]);
  });
});
