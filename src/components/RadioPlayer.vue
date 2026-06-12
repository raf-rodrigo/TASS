<script setup>
import { computed, onMounted } from 'vue';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, VolumeX, Plus, Trash2, Headphones, Star,
  X, Pencil, Upload
} from 'lucide-vue-next';
import { useRadioStore } from '../stores/radioStore';
import { useSettingsStore } from '../stores/settingsStore';
import RadioModal from './RadioModal.vue';
import { ref } from 'vue';
import { useSwipe } from '@vueuse/core';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const radioStore = useRadioStore();
const settings = useSettingsStore();

onMounted(() => {
  radioStore.init();
});

const showAddModal = ref(false);
const radioToEdit = ref(null);

const togglePlay = () => radioStore.toggle();

const openEditModal = (radio) => {
  radioToEdit.value = radio;
  showAddModal.value = true;
};

const handleCloseModal = () => {
  showAddModal.value = false;
  radioToEdit.value = null;
};

const handleImport = async (event) => {
  const file = event.target.files[0];
  if (file) {
    await radioStore.importRadios(file);
    event.target.value = ''; // reseta o input
  }
};

// Computed property para a classe de slide do painel lateral (Opção 1)
const panelSlideClass = computed(() => {
  return props.isOpen ? 'translate-x-0' : '-translate-x-full';
});

// Arraste fluido para a Rádio (fixada na esquerda)
const asideRef = ref(null);
const { lengthX, isSwiping } = useSwipe(asideRef, {
  onSwipeEnd() {
    // Painel na esquerda -> deslizar para a esquerda (lengthX > 0) fecha
    if (lengthX.value > 100) {
      emit('close');
    }
  }
});

const swipeTransform = computed(() => {
  if (!isSwiping.value || !props.isOpen) return '';
  // Mover para a esquerda (valores negativos de X) conforme o dedo desliza para a esquerda (lengthX > 0)
  return `translateX(${Math.min(0, -lengthX.value)}px)`;
});
</script>

