import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useShortcuts } from '../../src/composables/useShortcuts';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';

// Criamos um componente wrapper para testar o composable dentro do ciclo de vida do Vue
const TestComponent = defineComponent({
  setup(props, { emit }) {
    useShortcuts({
      onToggleNotes: () => emit('toggle'),
      onOpenAddModal: () => emit('add'),
      onOpenSettings: () => emit('settings'),
      onWellnessTest: () => emit('wellness')
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

  it('deve disparar onToggleNotes ao pressionar "n"', async () => {
    const wrapper = mount(TestComponent);
    
    const event = new KeyboardEvent('keydown', { key: 'n' });
    window.dispatchEvent(event);

    expect(wrapper.emitted()).toHaveProperty('toggle');
  });

  it('deve disparar onOpenAddModal ao pressionar "t"', async () => {
    const wrapper = mount(TestComponent);
    
    const event = new KeyboardEvent('keydown', { key: 't' });
    window.dispatchEvent(event);

    expect(wrapper.emitted()).toHaveProperty('add');
  });

  it('não deve disparar atalhos se o usuário estiver digitando em um input', async () => {
    const wrapper = mount(TestComponent);
    
    // Criamos um input real e focamos nele usando JSDOM nativo
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: 'n' });
    window.dispatchEvent(event);

    expect(wrapper.emitted()).not.toHaveProperty('toggle');
    
    document.body.removeChild(input);
  });

  it('deve disparar onWellnessTest ao pressionar Alt + W', async () => {
    const wrapper = mount(TestComponent);
    
    const event = new KeyboardEvent('keydown', { key: 'w', altKey: true });
    window.dispatchEvent(event);

    expect(wrapper.emitted()).toHaveProperty('wellness');
  });
});
