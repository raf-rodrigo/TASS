<script setup>
import { computed, ref, defineAsyncComponent } from 'vue';
import '@vuepic/vue-datepicker/dist/main.css';
import { useSettingsStore } from '../../stores/settingsStore';
import { ptBR } from 'date-fns/locale';

// Importação dinâmica para evitar erro de exportação durante o build/runtime
const VueDatePicker = defineAsyncComponent(() => 
  import('@vuepic/vue-datepicker').then(m => m.default || m)
);

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ hours: 0, minutes: 0 })
  }
});

const emit = defineEmits(['update:modelValue']);

const settings = useSettingsStore();

const timeValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Cores baseadas no design system
const isDark = computed(() => settings.theme === 'dark');
</script>

<template>
  <div class="app-time-picker w-full">
    <Suspense>
      <template #default>
        <VueDatePicker
          v-model="timeValue"
          time-picker
          :dark="isDark"
          format="HH:mm"
          class="tass-datepicker-standard"
          input-class-name="app-input px-4 py-3 shadow-sm transition-all w-full text-center font-bold text-lg"
          auto-apply
          teleport="body"
          :locale="ptBR"
          placeholder="00:00"
          hide-input-icon
        />
      </template>
      <template #fallback>
        <div class="h-10 animate-pulse bg-slate-100 dark:bg-white/5 rounded-xl"></div>
      </template>
    </Suspense>
  </div>
</template>

<style>
/* Customização para alinhar com o design system do TASS - Versão Standard (Input) */
.tass-datepicker-standard {
  --dp-background-color: var(--app-input-bg, rgba(0, 0, 0, 0.05));
  --dp-text-color: currentColor;
  --dp-border-radius: var(--app-input-radius, 12px);
  --dp-primary-color: var(--app-indigo-500, #6366f1);
  --dp-border-color: rgba(255, 255, 255, 0.1);
  --dp-menu-border-color: rgba(255, 255, 255, 0.1);
  --dp-font-family: inherit;
  --dp-input-padding: 12px 16px;
}

.dark .tass-datepicker-standard {
  --dp-background-color: rgba(0, 0, 0, 0.3);
  --dp-border-color: rgba(255, 255, 255, 0.05);
}

.tass-datepicker-standard .dp__input {
  border: 1px solid var(--dp-border-color);
  font-weight: 700;
  text-align: center;
  font-size: 1.1rem;
  letter-spacing: 1px;
  background: var(--dp-background-color);
  transition: all 0.2s;
}

.tass-datepicker-standard .dp__input:hover {
  border-color: var(--dp-primary-color);
}

.tass-datepicker-standard .dp__input:focus {
  border-color: var(--dp-primary-color);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

/* Customização do Menu flutuante para manter o Glassmorphism */
.dp__menu {
  backdrop-filter: blur(12px) !important;
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: var(--app-card-radius) !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1) !important;
}

.dark .dp__menu {
  background: rgba(30, 41, 59, 0.95) !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
}

.dp__arrow_top, .dp__arrow_bottom {
  display: none !important;
}
</style>
