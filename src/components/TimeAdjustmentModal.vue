<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { useTimerStore } from '../stores/timerStore';
import { useUIStore } from '../stores/uiStore';
import { getHMFromMs, hmsToMs } from '../utils/time';
import { ptBR } from 'date-fns/locale';
import { Clock, Check } from 'lucide-vue-next';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const settings = useSettingsStore();
const taskStore = useTaskStore();
const timerStore = useTimerStore();
const uiStore = useUIStore();

const timeValue = ref(getHMFromMs(props.task.totalTimeSpent));
const modalRef = ref(null);

const getInitialStyle = () => {
  if (taskStore.contextMenuPosition) {
    return { 
      top: `${taskStore.contextMenuPosition.y}px`, 
      left: `${taskStore.contextMenuPosition.x}px`, 
      transform: 'none' 
    };
  }
  return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
};

const menuStyle = ref(getInitialStyle());

const adjustPosition = () => {
  if (!modalRef.value || !taskStore.contextMenuPosition) return;
  
  let x = taskStore.contextMenuPosition.x;
  let y = taskStore.contextMenuPosition.y;
  
  // Como o componente recém montou, damos um pequeno delay para ele pegar o offsetWidth real
  setTimeout(() => {
    if (!modalRef.value) return;
    const menuWidth = modalRef.value.offsetWidth || 280;
    const menuHeight = modalRef.value.offsetHeight || 350;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Centraliza levemente em relação ao clique
    x = x - (menuWidth / 2);
    y = y + 10;
    
    // Mantém dentro da tela
    if (x < 10) x = 10;
    if (x + menuWidth > windowWidth - 10) x = windowWidth - menuWidth - 10;
    if (y + menuHeight > windowHeight - 10) y = windowHeight - menuHeight - 10;
    
    menuStyle.value = { top: `${y}px`, left: `${x}px`, transform: 'none' };
  }, 10);
};

onMounted(() => {
  if (taskStore.contextMenuPosition) {
    adjustPosition();
  }
  
  // Close when clicking outside
  setTimeout(() => {
    window.addEventListener('click', handleClickOutside);
  }, 100);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (e) => {
  // Only close if clicking outside the modal wrapper (ignores clicks inside datepicker)
  if (modalRef.value && !modalRef.value.contains(e.target)) {
    uiStore.closeTimeAdjustment();
  }
};

const handleSave = async () => {
  if (!timeValue.value) return;
  const newMs = hmsToMs(timeValue.value.hours, timeValue.value.minutes);
  await timerStore.adjustTaskTime(props.task.id, newMs);
  uiStore.closeTimeAdjustment();
};

const isDark = computed(() => settings.theme === 'dark');

// Usa as configurações globais de transparência de modais
const getBackgroundStyle = computed(() => {
  if (settings.opacityTargets.modals) {
    return {
      backgroundColor: `rgba(var(--app-bg-raw), var(--app-card-opacity))`,
      backdropFilter: `blur(var(--app-glass-blur)) brightness(var(--app-glass-brightness)) saturate(var(--app-glass-saturate))`
    };
  }
  return {
    backgroundColor: `rgba(var(--app-bg-raw), 1)`
  };
});
</script>

<template>
  <div 
    class="fixed inset-0 z-[1000] pointer-events-none" 
  >
    <div 
      ref="modalRef"
      class="absolute w-[280px] pointer-events-auto shadow-2xl border flex flex-col items-center overflow-hidden animate-scaleIn ring-1 ring-black/10"
      :style="[menuStyle, getBackgroundStyle, { 
        borderColor: 'rgba(99, 102, 241, 0.2)',
        borderRadius: 'var(--app-card-radius)'
      }]"
      @click.stop
    >
      <header class="w-full flex items-center justify-between px-4 py-3 border-b border-app-border-light relative z-10" :style="{ backgroundColor: settings.opacityTargets.modals ? 'rgba(var(--app-bg-raw), 0.1)' : 'rgba(var(--app-bg-raw), 0.5)' }">
        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4 text-indigo-500" />
          <span class="text-[10px] font-black text-app-main uppercase tracking-widest">Ajustar Tempo</span>
        </div>
        <button @click="handleSave" class="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-all active:scale-90">
          <Check class="w-4 h-4" />
        </button>
      </header>

      <div class="p-2 w-full flex justify-center bg-transparent relative z-10">
        <VueDatePicker
          v-model="timeValue"
          time-picker
          inline
          auto-apply
          :dark="isDark"
          :locale="ptBR"
          format="HH:mm"
          class="app-datepicker-direct"
        />
      </div>
    </div>
  </div>
</template>

<style>
/* CSS do componente VueDatePicker embutido */
.app-datepicker-direct,
.app-datepicker-direct.dp__theme_dark,
.app-datepicker-direct.dp__theme_light {
  --dp-font-family: inherit;
  --dp-border-radius: 16px;
  --dp-primary-color: var(--app-indigo-500, #6366f1);
  --dp-background-color: transparent !important;
  width: 100%;
}

.app-datepicker-direct .dp__menu,
.app-datepicker-direct .dp__main,
.app-datepicker-direct .dp__time_picker_inner,
.app-datepicker-direct .dp__overlay_container,
.app-datepicker-direct .dp__overlay {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 auto !important;
}

.app-datepicker-direct .dp__time_display {
  color: var(--dp-primary-color) !important;
  font-weight: 700 !important;
}

.app-datepicker-direct .dp__action_row {
  display: none !important;
}
</style>
