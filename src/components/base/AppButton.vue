<script setup>
/**
 * =========================================================================
 * COMPONENTE: AppButton
 * =========================================================================
 * Propósito: Componente unificado e customizável para botões do design system.
 * Suporta múltiplas variantes visuais premium, tamanhos e estados (como loading).
 * =========================================================================
 */
import { useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false
});

defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (val) => [
      'primary', 'secondary', 'gradient', 'outline', 'glass', 
      'danger', 'success', 'warning', 'ghost'
    ].includes(val)
  },
  size: {
    type: String,
    default: 'md',
    validator: (val) => ['sm', 'md', 'lg', 'xl'].includes(val)
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: [Object, Function],
    default: null
  },
  iconRight: {
    type: [Object, Function],
    default: null
  },
  type: {
    type: String,
    default: 'button'
  }
});

const attrs = useAttrs();

// Mapeamento das variantes de estilo para classes globais do CSS
const variantsMap = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  gradient: 'btn-gradient',
  outline: 'btn-outline',
  glass: 'btn-glass',
  danger: 'btn-danger',
  success: 'btn-success',
  warning: 'btn-warning',
  ghost: 'btn-ghost'
};

// Mapeamento dos tamanhos para classes geométricas do Tailwind
const sizesMap = {
  sm: 'px-3.5 py-2 text-[10px] uppercase font-black tracking-wider gap-1.5',
  md: 'px-5 py-2.5 text-xs uppercase font-black tracking-wider gap-2',
  lg: 'px-6 py-3 text-sm uppercase font-black tracking-wider gap-2.5',
  xl: 'px-8 py-4 text-base uppercase font-black tracking-wider gap-3'
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    v-bind="attrs"
    class="btn transition-all duration-200 select-none flex items-center justify-center shrink-0"
    :class="[
      variantsMap[variant],
      sizesMap[size],
      loading ? 'opacity-80 cursor-wait' : '',
      attrs.class
    ]"
  >
    <!-- Spinner de Carregamento (Loading State) -->
    <svg 
      v-if="loading" 
      class="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>

    <!-- Ícone à Esquerda (só aparece se não estiver carregando) -->
    <component 
      :is="icon" 
      v-if="icon && !loading" 
      class="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105" 
    />

    <!-- Conteúdo do Botão (Texto) -->
    <span class="truncate leading-none">
      <slot></slot>
    </span>

    <!-- Ícone à Direita -->
    <component 
      :is="iconRight" 
      v-if="iconRight" 
      class="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-105" 
    />
  </button>
</template>

<style scoped>
/* O estilo base do botão herda as configurações dinâmicas de bordas e arredondamentos do design system */
.btn {
  border-radius: var(--app-input-radius, 8px);
}
</style>
