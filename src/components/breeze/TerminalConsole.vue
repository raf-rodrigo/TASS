<script setup>
import { ref, watch, nextTick } from 'vue';
import { Terminal } from 'lucide-vue-next';

const props = defineProps({
  logs: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Aguardando logs...'
  },
  consoleFontSize: {
    type: Number,
    default: 12
  }
});

defineEmits(['increase-font-size', 'decrease-font-size']);

const consoleEl = ref(null);

watch(() => props.logs, () => {
  nextTick(() => {
    if (consoleEl.value) {
      consoleEl.value.scrollTop = consoleEl.value.scrollHeight;
    }
  });
}, { deep: true });
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0 relative overflow-hidden border-indigo-500/20 rounded-2xl" 
       :style="{ 
         backgroundColor: 'rgba(2, 6, 23, var(--app-modal-body-opacity))',
         backdropFilter: 'blur(var(--app-glass-blur)) brightness(var(--app-glass-brightness)) saturate(var(--app-glass-saturate))',
         '-webkit-backdrop-filter': 'blur(var(--app-glass-blur)) brightness(var(--app-glass-brightness)) saturate(var(--app-glass-saturate))',
         border: '1px solid rgba(99, 102, 241, 0.2)'
       }">
    <!-- Console de Texto -->
    <div
      ref="consoleEl"
      :style="{ fontSize: consoleFontSize + 'px' }"
      class="p-5 font-mono leading-relaxed text-slate-300 overflow-y-auto custom-scrollbar flex flex-col gap-2 flex-1 select-text relative z-10"
    >
      <div v-if="logs.length === 0" class="text-slate-500 italic">
        {{ placeholder }}
      </div>
      <div
        v-for="(log, idx) in logs"
        :key="idx"
        :class="{
          'text-slate-300': log.type === 'info',
          'text-emerald-400': log.type === 'success',
          'text-amber-400': log.type === 'warning',
          'text-red-400 font-bold': log.type === 'error'
        }"
      >
        <span class="text-slate-500">[{{ log.time }}]</span> {{ log.text }}
        <a v-if="log.link" :href="log.link" target="_blank" class="ml-2 text-indigo-400 hover:text-indigo-300 underline font-bold tracking-wider inline-flex items-center gap-1">
          Abrir Merge Request
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
      </div>
    </div>

    <!-- Ajuste de Fonte na Base do Console -->
    <div class="relative z-10 flex items-center justify-between px-5 py-2 border-t border-white/[0.06] text-[9px] font-black text-slate-400 uppercase tracking-wider select-none shrink-0 bg-black/20">
      <div class="flex items-center gap-1.5">
        <Terminal class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
        Console
      </div>
      <div class="flex items-center gap-2">
        <span class="text-slate-500">Texto:</span>
        <div class="flex items-center bg-black/40 border border-white/[0.05] rounded-[var(--app-input-radius)] p-0.5">
          <button
            type="button"
            @click="$emit('decrease-font-size')"
            class="px-2 py-0.5 hover:bg-white/10 rounded-[var(--app-input-radius)] text-xs transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="Diminuir fonte"
          >
            -
          </button>
          <span class="px-1.5 text-[9px] font-mono text-indigo-400">{{ consoleFontSize }}px</span>
          <button
            type="button"
            @click="$emit('increase-font-size')"
            class="px-2 py-0.5 hover:bg-white/10 rounded-[var(--app-input-radius)] text-xs transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="Aumentar fonte"
          >
            +
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
