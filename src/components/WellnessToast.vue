<script setup>
import { Sparkles } from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';

const settings = useSettingsStore();

defineProps({
  message: String,
  show: Boolean
});
</script>

<template>
  <transition
    enter-active-class="transition duration-1000 ease-out"
    enter-from-class="opacity-0 translate-y-4 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition duration-1000 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-4 scale-95"
  >
    <div 
      v-if="show" 
      class="fixed bottom-10 left-10 z-[500] max-w-xs pointer-events-none"
    >
      <div 
        class="glass-panel !p-4 border-indigo-500/20 shadow-2xl flex items-center gap-4 ring-1 ring-black/5"
        :style="{ 
          backgroundColor: settings.theme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)'
        }"
      >
        <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Sparkles class="w-5 h-5 text-white" />
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Dica de Bem-estar</span>
          <p class="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
            {{ message }}
          </p>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.glass-panel {
  /* Garante que o toast tenha o estilo de vidro mesmo se as globais mudarem */
  border-radius: var(--app-card-radius);
}
</style>
