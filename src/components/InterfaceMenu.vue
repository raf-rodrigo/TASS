<script setup>
import { ref } from 'vue';
import { 
  X, Palette, Trash2, Plus,
  Image as ImageIcon, Sliders, Eraser,
  LayoutGrid, StickyNote, Layers, Type as TypeIcon, Droplets
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useModalDrag } from '../composables/useModalDrag';

const settings = useSettingsStore();
const { position, onMouseDown } = useModalDrag();

defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

const activeTab = ref('board');
const showAddWallpaper = ref(false);
const newWallpaperUrl = ref('');

const tabs = [
  { id: 'board', label: 'Board & Layout', icon: LayoutGrid, color: 'text-indigo-500' },
  { id: 'tasks', label: 'Estilo das Tarefas', icon: Layers, color: 'text-indigo-500' },
  { id: 'typography', label: 'Tipografia', icon: TypeIcon, color: 'text-indigo-500' },
  { id: 'notes', label: 'Notas Rápidas', icon: StickyNote, color: 'text-indigo-500' },
  { id: 'immersion', label: 'Imersão e Fundo', icon: ImageIcon, color: 'text-indigo-500' },
];

const fontOptions = [
  'Inter', 'Outfit', 'Lexend', 
  'Montserrat', 'Roboto', 'Ubuntu', 
  'Poppins', 'Open Sans', 'Sora',
  'Mulish', 'Quicksand', 'JetBrains Mono'
];

const noteColors = [
  '#fef9c3', '#FA6495', '#a3ff33', '#bae6fd', 
  '#e9d5ff', '#fed7aa', '#fbcfe8', '#f1f5f9'
];

const setWallpaper = (url) => {
  settings.backgroundImage = url;
  settings.saveSetting('app-bg-image', url);
};

const addCustomWallpaper = () => {
  if (!newWallpaperUrl.value.trim()) return;
  if (settings.customWallpapers.length >= 11) return;
  
  settings.customWallpapers.push({
    name: `Custom ${settings.customWallpapers.length + 1}`,
    url: newWallpaperUrl.value.trim()
  });
  settings.saveSetting('app-custom-wallpapers', settings.customWallpapers);
  newWallpaperUrl.value = '';
  showAddWallpaper.value = false;
};

const removeWallpaper = (index) => {
  settings.customWallpapers.splice(index, 1);
  settings.saveSetting('app-custom-wallpapers', settings.customWallpapers);
};

const clearWallpaper = () => {
  settings.backgroundImage = '';
  settings.saveSetting('app-bg-image', '');
};
</script>

