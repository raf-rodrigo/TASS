<script setup>
import { computed } from 'vue';
import { useTaskStore } from '../../stores/taskStore';
import { taskActionService } from '../../services/taskActionService';

const props = defineProps({
  task: { type: Object, required: true },
  field: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'url' }, // 'url' ou 'text'
  activeClass: { type: String, default: '' },
  tooltip: { type: String, default: '' },
  isTag: { type: Boolean, default: false } // Para diferenciar botões de ícone de tags de ambiente
});

const taskStore = useTaskStore();

const hasValue = computed(() => !!props.task[props.field]);

const finalTooltip = computed(() => {
  if (props.tooltip) return props.tooltip;
  const action = props.type === 'url' ? 'Abrir' : 'Ver';
  return hasValue.value 
    ? `${action} ${props.label} (Direito para editar)` 
    : `Configurar ${props.label}`;
});

const handleMainAction = async () => {
  const currentValue = props.task[props.field];
  
  if (currentValue && props.type === 'url') {
    const url = currentValue.startsWith('http') ? currentValue : `https://${currentValue}`;
    window.open(url, '_blank');
  } else {
    // Se não tem valor ou é texto, abre o prompt
    await taskActionService.promptQuickUpdate(props.task, taskStore, props.field, props.label, props.type);
  }
};

const handleEditAction = async () => {
  await taskActionService.promptQuickUpdate(props.task, taskStore, props.field, props.label, props.type);
};
</script>

<template>
  <button 
    @click.stop="handleMainAction"
    @contextmenu.prevent="handleEditAction"
    :data-tip="finalTooltip"
    :class="[
      isTag ? 'env-tag-base' : 'icon-btn-base',
      hasValue ? activeClass : ''
    ]"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<style scoped>
.icon-btn-base {
  @apply transition-all active:scale-90 flex items-center justify-center;
}

.env-tag-base {
  @apply px-1.5 py-0.5 text-[8px] md:text-[9px] font-black tracking-tighter transition-all active:scale-95 rounded-md border border-transparent text-center;
  background-color: var(--app-surface-muted);
  color: var(--app-text-muted);
}
</style>
