<script setup>
import { LayoutGrid } from 'lucide-vue-next';
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <!-- Mini Header de Navegação -->
    <nav class="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span class="text-white font-black text-xs">TS</span>
        </div>
        <span class="font-bold text-slate-800 dark:text-slate-200 tracking-tight">System Lab</span>
      </div>

      <button 
        @click="$router.push('/')"
        class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all text-xs font-bold border border-slate-200 dark:border-slate-700"
      >
        <LayoutGrid class="w-3.5 h-3.5" />
        Voltar ao Workspace
      </button>
    </nav>

    <!-- Content Area -->
    <main class="w-full">
      <slot />
    </main>

    <!-- Simple Footer -->
    <footer class="py-12 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center gap-2">
      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">TASS Design System</p>
      <div class="w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-30"></div>
    </footer>
  </div>
</template>
