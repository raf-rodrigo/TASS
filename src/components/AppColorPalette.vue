<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  colors: {
    type: Array,
    default: () => ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51']
  },
  previewOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const selectColor = (color) => {
  if (props.previewOnly) return;
  emit('update:modelValue', color);
};
</script>

<template>
  <div class="palette-container">
    <div class="palette">
      <div 
        v-for="(color, index) in colors" 
        :key="index"
        class="color"
        :style="{ background: color }"
        @click="selectColor(color)"
      >
        <span :class="{ 'opacity-100': modelValue === color }">{{ color.replace('#', '') }}</span>
      </div>
    </div>
    <div v-if="!previewOnly" class="stats">
      <span v-if="modelValue">Cor: <b :style="{ color: modelValue }">{{ modelValue }}</b></span>
      <span v-else>Selecione uma cor</span>
      <div class="flex gap-2">
        <button v-if="modelValue" @click.stop="selectColor('')" class="text-[10px] hover:text-red-400 transition-colors">Limpar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette-container {
  min-height: 60px;
  width: 100%;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
  font-family: inherit;
  border: 1px solid var(--app-border-light, rgba(255,255,255,0.1));
}

.palette {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  width: 100%;
}

.color {
  height: 42px;
  flex: 1 1 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 1px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
}

.color span {
  opacity: 0;
  transition: opacity 0.1s linear;
}

.color:hover {
  flex: 2;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 7px 29px 0px;
  z-index: 10;
}

.color:hover span {
  opacity: 1;
}

.stats {
  height: 28px;
  width: 100%;
  background: white; 
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5em;
  box-sizing: border-box;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Ajuste para o Dark Mode do TASS */
:global(.dark) .stats {
  background: #1e293b; 
  color: #cbd5e1; 
}

.stats svg {
  fill: currentColor;
  transform: scale(1.2);
}
</style>
