<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { 
  X, Palette, Trash2, Plus, Settings,
  Image as ImageIcon, Eraser, MousePointer2,
  LayoutGrid, Layers, Type as TypeIcon, Droplets,
  Cloud, Loader2, ArrowLeft, RotateCcw
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { googleDriveService } from '../services/googleDriveService';
import { notificationService } from '../services/notificationService';
import BaseModal from './BaseModal.vue';

const settings = useSettingsStore();
const taskStore = useTaskStore();

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'test-wellness', 'open-settings']);

const activeTab = ref('wallpapers');
const showDrivePicker = ref(false);
const driveImages = ref([]);
const isDriveLoading = ref(false);
const isPromptingAuth = ref(false); // Flag para evitar modais duplicados
const driveThumbnails = ref({}); // Mapeamento de fileId -> ObjectURL

/**
 * Função central de busca de imagens na pasta TASS do Drive
 */
const fetchDriveImages = async () => {
  if (!googleDriveService.isAuthenticated()) return;
  
  isDriveLoading.value = true;
  driveImages.value = []; // Limpa para mostrar os spinners
  
  try {
    const images = await googleDriveService.listImageFiles();
    driveImages.value = images;
    
    // Inicia o carregamento das miniaturas
    await loadDriveThumbnails(images);
  } catch (error) {
    notificationService.toast('Erro ao sincronizar imagens do Drive', 'error');
  } finally {
    isDriveLoading.value = false;
  }
};

const openDrivePicker = async () => {
  if (!googleDriveService.isAuthenticated()) {
    if (isPromptingAuth.value) return; // Se já estiver perguntando, ignora
    
    isPromptingAuth.value = true;
    const confirmed = await notificationService.confirm(
      'Google Drive Desconectado',
      'Você precisa conectar sua conta do Google Drive para acessar suas imagens. Deseja fazer isso agora?',
      'Conectar Agora',
      'info'
    );
    isPromptingAuth.value = false;

    if (confirmed) {
      await googleDriveService.login();
      // O recarregamento automático ocorrerá via callback no onMounted
    }
    return;
  }

  showDrivePicker.value = true;
  fetchDriveImages();
};

const loadDriveThumbnails = async (images) => {
  const token = localStorage.getItem('tass_google_access_token');
  if (!token) return;

  for (const file of images) {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        driveThumbnails.value[file.id] = url;
      }
    } catch (e) {
      console.warn('[TASS] Falha ao carregar thumbnail:', file.name, e);
    }
  }
};

// Limpa URLs criadas ao fechar
watch(showDrivePicker, (val) => {
  if (!val) {
    Object.values(driveThumbnails.value).forEach(url => URL.revokeObjectURL(url));
    driveThumbnails.value = {};
  }
});

const selectDriveImage = async (file) => {
  isDriveLoading.value = true;
  try {
    const result = await googleDriveService.importWallpaper(file.id, file.name);
    if (result.success) {
      if (settings.customWallpapers.length < 17) {
        settings.customWallpapers.push({
          name: result.name,
          url: result.url,
          hash: result.hash,
          isLocal: true
        });
        await settings.saveSetting('app-custom-wallpapers', settings.customWallpapers);
      }
      setWallpaper(result.url);
      notificationService.toast('Wallpaper importado do Drive!', 'success');
      showDrivePicker.value = false;
    }
  } catch (error) {
    notificationService.alert('Erro na Importação', error.message || 'Falha ao baixar do Drive.', 'error');
  } finally {
    isDriveLoading.value = false;
  }
};

onMounted(() => {
  // Configura o serviço do Google para atualizar a lista automaticamente após o login
  googleDriveService.init((status) => {
    if (status && showDrivePicker.value) {
      fetchDriveImages();
    }
  });

  if (settings.keepWindowState) {
    const saved = localStorage.getItem('app-last-interface-tab');
    if (saved) activeTab.value = saved;
  }
});

