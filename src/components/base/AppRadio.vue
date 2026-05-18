<script setup>
defineProps({
  modelValue: [String, Number, Boolean],
  value: [String, Number, Boolean],
  label: String,
  name: String
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <label class="flex items-center gap-3 cursor-pointer group">
    <div class="relative flex items-center justify-center">
      <input 
        type="radio" 
        :name="name"
        :checked="modelValue === value" 
        @change="emit('update:modelValue', value)"
        class="sr-only peer"
      />
      <div 
        class="w-5 h-5 bg-white dark:bg-white/5 border-2 border-app-border-light rounded-full transition-all peer-checked:border-indigo-600 group-hover:border-indigo-500/50"
      ></div>
      <div 
        class="absolute w-2.5 h-2.5 bg-indigo-600 rounded-full scale-0 transition-transform peer-checked:scale-100 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
      ></div>
    </div>
    <span v-if="label" class="text-xs font-bold text-slate-600 dark:text-slate-400 select-none">{{ label }}</span>
  </label>
</template>
