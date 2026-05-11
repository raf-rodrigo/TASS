import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppTextarea from '../../../src/components/base/AppTextarea.vue';

describe('AppTextarea.vue', () => {
  it('deve emitir o valor atualizado no evento input', async () => {
    const wrapper = mount(AppTextarea, {
      props: { modelValue: '', label: 'Descrição' }
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('Conteúdo Longo');

    expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['Conteúdo Longo']);
  });

  it('deve respeitar a prop rows', () => {
    const wrapper = mount(AppTextarea, {
      props: { rows: 5 }
    });

    expect(wrapper.find('textarea').attributes('rows')).toBe('5');
  });
});