watch(activeTab, (newVal) => {
  if (settings.keepWindowState) {
    localStorage.setItem('app-last-interface-tab', newVal);
  }
  showDrivePicker.value = false;
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

const showAddWallpaper = ref(false);
const newWallpaperUrl = ref('');

const tabs = [
  { id: 'wallpapers', label: 'Papéis de Parede', icon: ImageIcon, color: 'text-indigo-500', desc: 'Troque o clima do seu workspace instantaneamente.' },
  { id: 'board', label: 'Board & Layout', icon: LayoutGrid, color: 'text-indigo-500', desc: 'Configure a estrutura principal do seu quadro de tarefas.' },
  { id: 'tasks', label: 'Estilo das Tarefas', icon: Layers, color: 'text-indigo-500', desc: 'Personalize a aparência visual dos seus cards.' },
  { id: 'typography', label: 'Tipografia', icon: TypeIcon, color: 'text-indigo-500', desc: 'Escolha a fonte que melhor se adapta ao seu estilo.' },
  { id: 'effects', label: 'Efeitos e Vidro', icon: Droplets, color: 'text-indigo-500', desc: 'Ajuste o desfoque e as transparências do sistema.' },
];

const activeTabObj = computed(() => tabs.find(t => t.id === activeTab.value) || tabs[0]);

const fontOptions = [
  'Inter', 'Outfit', 'Lexend', 
  'Montserrat', 'Roboto', 'Ubuntu', 
  'Poppins', 'Open Sans', 'Sora',
  'Mulish', 'Quicksand', 'JetBrains Mono'
];

const setWallpaper = (url) => {
  settings.backgroundImage = url;
  settings.saveSetting('app-bg-image', url);
};

const addCustomWallpaper = () => {
  if (!newWallpaperUrl.value.trim()) return;
  if (settings.customWallpapers.length >= 17) return;
  
  settings.customWallpapers.push({
    name: `Custom ${settings.customWallpapers.length + 1}`,
    url: newWallpaperUrl.value.trim()
  });
  settings.saveSetting('app-custom-wallpapers', settings.customWallpapers);
  newWallpaperUrl.value = '';
  showAddWallpaper.value = false;
};

const removeWallpaper = async (index) => {
  try {
    const wp = settings.customWallpapers[index];
    if (wp.isLocal || wp.url.includes('/wallpapers/')) {
      const fileName = wp.url.split('/').pop();
      try {
        await fetch(`http://127.0.0.1:5176/api/wallpapers/${fileName}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('[TASS] Falha ao excluir arquivo físico:', fileName);
      }
    }
    settings.customWallpapers.splice(index, 1);
    await settings.saveSetting('app-custom-wallpapers', [...settings.customWallpapers]);
    notificationService.toast('Papel de parede removido!');
  } catch (error) {
    console.error("Erro ao remover wallpaper:", error);
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
    title="Interface" 
    maxWidth="max-w-4xl" 
    customClass="h-[90vh] md:h-[600px] !p-0"
    layout="custom"
    okText="Fechar"
    @close="emit('close')"
    @ok="emit('close')"
  >
    <template #default="{ onMouseDown }">
      <div class="flex flex-col h-full w-full bg-transparent overflow-hidden">
        <!-- HEADER GLOBAL (Unificado Sidebar + Corpo) -->
        <header 
          class="flex items-center justify-between px-6 md:px-10 py-4 border-b border-app-border-light shrink-0 cursor-grab active:cursor-grabbing select-none"
          :class="settings.opacityTargets.modals ? 'bg-transparent' : 'bg-white dark:bg-slate-950'"
          @mousedown="onMouseDown"
        >
          <div class="flex items-center gap-4">
            <div class="p-2 rounded-xl text-white shadow-lg bg-indigo-500 shadow-indigo-500/20">
              <template v-if="showDrivePicker">
                <Cloud class="w-4 h-4" />
              </template>
              <component v-else :is="activeTabObj.icon" class="w-4 h-4" />
            </div>
            <div>
              <template v-if="showDrivePicker">
                <h2 class="text-sm font-black text-app-main uppercase tracking-tighter leading-none">Google Drive</h2>
                <p class="text-[9px] text-app-muted font-bold uppercase tracking-widest mt-1">Selecione uma imagem para importar.</p>
              </template>
              <template v-else>
                <h2 class="text-sm font-black text-app-main uppercase tracking-tighter leading-none">{{ activeTabObj.label }}</h2>
                <p class="text-[9px] text-app-muted font-bold uppercase tracking-widest mt-1">{{ activeTabObj.desc }}</p>
              </template>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <button v-if="showDrivePicker" @click="showDrivePicker = false" class="btn btn-secondary px-3 py-1.5 text-[10px] uppercase font-black">Voltar</button>
            <button type="button" @click="emit('close')" class="icon-btn -mr-2">
              <X class="w-5 h-5" />
            </button>
          </div>
        </header>

        <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
          <!-- Sidebar -->
          <aside 
            class="w-full md:w-64 border-b md:border-b-0 md:border-r border-app-border-light flex flex-col p-4 shrink-0"
            :class="settings.opacityTargets.modals ? 'bg-transparent' : 'bg-white dark:bg-slate-950'"
          >
            <nav class="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar gap-1 md:space-y-1 pb-2 md:pb-0">
              <button 
                v-for="tab in tabs" :key="tab.id"
                @click="activeTab = tab.id"
                class="flex-shrink-0 flex items-center gap-3 px-4 md:px-3 py-2 md:py-2.5 rounded-xl transition-all group"
                :class="activeTab === tab.id ? 'bg-app-surface text-indigo-600 dark:text-indigo-400' : 'text-app-sub hover:bg-app-surface'"
              >
                <component :is="tab.icon" class="w-4 h-4" :class="activeTab === tab.id ? tab.color : 'text-slate-400'" />
                <span class="text-[11px] md:text-xs font-bold whitespace-nowrap">{{ tab.label }}</span>
              </button>
              <div class="hidden md:block w-full h-px border-t border-app-border-light my-2"></div>
              <button 
                @click="emit('open-settings')"
                class="flex-shrink-0 flex items-center gap-3 px-4 md:px-3 py-2 md:py-2.5 rounded-xl transition-all text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
              >
                <Settings class="w-4 h-4" />
                <span class="text-[11px] md:text-xs font-bold whitespace-nowrap">Configurações</span>
              </button>
            </nav>
          </aside>

          <!-- Conteúdo Principal -->
          <main 
            class="flex-1 flex flex-col overflow-hidden relative"
            :class="settings.opacityTargets.modals ? 'bg-transparent' : 'bg-white dark:bg-slate-950'"
          >
            <div class="flex-1 overflow-y-auto px-6 md:px-10 py-6 custom-scrollbar pb-10">
              <transition name="fade-slide" mode="out-in">
                <div v-if="showDrivePicker" :key="'drive-picker'" class="space-y-6">
                  <!-- Loader Central -->
                  <div v-if="isDriveLoading && driveImages.length === 0" class="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 class="w-10 h-10 text-indigo-500 animate-spin" />
                    <p class="text-[10px] font-black text-app-muted uppercase tracking-widest text-center px-4">Sincronizando com o Google Drive...</p>
                  </div>
                  
                  <div v-else-if="!isDriveLoading && driveImages.length === 0" class="py-12 text-center border-2 border-dashed border-app-border-light rounded-2xl px-6">
                    <Cloud class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p class="text-[11px] font-bold text-app-muted uppercase tracking-widest">Nenhuma imagem encontrada.</p>
                    <p class="text-[9px] text-slate-400 mt-1 italic mb-6">Verifique a pasta <span class="text-indigo-500 font-bold uppercase">TASS</span> no seu Google Drive.</p>
                    <button @click="fetchDriveImages" class="mx-auto flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 dark:text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                      <RotateCcw class="w-3.5 h-3.5" /> Tentar Novamente
                    </button>
                  </div>

                  <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div v-for="file in driveImages" :key="file.id" @click="selectDriveImage(file)"
                      class="relative group aspect-video rounded-xl overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all cursor-pointer bg-slate-200 dark:bg-white/10"
                    >
                      <div v-if="!driveThumbnails[file.id]" class="w-full h-full flex items-center justify-center">
                        <Loader2 class="w-5 h-5 text-indigo-500/30 animate-spin" />
                      </div>
                      <template v-else>
                        <img :src="driveThumbnails[file.id]" class="w-full h-full object-cover animate-fadeIn" :alt="file.name" />
                        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                          <p class="text-[8px] text-white font-bold truncate w-full mb-1">{{ file.name }}</p>
                          <Plus class="w-4 h-4 text-white" />
                        </div>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- ABA: Board -->
                <div v-else-if="activeTab === 'board'" :key="'board'" class="space-y-8">
                  <div class="space-y-8">
                    <div class="space-y-3">
                      <label class="text-[10px] font-black text-app-muted uppercase tracking-widest ml-1">Quantidade de Colunas</label>
                      <div class="flex bg-app-surface p-1 rounded-2xl border border-app-border-light w-full">
                        <button v-for="n in 4" :key="n" @click="handleColumnChange(n)"
                          class="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300"
                          :class="settings.columns === n ? 'bg-indigo-500 text-white shadow-lg' : 'text-app-muted'">{{ n }} Colunas</button>
                      </div>
                    </div>
                    <div class="space-y-4 animate-fadeIn">
                      <label class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nomes das Colunas (Opcional)</label>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div v-for="n in settings.columns" :key="n" class="space-y-1.5">
                          <div class="flex items-center gap-2 mb-1"><div class="w-1.5 h-1.5 rounded-full bg-indigo-500"></div><span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Coluna {{ n }}</span></div>
                          <input v-model="settings.columnTitles[n-1]" type="text" placeholder="Ex: Backlog..." class="focus:ring-indigo-500" @input="settings.saveSetting('app-column-titles', [...settings.columnTitles])" />
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

                <!-- ABA: Estilo das Tarefas -->
                <div v-else-if="activeTab === 'tasks'" :key="'tasks'" class="space-y-8">
                  <div class="glass-section p-6 space-y-5">
                      <div class="flex justify-between items-center"><span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Espessura (Padding)</span><span class="text-xs font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-lg">{{ settings.cardPadding }}px</span></div>
                      <input type="range" v-model="settings.cardPadding" min="8" max="40" step="2" class="w-full app-range" @change="settings.cardPadding = parseInt($event.target.value); settings.saveSetting('app-card-padding', settings.cardPadding)" />
                  </div>
                </div>

                <!-- ABA: Tipografia -->
                <div v-else-if="activeTab === 'typography'" :key="'typography'" class="space-y-8">
                  <div class="glass-section p-6 space-y-4">
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <button v-for="font in fontOptions" :key="font" @click="settings.fontFamily = font; settings.saveSetting('app-font-family', font)"
                        class="px-2 py-2.5 text-[10px] font-medium rounded-xl border transition-all truncate"
                        :class="settings.fontFamily === font ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-white dark:bg-slate-900 border-app-border-light'"
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
                      <div v-for="(wp, index) in settings.customWallpapers" :key="index" v-tooltip="wp.name || 'Wallpaper'" @click="setWallpaper(wp.url)" class="relative group aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-200 dark:bg-white/10" :class="settings.backgroundImage === wp.url ? 'border-emerald-500 scale-95 shadow-lg' : 'border-transparent hover:border-slate-300'"><img :src="wp.url" class="w-full h-full object-cover" alt="Preview" loading="lazy" /><div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"><button @click.stop="removeWallpaper(index)" class="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg"><Trash2 class="w-4 h-4" /></button></div></div>
                      <button v-if="settings.customWallpapers.length < 17" @click="showAddWallpaper = !showAddWallpaper" class="aspect-video rounded-xl border-2 border-dashed border-app-border-light hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-500"><Plus class="w-6 h-6" /><span class="text-[10px] font-bold uppercase tracking-tighter">Novo Link</span></button>
                      <button v-if="settings.customWallpapers.length < 17" @click="openDrivePicker" class="aspect-video rounded-xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-500 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-500"><Cloud class="w-6 h-6" /><span class="text-[10px] font-bold uppercase tracking-tighter">Google Drive</span></button>
                    </div>
                    <div v-if="showAddWallpaper" class="animate-fadeIn p-4 bg-app-solid rounded-2xl border border-emerald-500/30 space-y-4">
                      <div class="flex gap-2"><input v-model="newWallpaperUrl" type="text" placeholder="https://..." class="flex-1 bg-slate-100 dark:bg-white/5 border border-app-border-light rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /><button @click="addCustomWallpaper" class="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg">Salvar</button></div>
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
                      
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label class="flex items-center justify-between p-3.5 bg-white dark:bg-white/5 rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Cards de Tarefa</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Kanban Board</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.cards" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>

                        <label class="flex items-center justify-between p-3.5 bg-white dark:bg-white/5 rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Janelas e Modais</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Menus de Ajuste</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.modals" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>

                        <label class="flex items-center justify-between p-3.5 bg-white dark:bg-white/5 rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Barra Inferior</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Ilha Dinâmica</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.bottomBar" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>

                        <label class="flex items-center justify-between p-3.5 bg-white dark:bg-white/5 rounded-2xl cursor-pointer border border-app-border-light group hover:border-indigo-500/30 transition-all">
                          <div class="flex flex-col">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Menu de Contexto</span>
                            <span class="text-[8px] text-slate-500 uppercase font-medium">Ações Rápidas</span>
                          </div>
                          <div class="relative inline-flex items-center">
                            <input type="checkbox" v-model="settings.opacityTargets.contextMenu" @change="settings.saveSetting('app-opacity-targets', { ...settings.opacityTargets })" class="sr-only peer" />
                            <div class="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all shadow-sm"></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </main>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
</style>
