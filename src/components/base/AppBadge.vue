<script setup>
const props = defineProps({
  label: String,
  variant: {
    type: String,
    default: 'indigo',
  },
  dot: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md'
  }
});

const variants = {
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

const dotColors = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  slate: 'bg-slate-500',
  purple: 'bg-purple-500',
};

const sizes = {
  xs: 'px-1.5 py-0.5 text-[8px]',
  sm: 'px-2 py-0.5 text-[9px]',
  md: 'px-2.5 py-1 text-[10px]',
};
</script>

<template>
  <span 
    class="inline-flex items-center gap-1.5 font-black uppercase tracking-widest border rounded-full transition-all select-none"
    :class="[variants[variant], sizes[size]]"
  >
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full animate-pulse" :class="dotColors[variant]"></span>
    <slot>{{ label }}</slot>
  </span>
</template>
