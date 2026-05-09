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
    :icon="Music"
    title="Adicionar Rádio"
    subtitle="Streaming Ao Vivo"
    layout="standard"
  >
    <!-- Corpo do Formulário -->
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

    <!-- Footer Padrão Injetado -->
    <template #footer>
      <button 
        @click="emit('close')" 
        class="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-tight text-app-sub hover:bg-app-surface-muted transition-all active:scale-95 border border-transparent"
      >
        Cancelar
      </button>
      <button 
        @click="handleSave" 
        class="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-tight bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all active:scale-95"
      >
        Salvar Rádio
      </button>
    </template>
  </BaseModal>
</template>