<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click.self="emit('close')">
      <section 
        class="glass-panel w-[95%] max-w-4xl p-0 animate-scaleIn h-[90vh] md:h-[600px] flex flex-col overflow-hidden shadow-2xl border-indigo-500/10"
        :style="{ 
          '--modal-x': `${position.x}px`,
          '--modal-y': `${position.y}px`,
          transform: `translate(var(--modal-x), var(--modal-y))`,
          backgroundColor: settings.theme === 'dark' 
            ? `rgba(15, 23, 42, ${settings.opacityTargets.modals ? settings.cardOpacity / 100 : 0.98})` 
            : `rgba(255, 255, 255, ${settings.opacityTargets.modals ? settings.cardOpacity / 100 : 0.95})`
        }"
      >
        
        <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
          <!-- Sidebar de Abas (Handle de Arraste) -->
          <aside 
            class="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 flex flex-col p-4 cursor-grab active:cursor-grabbing group"
            :class="settings.opacityTargets.modals ? 'bg-transparent' : 'bg-slate-50/50 dark:bg-white/[0.02]'"
            @mousedown="onMouseDown"
          >
            <div class="hidden md:flex items-center gap-3 px-2 mb-8">
              <div class="p-2 bg-indigo-500 rounded-xl text-white">
                <Palette class="w-5 h-5" />
              </div>
              <h2 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">Ajustes Visuais</h2>
            </div>

            <nav class="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar gap-1 md:space-y-1 pb-2 md:pb-0">
              <button 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="activeTab = tab.id"
                class="flex-shrink-0 flex items-center gap-3 px-4 md:px-3 py-2 md:py-2.5 rounded-xl transition-all group"
                :class="activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-slate-200 dark:ring-white/10' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'"
              >
                <component :is="tab.icon" class="w-4 h-4" :class="activeTab === tab.id ? tab.color : 'text-slate-400'" />
                <span class="text-[11px] md:text-xs font-bold whitespace-nowrap">{{ tab.label }}</span>
              </button>
            </nav>

            <div class="hidden md:block p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 mt-auto">
              <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                As alterações na interface são aplicadas instantaneamente em tempo real.
              </p>
            </div>
          </aside>

          <!-- Conteúdo da Aba -->
          <main 
            class="flex-1 flex flex-col overflow-hidden relative"
            :class="settings.opacityTargets.modals ? 'bg-transparent' : 'bg-white dark:bg-slate-950'"
          >
            <!-- Close Button Top Right -->
            <button class="absolute top-6 right-6 icon-btn z-10" @click="emit('close')">
              <X class="w-5 h-5" />
            </button>

            <div class="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
              <transition name="fade-slide" mode="out-in">
                <!-- ABA: Board -->
                <div v-if="activeTab === 'board'" :key="'board'" class="space-y-8">
                  <div>
                    <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Board & Layout</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure a estrutura principal do seu quadro de tarefas.</p>
                  </div>

                  <div class="space-y-6">
                    <div class="space-y-3">
                      <label class="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Colunas do Board</label>
                      <div class="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/5 w-full">
                        <button v-for="n in 4" :key="n" @click="settings.columns = n; settings.saveSetting('app-columns', n)"
                          class="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300"
                          :class="settings.columns === n ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400'">{{ n }} Colunas</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ABA: Estilo das Tarefas -->
                <div v-else-if="activeTab === 'tasks'" :key="'tasks'" class="space-y-8">
                  <div>
                    <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Estilo das Tarefas</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Personalize a aparência visual dos seus cards de tarefa.</p>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                      <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comprimento</span>
                        <span class="text-xs font-black text-indigo-500">{{ settings.appWidth }}px</span>
                      </div>
                      <input type="range" v-model="settings.appWidth" min="800" max="2500" step="50" class="w-full tass-range" @change="settings.saveSetting('app-width', settings.appWidth)" />
                    </div>

                    <div class="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                      <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Espessura</span>
                        <span class="text-xs font-black text-indigo-500">{{ settings.cardPadding }}px</span>
                      </div>
                      <input type="range" v-model="settings.cardPadding" min="8" max="40" step="2" class="w-full tass-range" @change="settings.saveSetting('app-card-padding', settings.cardPadding)" />
                    </div>

                    <div class="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4 md:col-span-2">
                      <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arredondamento</span>
                        <span class="text-xs font-black text-indigo-500">{{ settings.cardBorderRadius }}px</span>
                      </div>
                      <input type="range" v-model="settings.cardBorderRadius" min="0" max="40" step="1" class="w-full tass-range" @change="settings.saveSetting('app-card-radius', settings.cardBorderRadius)" />
                    </div>

                    <!-- Escala de Texto -->
                    <div class="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                      <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tamanho do Título</span>
                        <span class="text-xs font-black text-indigo-500">{{ settings.taskNumberSize }}px</span>
                      </div>
                      <input type="range" v-model="settings.taskNumberSize" min="8" max="24" step="1" class="w-full tass-range" @change="settings.saveSetting('app-task-number-size', settings.taskNumberSize)" />
                    </div>

                    <div class="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                      <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tamanho da Descrição</span>
                        <span class="text-xs font-black text-indigo-500">{{ settings.taskDescriptionSize }}px</span>
                      </div>
                      <input type="range" v-model="settings.taskDescriptionSize" min="10" max="28" step="1" class="w-full tass-range" @change="settings.saveSetting('app-task-desc-size', settings.taskDescriptionSize)" />
                    </div>
                  </div>
                </div>

                <!-- ABA: Tipografia -->
                <div v-else-if="activeTab === 'typography'" :key="'typography'" class="space-y-8">
                  <div>
                    <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Tipografia</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Escolha a fonte que melhor se adapta ao seu estilo de trabalho.</p>
                  </div>

                  <div class="space-y-6">
                    <!-- Família de Fontes -->
                    <div class="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                      <div class="flex items-center gap-3 mb-2">
                        <TypeIcon class="w-5 h-5 text-indigo-500" />
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Família de Fontes</span>
                      </div>
                      <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <button v-for="font in fontOptions" :key="font" @click="settings.fontFamily = font; settings.saveSetting('app-font-family', font)"
                          class="px-2 py-2.5 text-[10px] font-medium rounded-xl border transition-all truncate"
                          :class="settings.fontFamily === font ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'"
                          :style="{ fontFamily: font }">{{ font }}</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ABA: Notas Rápidas -->
                <div v-else-if="activeTab === 'notes'" :key="'notes'" class="space-y-8">
                  <div>
                    <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Notas Rápidas</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Personalize a aparência do seu bloco de notas lateral.</p>
                  </div>

                  <div class="space-y-6">
                    <div class="p-6 bg-amber-500/5 dark:bg-amber-500/10 rounded-3xl border border-amber-500/10 space-y-5">
                      <div class="flex items-center gap-3">
                        <Palette class="w-5 h-5 text-amber-500" />
                        <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Cor do Papel</span>
                      </div>
                      <p class="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Escolha o tom que melhor se adapta ao seu foco:</p>
                      <div class="flex flex-wrap gap-3">
                        <button v-for="color in noteColors" :key="color" @click="settings.noteColor = color; settings.saveSetting('app-note-color', color)"
                          class="w-10 h-10 rounded-2xl border-2 transition-all hover:scale-110 shadow-sm"
                          :class="settings.noteColor === color ? 'border-amber-500 shadow-xl shadow-amber-500/20 scale-110' : 'border-transparent'"
                          :style="{ backgroundColor: color }"></button>
                      </div>
                    </div>
                  </div>
                </div>
                             <!-- ABA: Imersão e Fundo -->
                <div v-else-if="activeTab === 'immersion'" :key="'immersion'" class="space-y-6">
                  <!-- Galeria de Fundos -->
                  <div class="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-6">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <ImageIcon class="w-5 h-5 text-emerald-500" />
                        <h3 class="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">Galeria de Fundos</h3>
                      </div>
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ settings.customWallpapers.length }} / 11 Slots</span>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <!-- Clear Wallpaper Card -->
                      <button 
                        v-if="settings.customWallpapers.length > 0"
                        @click="clearWallpaper"
                        class="aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all group"
                        :class="!settings.backgroundImage ? 'border-indigo-500 bg-indigo-500/5 text-indigo-500' : 'border-slate-200 dark:border-white/10 text-slate-400 hover:border-red-500/50 hover:text-red-500'"
                      >
                        <Eraser class="w-6 h-6" />
                        <span class="text-[10px] font-bold uppercase tracking-tighter">Nenhum</span>
                      </button>

                      <!-- Wallpaper Presets Loop -->
                      <div 
                        v-for="(wp, index) in settings.customWallpapers" 
                        :key="index"
                        class="relative group aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer"
                        :class="settings.backgroundImage === wp.url ? 'border-emerald-500 scale-95 shadow-lg shadow-emerald-500/20' : 'border-transparent hover:border-slate-300 dark:hover:border-white/20'"
                        @click="setWallpaper(wp.url)"
                      >
                        <img :src="wp.url" class="w-full h-full object-cover" alt="Wallpaper Preview" />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            @click.stop="removeWallpaper(index)"
                            class="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                            title="Remover Wallpaper"
                          >
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <!-- Add New Wallpaper Button -->
                      <button 
                        v-if="settings.customWallpapers.length < 11"
                        @click="showAddWallpaper = !showAddWallpaper"
                        class="aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-500"
                      >
                        <Plus class="w-6 h-6" />
                        <span class="text-[10px] font-bold uppercase tracking-tighter">Novo</span>
                      </button>
                    </div>

                    <!-- Add Wallpaper Input Field -->
                    <div v-if="showAddWallpaper" class="animate-fadeIn p-4 bg-white dark:bg-white/5 rounded-2xl border border-emerald-500/30 space-y-4">
                      <div class="space-y-2">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">URL da Imagem</label>
                        <div class="flex gap-2">
                          <input 
                            v-model="newWallpaperUrl" 
                            type="text" 
                            placeholder="https://exemplo.com/imagem.jpg"
                            class="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            @keyup.enter="addCustomWallpaper"
                          />
                          <button @click="addCustomWallpaper" class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25">
                            Salvar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="pt-4 border-t border-slate-200 dark:border-white/10">
                      <div class="p-5 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 space-y-4">
                        <div class="flex justify-between items-center">
                          <div class="flex items-center gap-2">
                            <Sliders class="w-4 h-4 text-indigo-500" />
                            <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Desfoque do Fundo</span>
                          </div>
                          <span class="text-xs font-black text-indigo-500">{{ settings.backgroundBlur }}px</span>
                        </div>
                        <input 
                          type="range" 
                          v-model="settings.backgroundBlur" 
                          min="0" max="20" step="1" 
                          class="w-full tass-range-indigo" 
                          @change="settings.saveSetting('app-bg-blur', settings.backgroundBlur)" 
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Efeito de Transparência -->
                  <div class="p-6 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-3xl border border-indigo-500/10 space-y-6">
                    <div class="flex items-center gap-3">
                      <Droplets class="w-5 h-5 text-indigo-500" />
                      <h3 class="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">Transparência e Vidro</h3>
                    </div>

                    <div class="space-y-4">
                      <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nível de Opacidade</span>
                        <span class="text-xs font-black text-indigo-500">{{ settings.cardOpacity }}%</span>
                      </div>
                      <input type="range" v-model="settings.cardOpacity" min="10" max="100" step="5" class="w-full tass-range" @change="settings.saveSetting('app-card-opacity', settings.cardOpacity)" />
                      
                      <div class="pt-6 border-t border-slate-200 dark:border-white/5">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">Aplicar efeito em:</label>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label class="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-2xl cursor-pointer border border-slate-200 dark:border-white/5 group hover:border-indigo-500/30 transition-all">
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-400">Tarefas</span>
                            <div class="relative inline-flex items-center">
                              <input type="checkbox" v-model="settings.opacityTargets.cards" @change="settings.saveSetting('app-opacity-targets', settings.opacityTargets)" class="sr-only peer" />
                              <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"></div>
                            </div>
                          </label>

                          <label class="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-2xl cursor-pointer border border-slate-200 dark:border-white/5 group hover:border-indigo-500/30 transition-all">
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-400">Janelas e Menus</span>
                            <div class="relative inline-flex items-center">
                              <input type="checkbox" v-model="settings.opacityTargets.modals" @change="settings.saveSetting('app-opacity-targets', settings.opacityTargets)" class="sr-only peer" />
                              <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"></div>
                            </div>
                          </label>

                          <label class="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-2xl cursor-pointer border border-slate-200 dark:border-white/5 group hover:border-indigo-500/30 transition-all">
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-400">Menu Inferior</span>
                            <div class="relative inline-flex items-center">
                              <input type="checkbox" v-model="settings.opacityTargets.bottomBar" @change="settings.saveSetting('app-opacity-targets', settings.opacityTargets)" class="sr-only peer" />
                              <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"></div>
                            </div>
                          </label>

                          <label class="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-2xl cursor-pointer border border-slate-200 dark:border-white/5 group hover:border-indigo-500/30 transition-all">
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-400">Menu de Contexto</span>
                            <div class="relative inline-flex items-center">
                              <input type="checkbox" v-model="settings.opacityTargets.contextMenu" @change="settings.saveSetting('app-opacity-targets', settings.opacityTargets)" class="sr-only peer" />
                              <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"></div>
                            </div>
                          </label>

                          <label class="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-2xl cursor-pointer border border-slate-200 dark:border-white/5 group hover:border-indigo-500/30 transition-all md:col-span-2">
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-400">Barra de Ações (Filtros)</span>
                            <div class="relative inline-flex items-center">
                              <input type="checkbox" v-model="settings.opacityTargets.actionBar" @change="settings.saveSetting('app-opacity-targets', settings.opacityTargets)" class="sr-only peer" />
                              <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"></div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>

            <!-- Footer Manual -->
            <footer class="p-4 md:p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex gap-4">
              <button @click="emit('close')" class="w-full px-6 py-2.5 md:py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-xl shadow-indigo-500/20">Terminei os Ajustes</button>
            </footer>
          </main>
        </div>
      </section>
    </div>
  </transition>
</template>

<style scoped>
</style>

