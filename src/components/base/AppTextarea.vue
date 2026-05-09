<script setup>
/**
 * =========================================================================
 * COMPONENTE: AppTextarea
 * =========================================================================
 * Propósito: Padronizar o estilo de campos de texto longo (textarea) no TASS.
 * Segue exatamente a mesma arquitetura do AppInput.
 * 
 * USO EXEMPLO:
 * <AppTextarea 
 *   v-model="tarefa.descricao"
 *   label="Descrição"
 *   :icon="FileText"
 *   rows="4"
 *   placeholder="Descreva a tarefa..."
 * />
 * =========================================================================
 */
import { useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false
});

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  icon: {
    type: [Object, Function],
    default: null
  },
  iconColor: {
    type: String,
    default: 'text-indigo-500'
  },
  error: {
    type: String,
    default: ''
  },
  rows: {
    type: [Number, String],
    default: 3
  },
  labelColor: {
    type: String,
    default: 'text-slate-500 dark:text-slate-400'
  }
});

const emit = defineEmits(['update:modelValue']);
const attrs = useAttrs();
</script>

<template>
  <div class="space-y-1.5 w-full">
    <!-- LABEL & ÍCONE -->
    <div v-if="label" class="flex items-center justify-between mb-1">
      <div class="flex items-center gap-2">
        <component 
          :is="icon" 
          v-if="icon" 
          class="w-3.5 h-3.5 transition-colors" 
          :class="error ? 'text-red-500' : iconColor" 
        />
        <label 
          class="text-[10px] font-black uppercase tracking-widest ml-1 transition-colors"
          :class="error ? 'text-red-500' : labelColor"
        >
          {{ label }}
        </label>
      </div>
      <slot name="label-right"></slot>
    </div>

    <!-- ÁREA DE TEXTO -->
    <textarea 
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
      :rows="rows"
      v-bind="attrs"
      class="app-input px-4 py-3 shadow-sm transition-all resize-none"
      :class="[
        error ? 'border-red-500/50 ring-1 ring-red-500/20' : '',
        attrs.class
      ]"
    ></textarea>

    <!-- CAIXA DE ERRO -->
    <div 
      v-if="error" 
      class="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-2 rounded-xl border border-red-500/20 mt-1.5 animate-shake text-center"
    >
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
</style>
