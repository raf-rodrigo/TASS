<script setup>
/**
 * =========================================================================
 * COMPONENTE: AppSwitch
 * =========================================================================
 * Propósito: Chave deslizante (Toggle) para estados booleanos.
 */

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  activeColor: {
    type: String,
    default: 'peer-checked:bg-indigo-600'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <label 
    class="flex items-center justify-between group cursor-pointer"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  >
    <div v-if="label || description" class="flex flex-col select-none pr-4">
      <span class="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-500 transition-colors">
        {{ label }}
      </span>
      <span v-if="description" class="text-[10px] text-slate-500 dark:text-slate-500 leading-tight mt-0.5">
        {{ description }}
      </span>
    </div>

    <div class="relative inline-flex items-center shrink-0">
      <input 
        type="checkbox" 
        :checked="modelValue" 
        :disabled="disabled"
        @change="emit('update:modelValue', $event.target.checked)"
        class="sr-only peer" 
      />
      <div 
        class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full transition-all shadow-inner border border-transparent group-hover:border-slate-300 dark:group-hover:border-slate-600"
        :class="activeColor"
      ></div>
      <div 
        class="absolute top-[2px] start-[2px] bg-white w-5 h-5 rounded-full transition-all shadow-md peer-checked:translate-x-full peer-checked:shadow-indigo-500/20"
      ></div>
    </div>
  </label>
</template>
