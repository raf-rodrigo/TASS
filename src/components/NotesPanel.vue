<script setup>
import { ref, onMounted, watch, toRef } from 'vue';
import { X, StickyNote } from 'lucide-vue-next';
import { useNoteStore } from '../stores/noteStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useNotesDrag } from '../composables/useNotesDrag.js';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'toggle']);
const noteStore = useNoteStore();
const settings = useSettingsStore();
const localContent = ref('');

// Lógica de arraste e redimensionamento unificada (Aba Mestra)
const { onMouseDown: handleResize, isDragging: isResizingLocal, hasMoved: notesMoved } = useNotesDrag(settings, toRef(props, 'isOpen'));

onMounted(async () => {
  await noteStore.loadNote();
  localContent.value = noteStore.note;
});

watch(() => noteStore.note, (newVal) => {
  if (newVal !== localContent.value) {
    localContent.value = newVal;
  }
});

const handleBlur = () => {
  noteStore.saveNote(localContent.value);
};

const close = () => {
  noteStore.saveNote(localContent.value);
  emit('close');
};

const handleHandleClick = () => {
  if (!notesMoved.value) {
    emit('toggle');
  }
};
</script>

<template>
  <!-- Overlay (Fundo) -->
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-[60] bg-slate-900/10 backdrop-blur-[1px]"
      @click="close"
    ></div>
  </transition>

  <!-- Painel de Notas -->
  <aside 
    class="fixed top-0 h-full max-w-[90vw] z-[70] shadow-2xl flex flex-col"
    :class="[
      isResizingLocal ? '' : 'transition-all duration-500 ease-in-out',
      settings.notesSide === 'right' ? 'right-0' : 'left-0',
      isOpen ? 'translate-x-0' : (settings.notesSide === 'right' ? 'translate-x-full' : '-translate-x-full')
    ]"
    :style="{ backgroundColor: settings.noteColor, width: settings.notesWidth + 'px' }" 
  >
    <!-- Aba de Arraste Física (Mestre - Versão Discreta) -->
    <div 
      class="absolute w-7 h-20 cursor-move flex items-center justify-center group z-[100] shadow-lg transition-all"
      :class="[
        settings.notesSide === 'right' ? 'right-full rounded-l-xl' : 'left-full rounded-r-xl',
        isResizingLocal ? '!transition-none' : ''
      ]"
      :style="{ 
        backgroundColor: settings.noteColor, 
        filter: 'brightness(0.97)',
        top: settings.notesButtonTop + 'px'
      }"
      @mousedown.stop="handleResize"
      @click.stop="handleHandleClick"
      :title="isOpen ? 'Arraste para redimensionar / Clique para fechar' : 'Arraste para mover / Clique para abrir'"
    >
      <!-- Grip Visual (Mínimo) -->
      <div class="flex flex-col gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
        <div class="w-1 h-1 rounded-full bg-black"></div>
        <div class="w-1 h-1 rounded-full bg-black"></div>
      </div>
    </div>

    <!-- Header -->
    <div 
      class="pb-4 px-4 pt-8 flex flex-col gap-3 border-b border-black/10"
      :class="settings.notesSide === 'right' ? 'pr-12' : 'pl-12'"
    >
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2 text-slate-900">
          <StickyNote class="w-5 h-5" />
          <h2 class="text-sm font-bold uppercase tracking-widest">Quick Notes</h2>
        </div>
        <button @click="close" class="p-1 hover:bg-black/10 rounded-full transition-colors text-slate-900">
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Área de Texto -->
    <div class="flex-1 p-6 relative">
      <div class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]"></div>
      
      <textarea
        v-model="localContent"
        @blur="handleBlur"
        placeholder="Escreva seus rascunhos aqui..."
        class="w-full h-full bg-transparent border-none focus:ring-0 text-black/80 placeholder-black/30 font-medium leading-relaxed resize-none custom-scrollbar-note text-lg outline-none"
      ></textarea>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar-note::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar-note::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar-note::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
}
.custom-scrollbar-note::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.2);
}

aside {
  box-shadow: 0 0 30px rgba(0,0,0,0.1);
  will-change: width, transform;
}

/* Efeito de papel dobrado */
aside::before {
  content: "";
  position: absolute;
  top: 0;
  width: 40px;
  height: 40px;
  background: v-bind('`linear-gradient(225deg, ${settings.noteColor} 45%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 55%, ${settings.noteColor} 100%)`');
  box-shadow: -2px 2px 5px rgba(0,0,0,0.05);
  pointer-events: none;
  z-index: 10;
}

.right-0::before { right: 0; }
.left-0::before { left: 0; transform: scaleX(-1); }
</style>
