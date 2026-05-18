<script setup>
import { ref, useAttrs, onMounted, onUnmounted, computed } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

defineOptions({
  // Impede que as classes e atributos passados pelo pai
  // sejam aplicados na div wrapper.
  inheritAttrs: false
});

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => [] // [{ label: 'Opção 1', value: '1' }]
  },
  icon: {
    type: [Object, Function],
    default: null
  },
  iconColor: {
    type: String,
    default: 'text-indigo-500'
  },
  placeholder: {
    type: String,
    default: 'Selecione uma opção...'
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);
const attrs = useAttrs();

const isOpen = ref(false);
const containerRef = ref(null);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const selectOption = (option) => {
  emit('update:modelValue', option.value);
  isOpen.value = false;
};

const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const selectedLabel = computed(() => {
  const option = props.options.find(o => o.value === props.modelValue);
  return option ? option.label : '';
});
</script>

<template>
  <div class="space-y-1.5 w-full relative" ref="containerRef">
    <!-- LABEL & ÍCONE -->
    <div v-if="label" class="flex items-center gap-2 mb-1">
      <component 
        :is="icon" 
        v-if="icon" 
        class="w-3.5 h-3.5 transition-colors" 
        :class="error ? 'text-red-500' : iconColor" 
      />
      <label 
        class="text-[10px] font-black uppercase tracking-widest ml-1 transition-colors text-slate-500 dark:text-slate-400"
        :class="{ 'text-red-500': error }"
      >
        {{ label }}
      </label>
    </div>

    <!-- CUSTOM SELECT TRIGGER -->
    <div 
      @click="toggle"
      v-bind="attrs"
      class="app-input px-4 py-3 shadow-sm transition-all cursor-pointer flex items-center justify-between group"
      :class="[
        error ? 'border-red-500/50 ring-1 ring-red-500/20' : '',
        isOpen ? 'ring-2 ring-indigo-500/40 border-indigo-500/50' : '',
        attrs.class
      ]"
    >
      <span 
        class="text-sm transition-colors"
        :class="selectedLabel ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500'"
      >
        {{ selectedLabel || placeholder }}
      </span>
      <ChevronDown 
        class="w-4 h-4 text-slate-400 transition-transform duration-300"
        :class="{ 'rotate-180 text-indigo-500': isOpen }"
      />
    </div>

    <!-- OPTIONS DROPDOWN -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-2"
    >
      <div 
        v-if="isOpen"
        class="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 backdrop-blur-xl border border-app-border-light shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar"
        :style="{ borderRadius: 'var(--app-input-radius)' }"
      >
        <div 
          v-for="option in options" 
          :key="option.value"
          @click="selectOption(option)"
          class="px-4 py-2.5 text-sm font-medium cursor-pointer transition-all hover:bg-indigo-500/10 flex items-center justify-between"
          :class="modelValue === option.value ? 'text-indigo-500 bg-indigo-500/5 font-black' : 'text-slate-700 dark:text-slate-300'"
        >
          {{ option.label }}
          <div v-if="modelValue === option.value" class="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
        </div>
        <div v-if="options.length === 0" class="px-4 py-3 text-xs text-slate-400 text-center italic">
          Nenhuma opção disponível
        </div>
      </div>
    </transition>

    <!-- CAIXA DE ERRO -->
    <div 
      v-if="error" 
      class="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-2 border border-red-500/20 mt-1.5 animate-shake text-center"
      :style="{ borderRadius: 'var(--app-input-radius)' }"
    >
      {{ error }}
    </div>
  </div>
</template>
