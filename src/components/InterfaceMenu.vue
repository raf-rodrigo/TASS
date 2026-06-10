<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { 
  X, Palette, Trash2, Plus, Settings,
  Image as ImageIcon, Eraser, MousePointer2,
  LayoutGrid, Layers, Type as TypeIcon, Droplets,
  Cloud, Loader2, ArrowLeft, RotateCcw, Clock,
  Save, CheckCircle2, Pencil, Upload, Download, Puzzle
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { useTaskStyleStore } from '../stores/taskStyleStore';
import { useWeatherStore } from '../stores/weatherStore';
import { notificationService } from '../services/notificationService';
import { backupService } from '../services/backupService';
import BaseModal from './BaseModal.vue';
import AppColorPalette from './AppColorPalette.vue';
import AppInput from './base/AppInput.vue';
import { useTabSwipe } from '../composables/useTabSwipe';

const settings = useSettingsStore();
const taskStore = useTaskStore();
const taskStyleStore = useTaskStyleStore();
const weatherStore = useWeatherStore();

const props = defineProps({
  isOpen: Boolean,
  initialTab: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['close', 'test-wellness', 'open-settings', 'open-style-builder']);

const activeTab = ref(props.initialTab || 'wallpapers');
// Google Drive picker state removed

// Google Drive wallpaper functions removed

onMounted(() => {
  if (props.initialTab) {
    activeTab.value = props.initialTab;
  } else if (settings.keepWindowState) {
    const saved = localStorage.getItem('app-last-interface-tab');
    if (saved) activeTab.value = saved;
  }
});

watch(activeTab, (newVal, oldVal) => {
  if (newVal === 'action-settings') {
    emit('open-settings');
    setTimeout(() => { activeTab.value = oldVal !== 'action-settings' && oldVal ? oldVal : 'wallpapers'; }, 50);
  } else if (settings.keepWindowState) {
    localStorage.setItem('app-last-interface-tab', newVal);
  }
});

// Live Preview para arredondamento
watch(() => settings.cardBorderRadius, (newVal) => {
  if (newVal === undefined || newVal === null) return;
  requestAnimationFrame(() => {
    const root = document.documentElement;
    if (root) {
      root.style.setProperty('--app-card-radius', newVal + 'px');
      root.style.setProperty('--app-input-radius', Math.round(newVal * 0.6) + 'px');
    }
  });
  settings.saveSetting('app-card-radius', newVal);
}, { immediate: true });

// Removida a lógica de edição local de presets. Agora é gerenciada pelo TaskStyleBuilderModal.

const handleImportPalettes = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const normalizePalette = (arr) => arr.map(c => {
    const clr = String(c).trim();
    if (/^[0-9A-Fa-f]{3,8}$/.test(clr)) {
      return `#${clr}`;
    }
    return clr;
  });

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.titlePalette && Array.isArray(data.titlePalette)) {
        settings.titlePalette = normalizePalette(data.titlePalette);
        settings.saveSetting('app-title-palette', settings.titlePalette);
      }
      if (data.bodyPalette && Array.isArray(data.bodyPalette)) {
        settings.bodyPalette = normalizePalette(data.bodyPalette);
        settings.saveSetting('app-body-palette', settings.bodyPalette);
      }
      if (data.textLightPalette && Array.isArray(data.textLightPalette)) {
        settings.textLightPalette = normalizePalette(data.textLightPalette);
        settings.saveSetting('app-text-light-palette', settings.textLightPalette);
      }
      if (data.textDarkPalette && Array.isArray(data.textDarkPalette)) {
        settings.textDarkPalette = normalizePalette(data.textDarkPalette);
        settings.saveSetting('app-text-dark-palette', settings.textDarkPalette);
      }
      notificationService.toast('Paletas importadas com sucesso!');
    } catch (err) {
      notificationService.alert('JSON Inválido', `Erro na estrutura do arquivo: ${err.message}`, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
};

const tabs = [
  { id: 'wallpapers', label: 'Papéis de Parede', icon: ImageIcon, color: 'text-indigo-500', desc: 'Troque o clima do seu workspace instantaneamente.' },
  { id: 'board', label: 'Board & Layout', icon: LayoutGrid, color: 'text-indigo-500', desc: 'Configure a estrutura principal do seu quadro de tarefas.' },
  { id: 'tasks', label: 'Construtor de Estilos', icon: Layers, color: 'text-indigo-500', desc: 'Crie e gerencie os Presets Visuais (WYSIWYG).' },
  { id: 'typography', label: 'Tipografia', icon: TypeIcon, color: 'text-indigo-500', desc: 'Escolha a fonte que melhor se adapta ao seu estilo.' },
  { id: 'effects', label: 'Efeitos e Vidro', icon: Droplets, color: 'text-indigo-500', desc: 'Ajuste o desfoque e as transparências do sistema.' },
  { id: 'widgets', label: 'Widgets', icon: Puzzle, color: 'text-indigo-500', desc: 'Gerencie mini-aplicativos e integrações extras.' },
  { id: 'action-settings', label: 'Configurações', icon: Settings, color: 'text-indigo-500', isAction: true },
];

const activeTabObj = computed(() => tabs.find(t => t.id === activeTab.value) || tabs[0]);

const navRef = ref(null);
const swipeAreaRef = ref(null);
const { offsetX, isSwiping, jumpMode, disableVueTransition } = useTabSwipe(activeTab, tabs, navRef, swipeAreaRef);

const fontCategories = [
  {
    name: 'Sans-Serif (Moderna / UI)',
    fonts: ['Inter', 'Outfit', 'Lexend', 'Plus Jakarta Sans', 'Montserrat', 'Roboto', 'Poppins', 'Open Sans', 'Sora', 'Mulish', 'Ubuntu']
  },
  {
    name: 'Serif (Clássica / Elegante)',
    fonts: ['Playfair Display', 'Lora']
  },
  {
    name: 'Monospace (Código / Tech)',
    fonts: ['JetBrains Mono', 'Fira Code']
  },
  {
    name: 'Arredondada e Display',
    fonts: ['Quicksand', 'Comfortaa', 'Fredoka']
  }
];

const setWallpaper = (url) => {
  settings.backgroundImage = url;
  settings.saveSetting('app-bg-image', url);
};

const addCustomWallpaper = async () => {
  if (settings.customWallpapers.length >= 17) return;
  
  const newUrl = await notificationService.prompt({
    title: 'Novo Papel de Parede',
    message: 'Cole o link direto da imagem que deseja usar:',
    placeholder: 'https://...',
    confirmText: 'Adicionar'
  });
  
  if (newUrl !== null && newUrl.trim() !== '') {
    const url = newUrl.trim();
    if (url.includes('drive.google.com')) {
      notificationService.toast('Links do Google Drive não são suportados para papel de parede. Use um link direto de imagem.', 'warning');
      return;
    }
    
    settings.customWallpapers = [...settings.customWallpapers, {
      name: `Custom ${settings.customWallpapers.length + 1}`,
      url: url
    }];
    await settings.saveSetting('app-custom-wallpapers', settings.customWallpapers);
    notificationService.toast('Papel de parede adicionado com sucesso!', 'success');
  }
};

const removeWallpaper = async (index) => {
  try {
    settings.customWallpapers.splice(index, 1);
    await settings.saveSetting('app-custom-wallpapers', [...settings.customWallpapers]);
    notificationService.toast('Papel de parede removido!');
  } catch (error) {
    console.error("Erro ao remover wallpaper:", error);
  }
};

const editWallpaper = async (index) => {
  const wp = settings.customWallpapers[index];
  const newUrl = await notificationService.prompt({
    title: 'Editar Link da Imagem',
    message: 'Verifique ou altere o link direto da imagem:',
    value: wp.url,
    confirmText: 'Salvar'
  });
  
  if (newUrl !== null && newUrl.trim() !== '') {
    const url = newUrl.trim();
    if (url.includes('drive.google.com')) {
      notificationService.toast('Links do Google Drive não são suportados. A edição foi cancelada.', 'warning');
      return;
    }
    
    const oldUrl = wp.url;
    settings.customWallpapers[index].url = url;
    await settings.saveSetting('app-custom-wallpapers', [...settings.customWallpapers]);
    
    if (settings.backgroundImage === oldUrl) {
      settings.backgroundImage = url;
      await settings.saveSetting('app-bg-image', url);
    }
    notificationService.toast('Link atualizado!');
  }
};

const clearWallpaper = () => {
  settings.backgroundImage = '';
  settings.saveSetting('app-bg-image', '');
};

const handleColumnChange = (n) => {
  const oldColumns = settings.columns;
  settings.columns = n;
  settings.saveSetting('app-columns', n);
  if (n < oldColumns) taskStore.migrateOrphanTasks(n);
};
</script>

<template>
  <BaseModal 
    v-if="isOpen"
    :title="activeTabObj.label" 
    :subtitle="activeTabObj.desc"
    :icon="activeTabObj.icon"
    maxWidth="max-w-4xl" 
    customClass="h-[90vh] md:h-[600px]"
    layout="sidebar"
    @close="emit('close')"
  >

    <!-- Sidebar -->
    <template #sidebar>
      <nav ref="navRef" class="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar gap-1 md:space-y-1 pb-2 md:pb-0 scroll-smooth">
        <template v-for="tab in tabs" :key="tab.id">
          <div v-if="tab.isAction" class="hidden md:block w-full h-px border-t border-app-border-light my-2"></div>
          <button 
            :data-tab-id="tab.id"
            @click="tab.isAction ? emit('open-settings') : activeTab = tab.id"
            class="flex-shrink-0 flex items-center gap-3 px-4 md:px-3 py-2 md:py-2.5 rounded-xl transition-all group"
            :class="activeTab === tab.id 
              ? 'bg-app-surface text-indigo-600 dark:text-indigo-400' 
              : (tab.isAction ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10' : 'text-app-sub hover:bg-app-surface')"
          >
            <component :is="tab.icon" class="w-4 h-4" :class="activeTab === tab.id ? tab.color : (tab.isAction ? '' : 'text-slate-400')" />
            <span class="text-[11px] md:text-xs font-bold whitespace-nowrap">{{ tab.label }}</span>
          </button>
        </template>
      </nav>
    </template>

    <!-- Conteúdo Principal -->
    <div 
      ref="swipeAreaRef" 
      class="h-full w-full flex-1 overflow-x-hidden touch-pan-y max-md:min-h-[80vh]" 
      :style="{
        touchAction: 'pan-y',
        transform: `translateX(${offsetX}px)`,
        transition: (isSwiping || jumpMode) ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)'
      }"
    >
      <transition :name="disableVueTransition ? '' : 'fade-slide'" :mode="disableVueTransition ? '' : 'out-in'">

                <!-- ABA: Board -->
                <div v-if="activeTab === 'board'" :key="'board'" class="space-y-8 w-full">
                  <div class="space-y-8">
                    <div class="space-y-3">
                      <label class="text-[10px] font-black text-app-muted uppercase tracking-widest ml-1">Quantidade de Colunas</label>
                      <div class="flex bg-app-surface p-1 rounded-2xl border border-app-border-light w-full overflow-x-auto custom-scrollbar">
                        <button v-for="n in 6" :key="n" @click="handleColumnChange(n)"
                          class="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300"
                          :class="settings.columns === n ? 'bg-indigo-500 text-white shadow-lg' : 'text-app-muted'">
                          {{ n }}<span class="hidden md:inline"> Colunas</span><span class="inline md:hidden"> Col</span>
                        </button>
                      </div>
                    </div>
                    <div class="space-y-4 animate-fadeIn">
                      <label class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nomes e Estilos das Colunas</label>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div v-for="n in settings.columns" :key="n" class="space-y-2 p-3 bg-white dark:bg-white/5 border border-app-border-light rounded-2xl shadow-sm transition-all hover:border-indigo-500/30">
                          <div class="flex items-center gap-2">
                            <div class="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Coluna {{ n }}</span>
                          </div>
                          <AppInput v-model="settings.columnTitles[n-1]" type="text" placeholder="Ex: Backlog..." class="!px-3 !py-2 text-sm shadow-sm transition-all w-full bg-slate-50 dark:bg-slate-900 border-none" @update:modelValue="settings.saveSetting('app-column-titles', [...settings.columnTitles])" />
                          
                          <div class="relative">
                            <select v-model="settings.columnStyles[n-1]" @change="settings.saveSetting('app-column-styles', [...settings.columnStyles])" class="app-input px-3 py-2 text-xs w-full appearance-none cursor-pointer bg-slate-50 dark:bg-slate-900 border-none text-slate-600 dark:text-slate-300 font-medium">
                              <option value="">🎨 Estilo: Global Padrão</option>
                              <option v-for="profile in taskStyleStore.sortedStyles" :key="profile.id" :value="profile.id">✨ {{ profile.name }}</option>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-400/50">
                              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="space-y-6 pt-6 border-t border-app-border-light">
                      <div class="glass-section p-4 space-y-4">
                        <div class="flex justify-between items-center"><div class="flex items-center gap-3"><MousePointer2 class="w-4 h-4 text-indigo-500" /><p class="text-sm font-bold text-slate-700 dark:text-slate-200">Arredondamento de Cantos</p></div><span class="text-xs font-black text-indigo-500">{{ settings.cardBorderRadius }}px</span></div>
                        <input type="range" v-model="settings.cardBorderRadius" min="0" max="40" step="1" class="w-full app-range" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ABA: Construtor de Estilos -->
                <div v-else-if="activeTab === 'tasks'" :key="'tasks'" class="space-y-6 w-full pt-4">
                  <div class="glass-section p-8 space-y-6 max-w-md w-full mx-auto border-indigo-500/20 bg-indigo-500/5">
                    <div class="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                      <Palette class="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                      <h3 class="text-lg font-black text-app-main uppercase tracking-tight mb-2">Construtor Visual</h3>
                      <p class="text-xs text-app-sub leading-relaxed">
                        Acesse o estúdio dedicado (WYSIWYG) para visualizar suas alterações em tempo real sem afetar as configurações atuais.
                      </p>
                    </div>
                    <button 
                      type="button"
                      @click.prevent.stop="emit('open-style-builder')" 
                      class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Layers class="w-4 h-4" /> Abrir Construtor
                    </button>
                  </div>
                  
                  <div class="glass-section p-6 space-y-4 max-w-md w-full mx-auto border-amber-500/20 bg-amber-500/5 mt-4 text-left">
                    <div class="flex items-center gap-3 mb-2 relative z-10">
                      <Palette class="w-5 h-5 text-amber-500" />
                      <h4 class="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-tight">Importação de Paletas Legadas</h4>
                    </div>
                    <p class="text-[10px] text-amber-600/80 leading-relaxed mb-4 relative z-10">
                      Importe o arquivo JSON contendo as cores hexadecimais (usadas em tarefas mais antigas).
                    </p>
                    <div class="flex flex-col relative z-10 space-y-4">
                      <div class="flex flex-row gap-3">
                        <label class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white rounded-xl text-[10px] font-bold transition-all border border-amber-500/20 cursor-pointer text-center whitespace-nowrap">
                          <Upload class="w-4 h-4" /> Importar (.json)
                          <input type="file" accept=".json" class="hidden" @change="handleImportPalettes" />
                        </label>
                        <button @click="backupService.exportPalettes(settings)" class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600/10 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl text-[10px] font-bold transition-all border border-amber-600/20 cursor-pointer text-center whitespace-nowrap">
                          <Download class="w-4 h-4" /> Exportar Paletas
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ABA: Tipografia -->
                <div v-else-if="activeTab === 'typography'" :key="'typography'" class="space-y-6 w-full pt-2">
                  <div v-for="category in fontCategories" :key="category.name" class="glass-section p-5 space-y-3">
                    <h4 class="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest ml-1">{{ category.name }}</h4>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <button v-for="font in category.fonts" :key="font" @click="settings.fontFamily = font; settings.saveSetting('app-font-family', font)"
                        class="px-3 py-2.5 text-[11px] font-bold rounded-xl border transition-all truncate"
                        :class="settings.fontFamily === font ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-white dark:bg-slate-900 border-app-border-light text-slate-600 dark:text-slate-300 hover:border-indigo-500/30'"
                        :style="{ fontFamily: font }">{{ font }}</button>
                    </div>
                  </div>
                </div>

                <!-- ABA: Papéis de Parede -->
                <div v-else-if="activeTab === 'wallpapers'" :key="'wallpapers'" class="space-y-6">
                  <div class="glass-section p-6 space-y-6">
                    <div class="flex items-center justify-between"><div class="flex items-center gap-3"><ImageIcon class="w-5 h-5 text-emerald-500" /><h3 class="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">Papéis de Parede Premium</h3></div><span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{{ settings.customWallpapers.length }} / 17 Slots</span></div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <button v-if="settings.customWallpapers.length > 0" @click="clearWallpaper" class="aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all group" :class="!settings.backgroundImage ? 'border-indigo-500 bg-indigo-500/5 text-indigo-500' : 'border-app-border-light text-slate-400 hover:text-red-500'"><Eraser class="w-6 h-6" /><span class="text-[10px] font-bold uppercase tracking-tighter">Limpar</span></button>
                      <div v-for="(wp, index) in settings.customWallpapers" :key="index" v-tooltip="wp.name || 'Wallpaper'" @click="setWallpaper(wp.url)" class="relative group aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-200 dark:bg-white/10" :class="settings.backgroundImage === wp.url ? 'border-emerald-500 scale-95 shadow-lg' : 'border-transparent hover:border-slate-300'">
                        <img :src="wp.url" class="w-full h-full object-cover" alt="Preview" loading="lazy" />
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5" @click.stop="setWallpaper(wp.url)">
                          <button @click.stop="editWallpaper(index)" class="p-1.5 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg"><Pencil class="w-3.5 h-3.5" /></button>
                          <button @click.stop="removeWallpaper(index)" class="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg"><Trash2 class="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <button v-if="settings.customWallpapers.length < 17" @click="addCustomWallpaper" class="aspect-video rounded-xl border-2 border-dashed border-app-border-light hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-500"><Plus class="w-6 h-6" /><span class="text-[10px] font-bold uppercase tracking-tighter">Novo Link</span></button>
                    </div>
                  </div>
                </div>

                <!-- ABA: Efeitos e Vidro -->
                <div v-else-if="activeTab === 'effects'" :key="'effects'" class="space-y-6">
                  <div class="glass-section p-6 space-y-8">
                    <!-- Bloco 1: Intensidade -->
                    <div class="space-y-5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <Droplets class="w-5 h-5 text-indigo-500" />
                          <h3 class="text-sm font-bold text-app-main uppercase tracking-tight">Transparência Global</h3>
                        </div>
                        <span class="text-xs font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-lg">{{ settings.cardOpacity }}%</span>
                      </div>
                      
                      <div class="space-y-2">
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Nível de Opacidade</p>
                        <input type="range" v-model="settings.cardOpacity" min="0" max="100" step="5" class="w-full app-range" @change="settings.saveSetting('app-card-opacity', settings.cardOpacity)" />
                      </div>
                    </div>
                    
                    <!-- Bloco 2: Segmentação -->
                    <div class="pt-6 border-t border-app-border-light space-y-4">
                      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aplicar Efeito de Vidro em:</p>
                      
                      <div class="mb-4">
                        <label class="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 to-transparent dark:from-indigo-500/20 dark:to-transparent rounded-2xl cursor-pointer border border-indigo-500/30 group hover:border-indigo-500/60 transition-all shadow-sm">
                          <div class="flex items-center gap-3">
                            <div class="p-2 bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-droplets"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7 2.99 7 2.99s-2.29 6.08-2.29 6.08c-1.14.93-1.71 2.03-1.71 3.19C3 14.47 4.8 16.3 7 16.3Z"/><path d="M20.3 10.4c-1.14.93-1.71 2.03-1.71 3.19 0 2.22 1.8 4.05 4 4.05s4-1.83 4-4.05c0-1.16-.57-2.26-1.71-3.19S20.3 4.3 20.3 4.3s-2.29 6.08-2.29 6.08Z"/><path d="M12 22c2.76 0 5-2.24 5-5s-5-9-5-9-5 6.24-5 9 2.24 5 5 5Z"/></svg>
                            </div>
                            <div class="flex flex-col">
                              <span class="text-sm font-black text-slate-800 dark:text-slate-100">CHAVE MESTRA: EFEITO DE VIDRO</span>
                              <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Habilita ou desabilita o desfoque em todo o sistema</span>
                            </div>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.globalGlassEnabled" @change="settings.saveSetting('app-global-glass', settings.globalGlassEnabled)" class="sr-only peer" />
                            <div class="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-md"></div>
                          </div>
                        </label>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label class="flex items-center justify-between p-3.5 bg-transparent dark:bg-transparent rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 hover:bg-app-surface transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Cards de Tarefa</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Kanban Board</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.cards" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>

                        <label class="flex items-center justify-between p-3.5 bg-transparent dark:bg-transparent rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 hover:bg-app-surface transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Modais Principais</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Janelas flutuantes</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.modals" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>

                        <label class="flex items-center justify-between p-3.5 bg-transparent dark:bg-transparent rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 hover:bg-app-surface transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Cabeçalho e Rodapé</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Barras de Ação</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.modalHeaderFooter" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>

                        <label class="flex items-center justify-between p-3.5 bg-transparent dark:bg-transparent rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 hover:bg-app-surface transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Menu Lateral</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Navegação</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.modalSidebar" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>

                        <label class="flex items-center justify-between p-3.5 bg-transparent dark:bg-transparent rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 hover:bg-app-surface transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Corpo do Conteúdo</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Área Central</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.modalBody" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>

                        <label class="flex items-center justify-between p-3.5 bg-transparent dark:bg-transparent rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 hover:bg-app-surface transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Barra Inferior</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Ilha Dinâmica</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.bottomBar" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>

                        <label class="flex items-center justify-between p-3.5 bg-transparent dark:bg-transparent rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 hover:bg-app-surface transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Menu de Contexto</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Ações Rápidas</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.contextMenu" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>

                        <label class="flex items-center justify-between p-3.5 bg-transparent dark:bg-transparent rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 hover:bg-app-surface transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Painel de Notas</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Bloco Flutuante</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.notes" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ABA: Widgets -->
                <div v-else-if="activeTab === 'widgets'" :key="'widgets'" class="space-y-6">
                  <div class="glass-section p-6 space-y-6">
                    <div class="flex items-center gap-3 mb-4">
                      <Cloud class="w-5 h-5 text-sky-500" />
                      <h3 class="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">Widget de Clima</h3>
                    </div>
                    
                    <div class="space-y-4">
                      <label class="flex items-center justify-between p-4 bg-app-surface rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 transition-all">
                        <div class="flex flex-col">
                          <span class="text-sm font-bold text-slate-800 dark:text-slate-100">Exibir Widget de Clima</span>
                          <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Mostra a temperatura atual próxima à doca</span>
                        </div>
                        <div class="relative inline-flex items-center">
                          <input type="checkbox" v-model="settings.weatherWidgetEnabled" @change="settings.saveSetting('app-weather-enabled', settings.weatherWidgetEnabled)" class="sr-only peer" />
                          <div class="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-sky-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-md"></div>
                        </div>
                      </label>

                      <div class="space-y-2 p-4 bg-app-surface rounded-2xl border border-app-border-light transition-all" :class="{'opacity-50 pointer-events-none': !settings.weatherWidgetEnabled}">
                        <label class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Forçar Cidade (Opcional)</label>
                        <p class="text-[10px] text-slate-500 mb-2 ml-1 leading-relaxed">
                          Se o seu GPS estiver bloqueado ou quiser ver o clima de outra região, digite o nome da cidade abaixo (ex: "Rio de Janeiro", "London"). Deixe em branco para tentar usar o GPS.
                        </p>
                        <AppInput 
                          v-model="settings.weatherCity" 
                          type="text" 
                          placeholder="Ex: São Paulo" 
                          class="!px-3 !py-2 text-sm shadow-sm transition-all w-full bg-slate-50 dark:bg-slate-900 border-none" 
                          @change="() => { settings.saveSetting('app-weather-city', settings.weatherCity); weatherStore.refreshWeather(); }" 
                        />
                      </div>
                    </div>
                  </div>

                  <div class="glass-section p-6 space-y-6 mt-6">
                    <div class="flex items-center gap-3 mb-4">
                      <Clock class="w-5 h-5 text-indigo-500" />
                      <h3 class="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">Relógio Imersivo</h3>
                    </div>
                    
                    <div class="space-y-4">
                      <label class="flex items-center justify-between p-4 bg-app-surface rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 transition-all">
                        <div class="flex flex-col">
                          <span class="text-sm font-bold text-slate-800 dark:text-slate-100">Exibir Relógio Gigante</span>
                          <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Um relógio minimalista que ocupa o fundo do workspace</span>
                        </div>
                        <div class="relative inline-flex items-center">
                          <input type="checkbox" v-model="settings.immersiveClockEnabled" @change="settings.saveSetting('app-immersive-clock', settings.immersiveClockEnabled)" class="sr-only peer" />
                          <div class="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-md"></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
      </transition>
    </div>

    <!-- Footer -->
    <template #footer>
      <button type="button" @click="emit('close')" class="btn btn-primary px-10 py-2.5 text-xs font-black uppercase tracking-widest">Fechar Ajustes</button>
    </template>
  </BaseModal>
</template>

<style scoped>
</style>
