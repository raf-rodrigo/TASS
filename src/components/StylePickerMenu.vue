<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { Palette, X, Check } from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { useTaskStyleStore } from '../stores/taskStyleStore';
import { useUIStore } from '../stores/uiStore';
import { notificationService } from '../services/notificationService';

const settings = useSettingsStore();
const taskStore = useTaskStore();
const taskStyleStore = useTaskStyleStore();
const uiStore = useUIStore();

const menuRef = ref(null);
const menuStyle = ref({ top: 'auto', left: 'auto' });

const adjustPosition = () => {
  if (!menuRef.value || !uiStore.showStylePickerMenu) return;
  
  let x = uiStore.stylePickerPosition.x;
  let y = uiStore.stylePickerPosition.y;
  
  const menuWidth = menuRef.value.offsetWidth;
  const menuHeight = menuRef.value.offsetHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  if (x + menuWidth > windowWidth - 20) x = windowWidth - menuWidth - 20;
  if (y + menuHeight > windowHeight - 20) y = windowHeight - menuHeight - 20;
  
  menuStyle.value = { top: `${y}px`, left: `${x}px` };
};

onMounted(() => {
  adjustPosition();
  window.addEventListener('click', handleOutsideClick);
});

watch(() => uiStore.showStylePickerMenu, async (newVal) => {
  if (newVal) {
    await nextTick();
    adjustPosition();
  }
});

watch(() => uiStore.stylePickerPosition, async () => {
  if (uiStore.showStylePickerMenu) {
    await nextTick();
    adjustPosition();
  }
}, { deep: true });

onUnmounted(() => {
  window.removeEventListener('click', handleOutsideClick);
});

const handleOutsideClick = (e) => {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    uiStore.closeStylePicker();
  }
};

const lastUsedStyleId = ref(localStorage.getItem('tass_last_used_style_id') || null);

const sortedPresets = computed(() => {
  const styles = [...taskStyleStore.sortedStyles];
  if (!lastUsedStyleId.value || lastUsedStyleId.value === '') return styles;
  
  const lastIndex = styles.findIndex(s => s.id === lastUsedStyleId.value);
  if (lastIndex > -1) {
    const [last] = styles.splice(lastIndex, 1);
    styles.unshift(last);
  }
  return styles;
});

const gridLayoutClass = computed(() => {
  const len = sortedPresets.value.length;
  if (len > 24) return 'grid grid-cols-3 gap-x-2 gap-y-0.5 w-[580px]';
  if (len > 12) return 'grid grid-cols-2 gap-x-2 gap-y-0.5 w-[380px]';
  return 'flex flex-col gap-0.5 min-w-[240px] max-w-[280px]';
});

const handlePreview = (styleId) => {
  uiStore.previewStyleId = styleId;
};

const handleClearPreview = () => {
  // Retorna para o estilo atual da tarefa (se o mouse sair da lista)
  const task = taskStore.tasks.find(t => t.id === uiStore.previewTaskId);
  uiStore.previewStyleId = task ? (task.styleId || '') : '';
};

const applyStyle = async (styleId) => {
  const taskId = uiStore.previewTaskId;
  try {
    if (taskId) {
      uiStore.triggerPresetAnimation(taskId);
    }
    await taskStore.updateTask(taskId, { styleId: styleId || null });
    localStorage.setItem('tass_last_used_style_id', styleId);
    lastUsedStyleId.value = styleId;
  } catch (error) {
    console.error("Erro ao aplicar estilo:", error);
    notificationService.toast('Erro ao salvar estilo', 'error');
  } finally {
    uiStore.closeStylePicker();
  }
};

const isCurrentStyle = (styleId) => {
  const task = taskStore.tasks.find(t => t.id === uiStore.previewTaskId);
  if (!task) return false;
  if (styleId === '') return !task.styleId;
  return task.styleId === styleId;
};
</script>

<template>
  <div 
    v-if="uiStore.showStylePickerMenu"
    ref="menuRef"
    class="fixed z-[1000] pointer-events-none transition-all duration-300 animate-scaleIn"
    :style="menuStyle"
  >
    <div 
      class="glass-panel !py-2 !px-1.5 flex flex-col shadow-2xl ring-1 ring-black/10 pointer-events-auto border-indigo-500/30"
      :class="gridLayoutClass"
      @click.stop
      :style="{ 
        backgroundColor: `rgba(var(--app-bg-raw), var(--app-menu-opacity))`,
        borderRadius: 'var(--app-card-radius)'
      }"
    >
      <div class="px-3 py-2 flex items-center justify-between mb-1" :class="sortedPresets.length > 12 ? 'col-span-full' : ''">
        <div class="flex items-center gap-2">
          <Palette class="w-4 h-4 text-indigo-500" />
          <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Presets (Live Preview)</span>
        </div>
        <button @click="uiStore.closeStylePicker" class="p-1 hover:bg-slate-500/10 rounded-md transition-colors">
          <X class="w-3 h-3 text-slate-400" />
        </button>
      </div>

      <div 
        :class="[sortedPresets.length > 12 ? 'grid gap-x-2 gap-y-0.5' : 'flex flex-col gap-0.5', sortedPresets.length > 24 ? 'grid-cols-3' : sortedPresets.length > 12 ? 'grid-cols-2' : '']"
        @mouseleave="handleClearPreview"
      >
        <button 
          @mouseenter="handlePreview('')"
          @click="applyStyle('')"
          class="preset-item flex justify-between items-center"
          :class="isCurrentStyle('') ? 'bg-indigo-500/10 text-indigo-500 font-bold' : ''"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-3 h-3 rounded-full border border-black/10 dark:border-white/10 flex-shrink-0" style="background-color: #e2e8f0;"></div>
            <span class="truncate">Padrão Global</span>
          </div>
          <Check v-if="isCurrentStyle('')" class="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 ml-auto" />
        </button>

        <hr v-if="sortedPresets.length <= 12" class="border-t border-app-border-light my-1.5 mx-2" />

        <button 
          v-for="preset in sortedPresets" 
          :key="preset.id"
          @mouseenter="handlePreview(preset.id)"
          @click="applyStyle(preset.id)"
          class="preset-item flex justify-between items-center"
          :class="isCurrentStyle(preset.id) ? 'bg-indigo-500/10 text-indigo-500 font-bold' : ''"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-3 h-3 rounded-full border border-black/10 dark:border-white/10 flex-shrink-0" :style="{ backgroundColor: preset.colors?.bgColor || '#e2e8f0' }"></div>
            <span class="truncate">{{ preset.name }}</span>
          </div>
          <Check v-if="isCurrentStyle(preset.id)" class="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 ml-auto" />
        </button>

        <div v-if="taskStyleStore.sortedStyles.length === 0" class="py-3 px-2 text-center" :class="sortedPresets.length > 12 ? 'col-span-full' : ''">
          <p class="text-[10px] text-slate-400 italic">Nenhum preset criado.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preset-item {
  @apply w-full px-3 py-2 flex items-center gap-3 text-[12px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors rounded-[8px] active:scale-[0.98] cursor-pointer overflow-hidden;
}

.preset-item span {
  @apply truncate;
}

.animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>
