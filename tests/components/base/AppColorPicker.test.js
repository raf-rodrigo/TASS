import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppColorPicker from '../../../src/components/base/AppColorPicker.vue';

describe('AppColorPicker.vue', () => {
  it('deve renderizar todas as cores fornecidas', () => {
    const customColors = [
      { name: 'Red', value: '#ff0000' },
      { name: 'Blue', value: '#0000ff' }
    ];
    const wrapper = mount(AppColorPicker, {
      props: { colors: customColors, modelValue: '#ff0000' }
    });

    const buttons = wrapper.findAll('.item-color');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].attributes('style')).toContain('--color: #ff0000');
    expect(buttons[1].attributes('style')).toContain('--color: #0000ff');
  });

  it('deve marcar a cor selecionada com a classe is-selected e mostrar checkmark', () => {
    const wrapper = mount(AppColorPicker, {
      props: { modelValue: '#64748b' }
    });

    const selectedBtn = wrapper.find('.item-color.is-selected');
    expect(selectedBtn.exists()).toBe(true);
    expect(selectedBtn.attributes('style')).toContain('--color: #64748b');
    expect(selectedBtn.find('.selected-check').text()).toBe('✓');
  });

  it('deve emitir update:modelValue ao clicar em uma nova cor', async () => {
    const customColors = [
      { name: 'Red', value: '#ff0000' },
      { name: 'Blue', value: '#0000ff' }
    ];
    const wrapper = mount(AppColorPicker, {
      props: { colors: customColors, modelValue: '#ff0000' }
    });

    const buttons = wrapper.findAll('.item-color');
    await buttons[1].trigger('click');

    expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['#0000ff']);
  });
});
