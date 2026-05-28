<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '#6366f1'
  },
  colors: {
    type: Array,
    default: () => [
      { name: 'Indigo', value: '#6366f1' },
      { name: 'Slate', value: '#64748b' },
      { name: 'Rose', value: '#e11d48' },
      { name: 'Pink', value: '#f472b6' },
      { name: 'Orange', value: '#fb923c' },
      { name: 'Yellow', value: '#facc15' },
      { name: 'Lime', value: '#84cc16' },
      { name: 'Emerald', value: '#10b981' },
      { name: 'Sky', value: '#0ea5e9' },
      { name: 'Blue', value: '#3b82f6' },
      { name: 'Violet', value: '#8b5cf6' },
      { name: 'Purple', value: '#a78bfa' }
    ]
  }
});

const emit = defineEmits(['update:modelValue']);

const selectColor = (value) => {
  emit('update:modelValue', value);
};
</script>

<template>
  <div class="color-picker-wrapper py-2 max-w-full overflow-visible flex justify-center">
    <div class="container-items">
      <button
        v-for="c in colors"
        :key="c.value"
        type="button"
        class="item-color"
        :class="{ 'is-selected': modelValue === c.value }"
        :style="{ '--color': c.value }"
        :aria-color="modelValue === c.value ? '✅ ' + c.name : c.name"
        @click="selectColor(c.value)"
      >
        <!-- Checkmark centralizado se a cor estiver ativa -->
        <span v-if="modelValue === c.value" class="selected-check">✓</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.color-picker-wrapper {
  width: 100%;
}

.container-items {
  display: flex;
  transform-style: preserve-3d;
  transform: perspective(1000px);
  padding: 12px 20px;
  width: max-content;
}

.item-color {
  position: relative;
  flex-shrink: 0;
  width: 32px;
  height: 40px;
  border: none;
  outline: none;
  background: transparent;
  transition: 500ms cubic-bezier(0.175, 0.885, 0.32, 1.15);
  cursor: pointer;
}

.item-color::after {
  position: absolute;
  content: "";
  left: 50%;
  top: 50%;
  width: 40px;
  height: 40px;
  background-color: var(--color);
  border-radius: 6px;
  transform: translate(-50%, -50%) scale(1.2);
  pointer-events: none;
  transition: 500ms cubic-bezier(0.175, 0.885, 0.32, 1.15);
}

.item-color::before {
  position: absolute;
  content: attr(aria-color);
  left: 50%;
  bottom: 54px;
  font-size: 10px;
  font-weight: 900;
  line-height: 14px;
  transform: translate3d(-50%, 0, 0);
  padding: 3px 8px;
  background-color: #0f172a;
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  white-space: nowrap;
  transition: 500ms cubic-bezier(0.175, 0.885, 0.32, 1.15);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  z-index: 50;
  will-change: transform, opacity;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.item-color:hover {
  transform: scale(1.5);
  z-index: 1000000;
}

.item-color:hover::before {
  opacity: 1;
  visibility: visible;
}

/* No hover mantemos a renderização sem sombras como o original */

/* Indicador de Seleção no Corpo do Botão */
.selected-check {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(1.2);
  color: #ffffff;
  font-size: 13px;
  font-weight: 900;
  z-index: 20;
  pointer-events: none;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
  animation: popCheck 400ms cubic-bezier(0.175, 0.885, 0.32, 1.25) forwards;
}

@keyframes popCheck {
  from {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
}

.item-color.is-selected {
  z-index: 10000;
}

.item-color.is-selected::after {
  transform: translate(-50%, -50%) scale(1.35);
  border: 2px solid #ffffff;
}

.dark .item-color.is-selected::after {
  border-color: #f8fafc;
}

.item-color:active,
.item-color:focus {
  z-index: 100000;
}

.item-color:active::after {
  transform: translate(-50%, -50%) scale(1.1);
}

.item-color.is-selected:active::after {
  transform: translate(-50%, -50%) scale(1.2);
}

/* Efeito de Onda 3D no Hover */
.item-color:hover + * {
  transform: scale(1.3);
  z-index: 9999;
}

.item-color:hover + * + * {
  transform: scale(1.15);
  z-index: 999;
}

.item-color:has(+ *:hover) {
  transform: scale(1.3);
  z-index: 9999;
}

.item-color:has(+ * + *:hover) {
  transform: scale(1.15);
  z-index: 999;
}
</style>
