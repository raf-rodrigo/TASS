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
    cancelText="Cancelar"
    okText="Salvar Rádio"
    @cancel="emit('close')"
    @ok="handleSave"
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
  </BaseModal>
</template>
