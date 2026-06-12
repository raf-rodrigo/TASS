<script setup>
import { ref } from 'vue';
import TaskCard from '../components/TaskCard.vue';
import { ArrowLeft, Beaker } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();

const containerWidth = ref(600);

const mockTask = ref({
  id: 'TASK-001',
  title: 'LAB-999',
  description: 'Esta é uma tarefa de teste longo para verificar o comportamento do Progressive Disclosure e text-overflow no card. Ela tem um texto bem comprido propositalmente para forçar a barra do componente a exibir as reticências e cortar o conteúdo excedente de forma limpa, garantindo a estética.',
  status: 'In Progress',
  priority: 'Alta',
  totalTimeSpent: 3661000, // 1h 1m 1s
  isRunning: false,
  completed: false,
  styleId: null,
  branchUrl: 'https://gitlab.com/test/branch',
  githubBranchUrl: 'https://github.com/test/branch',
  moreInfo: 'Informações adicionais bem longas para testar o ícone',
  dbScripts: 'SELECT * FROM test;',
  taskUrl: 'https://github.com',
  devUrl: 1,
  homologUrl: 1,
  prodUrl: 1,
  _labOverride: true
});
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6 flex flex-col items-center">
    <!-- Header -->
    <div class="w-full max-w-4xl flex items-center justify-between mb-8">
      <button @click="router.push('/')" class="btn btn-secondary flex items-center gap-2 px-4 py-2">
        <ArrowLeft class="w-4 h-4" /> Voltar
      </button>
      <div class="flex items-center gap-3">
        <Beaker class="w-6 h-6 text-indigo-500" />
        <h1 class="text-xl font-black uppercase tracking-tight">Laboratório de Responsividade (TaskCard)</h1>
      </div>
    </div>

    <!-- Controles -->
    <div class="w-full max-w-4xl bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold uppercase tracking-widest text-slate-500">Controle de Largura do Container</h3>
        <div class="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg font-black font-mono">
          {{ containerWidth }}px
        </div>
      </div>
      <input 
        type="range" 
        v-model="containerWidth" 
        min="164" 
        max="600" 
        step="1" 
        class="w-full app-range" 
      />
      
      <!-- HUD / Dicas -->
      <div class="grid grid-cols-3 gap-4 mt-6">
        <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
          <span class="block text-xs font-bold text-slate-500 mb-1">Total Icons (4)</span>
          <span class="text-sm font-black text-indigo-500">> 330px</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
          <span class="block text-xs font-bold text-slate-500 mb-1">Progressive Shrink</span>
          <span class="text-sm font-black text-amber-500">242px - 330px</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
          <span class="block text-xs font-bold text-slate-500 mb-1">Micro Mode (0)</span>
          <span class="text-sm font-black text-rose-500">&lt; 242px</span>
        </div>
      </div>
    </div>

    <!-- Arena de Teste -->
    <div class="w-full max-w-4xl flex justify-center bg-slate-200 dark:bg-slate-950 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 relative overflow-hidden">
      <!-- Grid de Fundo -->
      <div class="absolute inset-0" style="background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px); background-size: 20px 20px; opacity: 0.2"></div>
      
      <!-- Container Redimensionável -->
      <div 
        class="relative transition-all duration-75 ease-linear border-x-2 border-indigo-500/30 flex flex-col items-stretch"
        :style="{ width: containerWidth + 'px' }"
      >
        <TaskCard :task="mockTask" />
        
        <!-- Réguas Visuais -->
        <div class="absolute -top-6 left-0 text-[9px] font-black text-indigo-500">0</div>
        <div class="absolute -top-6 right-0 text-[9px] font-black text-indigo-500">{{ containerWidth }}px</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Aproveitando o app-range do TASS */
</style>
