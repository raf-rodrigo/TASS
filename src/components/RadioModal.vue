<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Music, X, Play, Square, Loader2 } from 'lucide-vue-next';
import BaseModal from './BaseModal.vue';
import AppInput from './base/AppInput.vue';
import { useRadioStore } from '../stores/radioStore';
import { notificationService } from '../services/notificationService';

const props = defineProps({
  radioToEdit: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);

const radioStore = useRadioStore();

const radioName = ref('');
const radioUrl = ref('');
const error = ref('');

// Estado do Teste de URL
const isTesting = ref(false);
const isTestPlaying = ref(false);
const testAudio = ref(null);

onMounted(() => {
  if (props.radioToEdit) {
    radioName.value = props.radioToEdit.name;
    radioUrl.value = props.radioToEdit.url;
  }
});

onBeforeUnmount(() => {
  stopTest();
});

const stopTest = () => {
  if (testAudio.value) {
    const audio = testAudio.value;
    testAudio.value = null; // Invalida a referência antes de limpar para que o listener ignore o erro
    audio.pause();
    audio.src = '';
  }
  isTestPlaying.value = false;
  isTesting.value = false;
};

const handleTestUrl = () => {
  if (isTestPlaying.value) {
    stopTest();
    return;
  }

  error.value = '';
  if (!radioUrl.value.trim()) {
    error.value = 'Insira uma URL para testar.';
    return;
  }

  if (!radioUrl.value.startsWith('http')) {
    error.value = 'URL inválida.';
    return;
  }

  try {
    isTesting.value = true;
    testAudio.value = new Audio(radioUrl.value);
    testAudio.value.volume = radioStore.volume;

    testAudio.value.addEventListener('playing', () => {
      if (!testAudio.value) return;
      isTesting.value = false;
      isTestPlaying.value = true;
    });

    testAudio.value.addEventListener('error', () => {
      // Se testAudio.value for null, significa que paramos o teste intencionalmente
      if (!testAudio.value) return;
      
      isTesting.value = false;
      isTestPlaying.value = false;
      error.value = 'Erro ao carregar URL de rádio.';
      notificationService.toast('URL de rádio inválida ou inacessível.', 'error');
      testAudio.value = null;
    });

    testAudio.value.play().catch(err => {
      console.error('Erro ao testar rádio:', err);
      // Ignora erro de interrupção intencional
      if (!testAudio.value) return;
      
      isTesting.value = false;
      error.value = 'Erro ao iniciar reprodução.';
    });
  } catch (err) {
    isTesting.value = false;
    error.value = 'Erro ao testar URL.';
  }
};

const handleSave = async () => {
  error.value = '';
  
  if (!radioName.value.trim() || !radioUrl.value.trim()) {
    error.value = 'Preencha o nome e a URL da rádio.';
    return;
  }
  
  if (!radioUrl.value.startsWith('http')) {
    error.value = 'A URL deve começar com http:// ou https://';
    return;
  }

  stopTest();

  if (props.radioToEdit) {
    await radioStore.updateRadio(props.radioToEdit.id, {
      name: radioName.value,
      url: radioUrl.value
    });
  } else {
    await radioStore.addRadio({
      name: radioName.value,
      url: radioUrl.value
    });
  }
  
  emit('close');
};
</script>

<template>
  <BaseModal 
    maxWidth="max-w-md" 
    @close="emit('close')"
    :icon="Music"
    :title="radioToEdit ? 'Editar Rádio' : 'Adicionar Rádio'"
    subtitle="Streaming Ao Vivo"
    layout="standard"
    cancelText="Cancelar"
    :okText="radioToEdit ? 'Atualizar' : 'Salvar Rádio'"
    @cancel="emit('close')"
    @ok="handleSave"
  >
    <div class="space-y-6">
      <!-- Corpo do Formulário -->
      <AppInput 
        v-model="radioName" 
        label="Nome da Rádio" 
        placeholder="Ex: Jazz Lounge" 
        :error="error && !radioName ? 'Obrigatório' : ''"
      />
      
      <div class="space-y-1.5">
        <div class="flex items-center justify-between px-1">
          <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            URL de Streaming (.mp3, .aac...)
          </label>
          
          <!-- Botão de Teste (Agora no topo/direita para melhor equilíbrio óptico) -->
          <button 
            @click="handleTestUrl"
            type="button"
            class="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 z-10"
            :class="[
              isTestPlaying 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                : 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white'
            ]"
            :disabled="isTesting"
          >
            <template v-if="isTesting">
              <Loader2 class="w-3 h-3 animate-spin" />
              <span>Conectando...</span>
            </template>
            <template v-else-if="isTestPlaying">
              <Square class="w-3 h-3 fill-current" />
              <span>Parar Teste</span>
            </template>
            <template v-else>
              <Play class="w-3 h-3 fill-current" />
              <span>Testar Link</span>
            </template>
          </button>
        </div>

        <AppInput 
          v-model="radioUrl" 
          type="url" 
          placeholder="https://..." 
          :error="error && !radioUrl ? 'Obrigatório' : ''"
        />
      </div>

      <div v-if="error" class="text-center text-red-500 text-[10px] font-black uppercase tracking-widest animate-shake">
        {{ error }}
      </div>
    </div>
  </BaseModal>
</template>
