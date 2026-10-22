<script setup>
import { ref, computed } from 'vue';
import { Plus, Trash2, Calendar, Layers, Pencil } from 'lucide-vue-next';
import { notificationService } from '../services/notificationService';
import { useSprintStore } from '../stores/sprintStore';
import { useSettingsStore } from '../stores/settingsStore';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { ptBR } from 'date-fns/locale';
import BaseModal from './BaseModal.vue';
import AppInput from './base/AppInput.vue';
import AppButton from './base/AppButton.vue';
import '@vuepic/vue-datepicker/dist/main.css';

const sprintStore = useSprintStore();
const settings = useSettingsStore();

const props = defineProps({
  activeSprintId: [String, Number],
  initialShowAddForm: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'updated', 'select-sprint']);

const newSprintDate = ref(null);
const newSprintName = ref('');
const editingSprint = ref(null);
const busy = ref(false);
const canSave = computed(() => newSprintName.value.trim()
  && Array.isArray(newSprintDate.value) && newSprintDate.value.length === 2
  && newSprintDate.value.every(date => date && !Number.isNaN(new Date(date).getTime())));
const resetForm = () => {
  newSprintName.value = '';
  newSprintDate.value = null;
  editingSprint.value = null;
  showAddForm.value = false;
};
const openNewSprint = () => { resetForm(); showAddForm.value = true; };
const editSprint = sprint => {
  editingSprint.value = sprint;
  newSprintName.value = sprint.name || '';
  newSprintDate.value = [parseDateSafe(sprint.startDate || sprint.endDate), parseDateSafe(sprint.endDate)];
  showAddForm.value = true;
};
const showAddForm = ref(props.initialShowAddForm);

const formatDateToYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateSafe = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('-') && !dateStr.includes('T')) {
    const [year, month, day] = dateStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return new Date(dateStr);
};

const addSprint = async () => {
  if (!canSave.value || busy.value) return;
  busy.value = true;
  try {
    await sprintStore.saveSprint({
      ...(editingSprint.value || {}),
      name: newSprintName.value,
      startDate: formatDateToYYYYMMDD(new Date(newSprintDate.value[0])),
      endDate: formatDateToYYYYMMDD(new Date(newSprintDate.value[1]))
    });
    notificationService.toast(editingSprint.value ? 'Sprint atualizada!' : 'Sprint criada!');
    resetForm();
    emit('updated');
  } catch (error) {
    notificationService.toast(error.message || 'Não foi possível salvar a sprint.', 'error');
  } finally { busy.value = false; }
};

const deleteSprint = async (sprint) => {
  if (busy.value) return;
  busy.value = true;
  try {
    const confirmed = await notificationService.confirm(
      'Excluir sprint',
      `Excluir "${sprint.name || sprintStore.sprintLabel(sprint)}"? As tarefas serão mantidas e desvinculadas desta sprint.`,
      'Excluir', 'error', 'btn btn-danger'
    );
    if (!confirmed) return;
    await sprintStore.deleteSprint(sprint.id);
    if (editingSprint.value?.id === sprint.id) resetForm();
    notificationService.toast('Sprint excluída. Tarefas preservadas!');
    emit('updated');
  } catch {
    notificationService.toast('Não foi possível excluir a sprint. Tente novamente.', 'error');
  } finally { busy.value = false; }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = parseDateSafe(dateStr);
  return date.toLocaleDateString('pt-BR');
};

const isPast = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sprintDate = parseDateSafe(dateStr);
  sprintDate.setHours(0, 0, 0, 0);
  return sprintDate < today;
};
</script>

