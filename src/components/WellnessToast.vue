<script setup>
import { Sparkles } from 'lucide-vue-next';

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
      class="fixed bottom-24 left-1/2 -translate-x-1/2 md:translate-x-0 md:bottom-10 md:left-10 z-[500] w-[90vw] md:w-auto md:max-w-xs pointer-events-none"
    >
      <div 
        class="!p-4 border border-app-border-light shadow-2xl flex items-center gap-4 ring-1 ring-black/5 bg-app-glass backdrop-blur-md"
        :style="{ borderRadius: 'var(--app-card-radius)' }"
      >
        <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Sparkles class="w-5 h-5 text-white" />
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Dica de Bem-estar</span>
          <p class="text-xs font-bold text-app-main leading-relaxed">
            {{ message }}
          </p>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
</style>
