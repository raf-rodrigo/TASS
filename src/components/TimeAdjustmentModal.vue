<script setup>
import { ref, computed } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { getHMFromMs, hmsToMs } from '../utils/time';
import { ptBR } from 'date-fns/locale';
import { Clock, Check } from 'lucide-vue-next';
import BaseModal from './BaseModal.vue';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const settings = useSettingsStore();
const taskStore = useTaskStore();

// Valor interno para o datepicker
const timeValue = ref(getHMFromMs(props.task.totalTimeSpent));

const handleSave = async () => {
  if (!timeValue.value) return;
  const newMs = hmsToMs(timeValue.value.hours, timeValue.value.minutes);
  await taskStore.adjustTaskTime(props.task.id, newMs);
  emit('close');
};

const isDark = computed(() => settings.theme === 'dark');
</script>

<template>
  <BaseModal maxWidth="max-w-[280px]" @close="handleSave" layout="custom" customClass="!p-0 overflow-hidden">
    <div class="flex flex-col items-center bg-transparent">
      <!-- Header do Modal: Simples com o Check para salvar -->
      <header class="w-full flex items-center justify-between px-4 py-3 border-b border-app-border-light bg-app-surface/50 backdrop-blur-md">
        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4 text-indigo-500" />
          <span class="text-[10px] font-black text-app-main uppercase tracking-widest">Ajustar</span>
        </div>
        <!-- Única ação: Salvar e Fechar -->
        <button @click="handleSave" class="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-all active:scale-90">
          <Check class="w-4 h-4" />
        </button>
      </header>

      <!-- Interface DIRETA do Picker (Modo Inline) -->
      <div class="p-2 w-full flex justify-center bg-transparent">
        <VueDatePicker
          v-model="timeValue"
          time-picker
          inline
          auto-apply
          :dark="isDark"
          :locale="ptBR"
          format="HH:mm"
          class="app-datepicker-direct"
        />
      </div>
    </div>
  </BaseModal>
</template>

<style>
/* 
  Estilização mínima para não quebrar a escala padrão da biblioteca, 
  apenas integrando cores e removendo bordas desnecessárias.
*/
.app-datepicker-direct {
  --dp-font-family: inherit;
  --dp-border-radius: 16px;
  --dp-primary-color: var(--app-indigo-500, #6366f1);
  width: 100%;
}

.app-datepicker-direct .dp__menu {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 auto !important;
}

/* Garante que os controles internos de tempo usem o espaço de forma padrão */
.app-datepicker-direct .dp__time_display {
  color: var(--dp-primary-color) !important;
  font-weight: 700 !important;
}

.app-datepicker-direct .dp__action_row {
  display: none !important;
}
</style>
