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
  <div class="border border-slate-200 dark:border-white/[0.06] rounded-[var(--app-card-radius)] overflow-hidden bg-black/95 flex flex-col shadow-xl flex-1 min-h-0">
    <!-- Console de Texto -->
    <div
      ref="consoleEl"
      :style="{ fontSize: consoleFontSize + 'px' }"
      class="p-5 font-mono leading-relaxed text-slate-350 overflow-y-auto custom-scrollbar flex flex-col gap-2 flex-1 select-text"
    >
      <div v-if="logs.length === 0" class="text-slate-600 italic">
        {{ placeholder }}
      </div>
      <div
        v-for="(log, idx) in logs"
        :key="idx"
        :class="{
          'text-slate-400': log.type === 'info',
          'text-emerald-400': log.type === 'success',
          'text-amber-400': log.type === 'warning',
          'text-red-400 font-bold': log.type === 'error'
        }"
      >
        <span class="text-slate-655">[{{ log.time }}]</span> {{ log.text }}
      </div>
    </div>

    <!-- Ajuste de Fonte na Base do Console -->
    <div class="flex items-center justify-between px-5 py-2 bg-slate-950/90 dark:bg-slate-950/80 border-t border-slate-900/60 dark:border-white/[0.06] text-[9px] font-black text-slate-400 uppercase tracking-wider select-none shrink-0">
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
            class="px-2 py-0.5 hover:bg-white/5 rounded text-xs transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="Diminuir fonte"
          >
            -
          </button>
          <span class="px-1.5 text-[9px] font-mono text-indigo-400">{{ consoleFontSize }}px</span>
          <button
            type="button"
            @click="$emit('increase-font-size')"
            class="px-2 py-0.5 hover:bg-white/5 rounded text-xs transition-colors cursor-pointer text-slate-400 hover:text-white"
            title="Aumentar fonte"
          >
            +
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