<template>
  <!-- Overlay para fechar ao clicar fora -->
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-[250] bg-slate-900/10 backdrop-blur-[1px]"
      @click="emit('close')"
    ></div>
  </Transition>

  <!-- Sidebar da Rádio (Opção 1 - Drawer) -->
  <aside 
    ref="asideRef"
    class="fixed top-0 left-0 h-full w-[340px] max-w-[90vw] z-[260] shadow-2xl flex flex-col glass-panel !p-0 border-r border-app-border-light"
    :class="[
      isSwiping ? '!transition-none' : 'transition-transform duration-500 ease-in-out',
      panelSlideClass
    ]"
    :style="{ 
      transform: swipeTransform || undefined,
      backgroundColor: `rgba(var(--app-bg-raw), var(--app-modal-sidebar-opacity))`,
      backdropFilter: 'blur(var(--app-glass-blur)) brightness(var(--app-glass-brightness)) saturate(var(--app-glass-saturate))'
    }"
  >
    <!-- Cabeçalho Fixo -->
    <div class="p-5 flex items-center justify-between border-b border-app-border-light bg-black/5 dark:bg-white/5 shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
          <Headphones class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-black text-app-main tracking-widest uppercase">Rádio TASS</h2>
          <p class="text-[10px] text-app-sub">Seu player embutido</p>
        </div>
      </div>
      <button 
        @click="emit('close')" 
        class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Área Superior: Player Destaque -->
    <div class="p-6 flex flex-col gap-6 bg-gradient-to-b from-amber-500/5 to-transparent shrink-0">
      <div class="flex flex-col items-center gap-4 text-center">
        <!-- Status Label -->
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
          <template v-if="radioStore.isLoading">
            <span class="animate-pulse">Carregando Stream...</span>
          </template>
          <template v-else-if="radioStore.isPlaying">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            Transmissão Ao Vivo
          </template>
          <template v-else>
            Pausado
          </template>
        </div>
        
        <h3 class="text-lg font-black text-app-main tracking-tight truncate w-full px-2 leading-tight" :title="radioStore.currentRadio?.name">
          {{ radioStore.currentRadio ? radioStore.currentRadio.name : 'Nenhuma rádio selecionada' }}
        </h3>
      </div>

      <!-- Controles Massivos -->
      <div class="flex items-center justify-center gap-5">
        <button 
          @click="radioStore.prev" 
          class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:scale-105 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all active:scale-95 rounded-full border border-slate-100 dark:border-white/5"
        >
          <SkipBack class="w-4 h-4 fill-current" />
        </button>
        
        <button 
          @click="togglePlay" 
          class="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xl shadow-amber-500/40 hover:scale-105 transition-all active:scale-95 rounded-full"
        >
          <Pause v-if="radioStore.isPlaying" class="w-6 h-6 fill-current" />
          <Play v-else class="w-6 h-6 fill-current ml-1" />
        </button>

        <button 
          @click="radioStore.next" 
          class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:scale-105 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all active:scale-95 rounded-full border border-slate-100 dark:border-white/5"
        >
          <SkipForward class="w-4 h-4 fill-current" />
        </button>
      </div>

      <!-- Volume -->
      <div class="flex items-center gap-4 px-2 pt-2">
        <button @click="radioStore.setVolume(radioStore.volume === 0 ? 0.5 : 0)" class="text-amber-500/70 hover:text-amber-500 transition-colors shrink-0">
          <VolumeX v-if="radioStore.volume === 0" class="w-4 h-4" />
          <Volume2 v-else class="w-4 h-4" />
        </button>
        <input 
          type="range" min="0" max="1" step="0.01" 
          :value="radioStore.volume"
          @input="e => radioStore.setVolume(parseFloat(e.target.value))"
          class="flex-1 app-range h-1.5 bg-black/10 dark:bg-white/10 rounded-full"
        />
        <span class="text-[10px] font-black text-amber-600/60 dark:text-amber-400/60 w-8 text-right tabular-nums shrink-0">
          {{ Math.round(radioStore.volume * 100) }}%
        </span>
      </div>
    </div>

    <!-- Lista de Estações (Rola o resto da altura) -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-5 pt-0">
      <div class="flex items-center justify-between mb-3 sticky top-0 bg-app-surface/80 backdrop-blur-md py-2 z-10 border-b border-app-border-light">
        <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest">Estações</h4>
        <span class="text-[10px] font-bold bg-black/5 dark:bg-white/5 text-slate-500 px-2 py-0.5 rounded-md">
          {{ radioStore.radios.length }}
        </span>
      </div>

      <div class="flex flex-col gap-2">
        <div 
          v-for="radio in radioStore.radios" :key="radio.id"
          class="flex items-center justify-between p-3 border transition-all group cursor-pointer"
          :class="radioStore.currentRadioId === radio.id 
          ? 'border-amber-500/50 shadow-sm bg-amber-500/10' 
          : 'border-app-border-light hover:bg-black/5 dark:hover:bg-white/5'"
          :style="{ borderRadius: 'var(--app-input-radius)' }"
          @click="radioStore.changeStation(radio.id)"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div 
              class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0"
              :class="radioStore.currentRadioId === radio.id ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-amber-500'"
            >
              <Headphones v-if="radioStore.currentRadioId !== radio.id" class="w-3.5 h-3.5" />
              <!-- Equalizador Animado -->
              <div v-else-if="radioStore.isPlaying" class="flex items-end justify-center gap-[2px] h-3 w-3.5">
                <span class="w-[2px] h-1.5 bg-white animate-[bounce_1s_infinite_0.1s]"></span>
                <span class="w-[2px] h-3 bg-white animate-[bounce_1s_infinite_0.3s]"></span>
                <span class="w-[2px] h-2 bg-white animate-[bounce_1s_infinite_0.5s]"></span>
              </div>
              <Play v-else class="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
            
            <span class="text-[10px] font-black text-app-main truncate group-hover:text-amber-500 transition-colors" :title="radio.name">{{ radio.name }}</span>
          </div>

          <!-- Ações Rápidas -->
          <div class="flex flex-col items-end gap-1 shrink-0 ml-2">
            <div class="flex items-center gap-0.5 mb-1">
              <Star 
                v-for="i in 5" :key="i"
                class="w-2.5 h-2.5 cursor-pointer hover:scale-125 transition-transform"
                :class="i <= (radio.stars || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700 hover:text-amber-300'"
                @click.stop="radioStore.rateRadio(radio.id, i)"
              />
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click.stop="openEditModal(radio)" class="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-indigo-500 transition-colors">
                 <Pencil class="w-3 h-3" />
              </button>
              <button @click.stop="radioStore.deleteRadio(radio.id)" class="p-1.5 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
                 <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rodapé de Ações -->
    <div class="p-5 border-t border-app-border-light bg-black/5 dark:bg-white/5 shrink-0 flex gap-2">
      <button 
        @click.stop="showAddModal = true" 
        class="flex-1 py-3 border-2 border-dashed border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/10 hover:border-amber-500 transition-all flex items-center justify-center gap-2 active:scale-95 rounded-xl"
      >
        <Plus class="w-4 h-4" /> Adicionar Rádio
      </button>

      <label 
        class="w-14 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-amber-500 hover:border-amber-500 transition-all cursor-pointer rounded-xl active:scale-95 shrink-0"
        title="Importar Lista JSON"
      >
        <Upload class="w-4 h-4" />
        <input type="file" accept=".json" class="hidden" @change="handleImport" />
      </label>
    </div>
  </aside>

  <!-- Modal Secundário para Cadastro (Mantém como Teleport para não ser cortado pela sidebar) -->
  <Teleport to="body">
    <RadioModal 
      v-if="showAddModal" 
      :radioToEdit="radioToEdit"
      @close="handleCloseModal" 
    />
  </Teleport>
</template>

<style scoped>
.app-range {
  -webkit-appearance: none;
  appearance: none;
}
.app-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #f59e0b; /* amber-500 */
  cursor: pointer;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
}
.app-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #f59e0b;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
}
</style>
