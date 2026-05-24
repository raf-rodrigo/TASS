<script setup>
import { onMounted } from 'vue';
import { useSettingsStore } from './stores/settingsStore';
import GitRebuilder from './components/GitRebuilder.vue';

const settings = useSettingsStore();

onMounted(async () => {
  await settings.loadSettings();
});
</script>

<template>
  <div 
    v-if="settings.isInitialized"
    id="breathe-root"
    class="md:h-screen md:overflow-hidden min-h-screen bg-slate-100 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col font-sans select-none transition-colors duration-300"
  >
    <!-- Background Gradient Gradients -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]"></div>
    </div>

    <!-- Main GitRebuilder Dashboard Component -->
    <div class="relative z-10 flex-1 flex flex-col">
      <GitRebuilder />
    </div>
  </div>
  <div v-else class="min-h-screen flex items-center justify-center bg-[#0B0F19]">
    <div class="text-center space-y-4">
      <div class="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
      <div class="text-indigo-400 font-bold uppercase tracking-widest text-xs">Carregando Breathe...</div>
    </div>
  </div>
</template>

<style>
/* Estilos globais e animações */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.4s ease-out forwards;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
