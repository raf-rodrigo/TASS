<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, VolumeX, Plus, Trash2, X, Music 
} from 'lucide-vue-next';
import { useRadioStore } from '../stores/radioStore';
import RadioModal from './RadioModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const radioStore = useRadioStore();

onMounted(() => {
  radioStore.init();
});

const showList = ref(false);
const showAddModal = ref(false);

const togglePlay = () => radioStore.toggle();
</script>

<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-8 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-8 scale-95"
  >
    <div 
      v-if="isOpen" 
      class="fixed bottom-24 right-4 md:right-12 z-[150] w-80 flex flex-col pointer-events-auto"
    >
      <div class="glass-panel p-5 space-y-4 rounded-2xl shadow-2xl border border-white/10 dark:border-white/5 relative overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
              <Music class="w-4 h-4" />
            </div>
            <h3 class="text-xs font-black text-app-main uppercase tracking-widest">Web Radio</h3>
          </div>
          <button @click="emit('close')" class="icon-btn -mr-2">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Current Track Info -->
        <div class="text-center space-y-1 py-2">
          <p class="text-sm font-bold text-app-main truncate px-4">
            {{ radioStore.currentRadio ? radioStore.currentRadio.name : 'Nenhuma rádio' }}
          </p>
          <div class="h-4 flex items-center justify-center gap-1">
            <template v-if="radioStore.isLoading">
              <span class="text-[9px] font-bold text-indigo-500 animate-pulse uppercase tracking-widest">Carregando...</span>
            </template>
            <template v-else-if="radioStore.isPlaying">
              <span class="w-1 h-3 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0.1s]"></span>
              <span class="w-1 h-4 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0.3s]"></span>
              <span class="w-1 h-2 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0.5s]"></span>
              <span class="text-[9px] font-bold text-indigo-500 ml-1 uppercase tracking-widest">Ao Vivo</span>
            </template>
            <template v-else>
              <span class="text-[9px] font-bold text-app-muted uppercase tracking-widest">Pausado</span>
            </template>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-center gap-4">
          <button @click="radioStore.prev" class="p-2 text-app-sub hover:text-indigo-500 transition-colors active:scale-95">
            <SkipBack class="w-5 h-5 fill-current" />
          </button>
          
          <button 
            @click="togglePlay" 
            class="w-12 h-12 flex items-center justify-center bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95"
          >
            <Pause v-if="radioStore.isPlaying" class="w-5 h-5 fill-current" />
            <Play v-else class="w-5 h-5 fill-current ml-1" />
          </button>

          <button @click="radioStore.next" class="p-2 text-app-sub hover:text-indigo-500 transition-colors active:scale-95">
            <SkipForward class="w-5 h-5 fill-current" />
          </button>
        </div>

        <!-- Volume -->
        <div class="flex items-center gap-3 pt-2">
          <button @click="radioStore.setVolume(radioStore.volume === 0 ? 0.5 : 0)" class="text-app-muted hover:text-indigo-500 transition-colors">
            <VolumeX v-if="radioStore.volume === 0" class="w-4 h-4" />
            <Volume2 v-else class="w-4 h-4" />
          </button>
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            :value="radioStore.volume"
            @input="e => radioStore.setVolume(parseFloat(e.target.value))"
            class="flex-1 app-range h-1"
          />
        </div>

        <!-- Configs/List Toggle -->
        <div class="pt-2 border-t border-app-border-light">
          <button 
            @click="showList = !showList" 
            class="w-full flex items-center justify-between p-2 rounded-xl hover:bg-app-surface-muted transition-colors text-[10px] font-bold text-app-sub uppercase tracking-widest"
          >
            <span class="flex items-center gap-2"><Music class="w-3.5 h-3.5" /> Lista de Rádios</span>
            <span class="bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-md">{{ radioStore.radios.length }}</span>
          </button>
        </div>

        <!-- Expanded List -->
        <div v-if="showList" class="pt-2 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          <div 
            v-for="(radio, index) in radioStore.radios" :key="radio.id"
            class="flex items-center justify-between p-2 rounded-xl transition-all group cursor-pointer"
            :class="radioStore.currentRadioIndex === index ? 'bg-indigo-500 text-white shadow-md' : 'hover:bg-app-surface text-app-main'"
            @click="radioStore.changeStation(index)"
          >
            <span class="text-[10px] font-bold truncate pr-2">{{ radio.name }}</span>
            <button 
              v-if="!radio.isDefault" 
              @click.stop="radioStore.deleteRadio(radio.id)" 
              class="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>

          <div class="pt-2">
             <button @click="showAddModal = true" class="w-full py-2 border border-dashed border-app-border-light rounded-xl text-[10px] font-bold text-app-sub hover:text-indigo-500 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-1 uppercase tracking-widest">
                <Plus class="w-3 h-3" /> Nova Rádio
             </button>
          </div>
        </div>

      </div>
    </div>
  </transition>

  <!-- Modal Centralizado para Nova Rádio -->
  <Teleport to="body">
    <RadioModal 
      v-if="showAddModal" 
      @close="showAddModal = false" 
    />
  </Teleport>
</template>

<style scoped>
</style>