<template>
  <BaseModal maxWidth="max-w-2xl" :icon="Calendar" title="Sprints" subtitle="Organize os ciclos por nome e período" layout="standard" @close="emit('close')">
    <div class="space-y-6">
      <div class="flex flex-wrap gap-3">
        <AppButton :icon="Plus" :disabled="busy" @click="openNewSprint">Nova sprint</AppButton>
        <AppButton variant="secondary" :icon="Layers" @click="emit('select-sprint', 'all')">Todas as tarefas</AppButton>
      </div>

      <form v-if="showAddForm" class="glass-panel space-y-6" @submit.prevent="addSprint">
        <h3 class="text-xs font-black uppercase tracking-tight text-app-main">{{ editingSprint ? 'Editar sprint' : 'Nova sprint' }}</h3>
        <AppInput v-model="newSprintName" label="Nome da sprint" placeholder="Ex.: Entrega de outubro" required :disabled="busy" />
        <div class="space-y-2">
          <p class="text-[10px] font-black text-app-muted uppercase tracking-widest">Período</p>
          <VueDatePicker v-model="newSprintDate" :dark="settings.theme === 'dark'" :disabled="busy"
            placeholder="Selecione o início e o fim" auto-apply range :enable-time-picker="false"
            class="sprint-datepicker" input-class-name="app-input" teleport="body"
            :format-locale="ptBR" :locale="ptBR" format="dd/MM/yyyy" />
        </div>
        <div class="flex justify-end gap-3">
          <AppButton variant="secondary" class="px-6" :disabled="busy" @click="resetForm">Cancelar</AppButton>
          <AppButton type="submit" class="px-10" :disabled="!canSave" :loading="busy">Salvar</AppButton>
        </div>
      </form>

      <section class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-[10px] font-black text-app-muted uppercase tracking-widest">Ciclos de trabalho</h3>
          <span class="text-xs text-app-sub">{{ sprintStore.sprints.length }} sprints</span>
        </div>
        <p v-if="!sprintStore.sprints.length" class="text-sm text-app-muted">Crie sua primeira sprint com um nome e um período.</p>
        <article v-for="sprint in sprintStore.sprints" :key="sprint.id"
          class="bg-app-surface border border-app-border-light space-y-4 transition-all"
          :style="{ borderRadius: 'var(--app-card-radius)', padding: 'var(--app-card-padding)' }">
          <button type="button" class="w-full text-left space-y-2 transition-all active:scale-95"
            :aria-pressed="String(activeSprintId) === String(sprint.id)" @click="emit('select-sprint', sprint.id)">
            <span class="block text-sm font-black text-app-main break-words">{{ sprint.name || 'Sprint sem nome' }}</span>
            <span class="block text-xs text-app-sub">{{ sprint.startDate ? formatDate(sprint.startDate) : 'Sem início' }} a {{ formatDate(sprint.endDate) }}</span>
            <span class="block text-[10px] font-black uppercase tracking-widest text-app-muted">
              {{ isPast(sprint.endDate) ? 'Finalizada' : 'Em aberto' }}{{ String(activeSprintId) === String(sprint.id) ? ' · Selecionada' : '' }}
            </span>
          </button>
          <div class="flex flex-wrap justify-end gap-3">
            <AppButton variant="secondary" size="sm" :icon="Pencil" :disabled="busy" :aria-label="`Editar ${sprint.name || 'sprint'}`" @click="editSprint(sprint)">Editar</AppButton>
            <AppButton variant="danger" size="sm" :icon="Trash2" :disabled="busy" :aria-label="`Excluir ${sprint.name || 'sprint'}`" @click="deleteSprint(sprint)">Excluir</AppButton>
          </div>
        </article>
      </section>
    </div>
    <template #footer>
      <div class="w-full flex justify-end">
        <AppButton variant="secondary" class="px-6" @click="emit('close')">Fechar</AppButton>
      </div>
    </template>
  </BaseModal>
</template>

<style>
.sprint-datepicker {
  --dp-border-radius: var(--app-input-radius);
  --dp-font-family: inherit;
  --dp-background-color: var(--app-surface-item-bg);
  --dp-text-color: var(--app-text-main);
  --dp-border-color: var(--app-border-light);
}
</style>
