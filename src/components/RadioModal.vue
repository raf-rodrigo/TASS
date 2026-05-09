<script setup>
import { ref } from 'vue';
import { Music, X } from 'lucide-vue-next';
import BaseModal from './BaseModal.vue';
import AppInput from './base/AppInput.vue';
import { useRadioStore } from '../stores/radioStore';

const emit = defineEmits(['close']);

const radioStore = useRadioStore();

const newRadioName = ref('');
const newRadioUrl = ref('');
const error = ref('');

const handleSave = async () => {
  error.value = '';
  
  if (!newRadioName.value.trim() || !newRadioUrl.value.trim()) {
    error.value = 'Preencha o nome e a URL da rádio.';
    return;
  }
  
  if (!newRadioUrl.value.startsWith('http')) {
    error.value = 'A URL deve começar com http:// ou https://';
    return;
  }

  await radioStore.addRadio({
    name: newRadioName.value,
    url: newRadioUrl.value
  });
  
  emit('close');
};
</script>

<template>
  <BaseModal 
    maxWidth="max-w-md" 
    @close="emit('close')"
    :hideHeader="true"
  >
    <div class="flex flex-col h-full w-full bg-transparent">
      
      <!-- Header Manual -->
      <header class="flex items-center justify-between p-6 pb-4 border-b border-app-border-light">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
            <Music class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-xl font-black text-app-main tracking-tighter leading-none">Adicionar Rádio</h2>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streaming Ao Vivo</span>
          </div>
        </div>
        <button @click="emit('close')" class="icon-btn">
          <X class="w-5 h-5" />
        </button>
      </header>

      <!-- Corpo do Formulário -->
      <main class="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar">
        <AppInput 
          v-model="newRadioName" 
          label="Nome da Rádio" 
          placeholder="Ex: Jazz Lounge" 
          :error="error && !newRadioName ? 'Obrigatório' : ''"
        />
        
        <AppInput 
          v-model="newRadioUrl" 
          type="url" 
          label="URL de Streaming (.mp3, .aac...)" 
          placeholder="https://..." 
          :error="error && !newRadioUrl ? 'Obrigatório' : ''"
        />

        <div v-if="error" class="text-center text-red-500 text-[10px] font-black uppercase tracking-widest animate-shake">
          {{ error }}
        </div>
      </main>

      <!-- Footer Manual Integrado -->
      <footer class="p-6 border-t border-app-border-light bg-app-surface flex gap-3 mt-auto">
        <button 
          @click="emit('close')" 
          class="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-tight text-app-sub hover:bg-app-surface-muted transition-all active:scale-95"
        >
          Cancelar
        </button>
        <button 
          @click="handleSave" 
          class="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-tight bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all active:scale-95"
        >
          Salvar Rádio
        </button>
      </footer>

    </div>
  </BaseModal>
</template>
