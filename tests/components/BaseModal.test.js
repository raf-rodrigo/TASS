import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import BaseModal from '../../src/components/BaseModal.vue';

// Mock do SettingsStore
vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    theme: 'dark'
  }))
}));

describe('BaseModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('deve renderizar o título e subtítulo corretamente', () => {
    const wrapper = mount(BaseModal, {
      props: { title: 'Título Teste', subtitle: 'Subtítulo Teste' }
    });

    expect(wrapper.text()).toContain('Título Teste');
    expect(wrapper.text()).toContain('Subtítulo Teste');
  });

  it('deve disparar evento de fechar ao clicar no botão X', async () => {
    const wrapper = mount(BaseModal, {
      props: { title: 'Teste', showClose: true }
    });

    const closeButton = wrapper.find('.icon-btn');
    await closeButton.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('close');
  });

  it('deve renderizar botões de rodapé se okText for fornecido', () => {
    const wrapper = mount(BaseModal, {
      props: { title: 'Teste', okText: 'Confirmar' }
    });

    const okButton = wrapper.find('.btn-primary');
    expect(okButton.exists()).toBe(true);
    expect(okButton.text()).toContain('Confirmar');
  });

  it('deve emitir evento "ok" ao clicar no botão primário', async () => {
    const wrapper = mount(BaseModal, {
      props: { title: 'Teste', okText: 'OK' }
    });

    await wrapper.find('.btn-primary').trigger('click');
    expect(wrapper.emitted()).toHaveProperty('ok');
  });
});
