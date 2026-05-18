<script setup>
defineProps({
  progress: {
    type: Number,
    default: 0
  },
  variant: {
    type: String,
    default: 'indigo'
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  height: {
    type: String,
    default: 'h-2'
  },
  glow: {
    type: Boolean,
    default: true
  }
});

const variants = {
  indigo: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]',
  emerald: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
  amber: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
  red: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]',
};
</script>

<template>
  <div class="w-full space-y-1.5">
    <div v-if="showLabel" class="flex justify-between items-center px-0.5">
      <span class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest"><slot>Progresso</slot></span>
      <span class="text-[10px] font-black text-slate-700 dark:text-slate-200">{{ Math.round(progress) }}%</span>
    </div>
    
    <div 
      class="w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden border border-app-border-light shadow-inner"
      :class="height"
    >
      <div 
        class="h-full transition-all duration-700 ease-out rounded-full"
        :class="[variants[variant], !glow ? '!shadow-none' : '']"
        :style="{ width: `${Math.max(0, Math.min(100, progress))}%` }"
      ></div>
    </div>
  </div>
</template>
