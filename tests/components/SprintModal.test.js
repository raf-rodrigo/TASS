import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import SprintModal from '../../src/components/SprintModal.vue';
const { store, notifications } = vi.hoisted(() => ({
  store: { sprints: [{ id: 1, name: 'Entrega', startDate: '2026-10-01', endDate: '2026-10-15' }], saveSprint: vi.fn(), deleteSprint: vi.fn(), sprintLabel: vi.fn(() => 'Sprint antiga') },
  notifications: { confirm: vi.fn(), toast: vi.fn() }
}));
vi.mock('@vuepic/vue-datepicker', () => ({ VueDatePicker: {
  name: 'SprintDatePickerStub', props: ['modelValue'], emits: ['update:modelValue'],
  template: '<button type="button" data-test="dates">Período</button>'
} }));
vi.mock('../../src/stores/sprintStore', () => ({ useSprintStore: () => store }));
vi.mock('../../src/stores/settingsStore', () => ({ useSettingsStore: () => ({ theme: 'dark' }) }));
vi.mock('../../src/services/notificationService', () => ({ notificationService: notifications }));
const render = (props = {}) => mount(SprintModal, { props, global: { stubs: {
  BaseModal: { template: '<div><slot /><slot name="footer" /></div>' },
  AppInput: { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' }
} } });
beforeEach(() => vi.clearAllMocks());
describe('SprintModal', () => {
  it('salva nome e período pelo formulário', async () => {
    const wrapper = render({ initialShowAddForm: true });
    await wrapper.find('input').setValue('Sprint outubro');
    wrapper.findComponent({ name: 'SprintDatePickerStub' }).vm.$emit('update:modelValue', [new Date(2026, 9, 1), new Date(2026, 9, 15)]);
    await flushPromises();
    await wrapper.find('form').trigger('submit'); await flushPromises();
    expect(store.saveSprint).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sprint outubro', startDate: '2026-10-01', endDate: '2026-10-15' }));
    expect(wrapper.find('form').exists()).toBe(false);
  });
  it('edita o nome de uma sprint existente preservando seu ID e datas', async () => {
    const wrapper = render(); await wrapper.find('[aria-label="Editar Entrega"]').trigger('click');
    await wrapper.find('input').setValue('Novo nome'); await wrapper.find('form').trigger('submit'); await flushPromises();
    expect(store.saveSprint).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Novo nome', startDate: '2026-10-01', endDate: '2026-10-15' }));
  });
  it('exibe exclusão acessível e exige confirmação antes de excluir', async () => {
    const wrapper = render(); notifications.confirm.mockResolvedValueOnce(false);
    await wrapper.find('[aria-label="Excluir Entrega"]').trigger('click'); await flushPromises();
    expect(store.deleteSprint).not.toHaveBeenCalled(); notifications.confirm.mockResolvedValueOnce(true);
    await wrapper.find('[aria-label="Excluir Entrega"]').trigger('click'); await flushPromises();
    expect(notifications.confirm).toHaveBeenCalledWith('Excluir sprint', expect.stringContaining('tarefas serão mantidas'), 'Excluir', 'error', 'btn btn-danger');
    expect(store.deleteSprint).toHaveBeenCalledWith(1);
  });
});
