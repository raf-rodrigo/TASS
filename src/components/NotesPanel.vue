<script setup>
import { ref, onMounted, watch, toRef, nextTick } from 'vue';
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
const terminalColor = ref('emerald');
const editableRef = ref(null);
const linesRef = ref(null);
const lineCount = ref(1);

const updateLineCount = () => {
  if (editableRef.value) {
    const text = editableRef.value.innerText || '';
    let count = text.split('\n').length;
    if (text.endsWith('\n')) count = Math.max(1, count - 1);
    lineCount.value = Math.max(1, count);
  }
};

const colorMap = {
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e'
};

const setTerminalColor = (color) => {
  terminalColor.value = color;
  if (editableRef.value) {
    editableRef.value.focus();
    document.execCommand('foreColor', false, colorMap[color]);
  }
};

const focusAtEnd = () => {
  if (editableRef.value) {
    editableRef.value.focus();
    // Move o cursor para o final do conteúdo HTML
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(editableRef.value);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

// Lógica de arraste e redimensionamento unificada (Aba Mestra)
const { onMouseDown: handleResize, isDragging: isResizingLocal, hasMoved: notesMoved } = useNotesDrag(settings, toRef(props, 'isOpen'));

onMounted(async () => {
  await noteStore.loadNote();
  if (editableRef.value) {
    editableRef.value.innerHTML = noteStore.note || '<div><br></div>';
    updateLineCount();
  }
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      focusAtEnd();
    });
  } else {
    // Tira o foco para evitar que continue registrando teclas com o painel fechado
    if (editableRef.value) {
      editableRef.value.blur();
    }
  }
});

watch(() => noteStore.note, (newVal) => {
  if (editableRef.value && newVal !== editableRef.value.innerHTML) {
    editableRef.value.innerHTML = newVal || '<div><br></div>';
    updateLineCount();
  }
});

const handleBlur = () => {
  if (editableRef.value) {
    noteStore.saveNote(editableRef.value.innerHTML);
  }
};

const close = () => {
  handleBlur();
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

  <!-- Painel de Notas (Terminal Edition) -->
  <aside 
    class="fixed top-0 h-full max-w-[90vw] z-[70] shadow-2xl flex flex-col glass-panel !p-0"
    :class="[
      isResizingLocal ? '' : 'transition-all duration-500 ease-in-out',
      settings.notesSide === 'right' ? 'right-0' : 'left-0',
      isOpen ? 'translate-x-0' : (settings.notesSide === 'right' ? 'translate-x-full' : '-translate-x-full')
    ]"
    :style="{ width: settings.notesWidth + 'px' }" 
  >
    <!-- Scanline Effect -->
    <div class="scanline"></div>

    <!-- Aba de Arraste Física (Versão Adaptativa) -->
    <div 
      class="absolute w-7 h-20 cursor-move flex items-center justify-center group z-[100] shadow-lg transition-all backdrop-blur-md border-y"
      :class="[
        settings.notesSide === 'right' ? 'right-full rounded-l-xl border-l' : 'left-full rounded-r-xl border-r',
        isResizingLocal ? '!transition-none' : '',
        'bg-app-glass border-app-border-light'
      ]"
      :style="{ 
        top: settings.notesButtonTop + 'px'
      }"
      @mousedown.stop="handleResize"
      @click.stop="handleHandleClick"
      :title="isOpen ? 'Arraste para redimensionar / Clique para fechar' : 'Arraste para mover / Clique para abrir'"
    >
      <div class="flex flex-col gap-1.5 opacity-40 group-hover:opacity-80 transition-all duration-500">
        <div 
          class="w-1.5 h-1.5 rounded-full transition-colors duration-500 shadow-[0_0_5px_rgba(0,0,0,0.2)]"
          :class="{
            'bg-emerald-500 shadow-emerald-500/20': terminalColor === 'emerald',
            'bg-amber-500 shadow-amber-500/20': terminalColor === 'amber',
            'bg-rose-500 shadow-rose-500/20': terminalColor === 'rose'
          }"
        ></div>
        <div 
          class="w-1.5 h-1.5 rounded-full transition-colors duration-500 shadow-[0_0_5px_rgba(0,0,0,0.2)]"
          :class="{
            'bg-emerald-500 shadow-emerald-500/20': terminalColor === 'emerald',
            'bg-amber-500 shadow-amber-500/20': terminalColor === 'amber',
            'bg-rose-500 shadow-rose-500/20': terminalColor === 'rose'
          }"
        ></div>
      </div>
    </div>

    <div class="flex-1 flex flex-col overflow-hidden rounded-[var(--app-card-radius)]">
      <!-- Terminal Header (Adaptativo) -->
      <div 
        class="flex items-center gap-4 px-5 py-3.5 border-b select-none transition-colors duration-500 bg-app-surface border-app-border-light"
      >
         <div class="flex gap-2">
            <div 
              @click="setTerminalColor('rose')" 
              class="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.3)] cursor-pointer hover:scale-110 active:scale-90 transition-transform"
              title="Tema Red Alert"
            ></div>
            <div 
              @click="setTerminalColor('amber')" 
              class="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.3)] cursor-pointer hover:scale-110 active:scale-90 transition-transform"
              title="Tema Vintage Gold"
            ></div>
            <div 
              @click="setTerminalColor('emerald')" 
              class="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)] cursor-pointer hover:scale-110 active:scale-90 transition-transform"
              title="Tema Classic Terminal"
            ></div>
         </div>
         <div class="flex-1 text-center">
            <span 
              class="text-[10px] font-black uppercase tracking-[0.4em] font-mono transition-colors duration-500 text-app-muted opacity-30"
            >tass_notes.sh</span>
         </div>
         <button 
           @click="close" 
           class="transition-colors text-app-muted hover:text-app-main opacity-40 hover:opacity-100"
         >
            <X class="w-4 h-4" />
         </button>
      </div>


      <!-- Área de Texto (Rich Terminal Edition) -->
      <div class="flex-1 p-6 relative flex flex-col terminal-text">
        <div class="flex items-start gap-3 h-full overflow-hidden">
          
          <!-- Numeração de Linhas -->
          <div 
            ref="linesRef"
            class="flex flex-col text-right pr-3 border-r border-current opacity-30 select-none font-mono text-lg h-full overflow-hidden leading-relaxed"
            :class="{
              'text-emerald-500': terminalColor === 'emerald',
              'text-amber-500': terminalColor === 'amber',
              'text-rose-500': terminalColor === 'rose'
            }"
          >
             <div v-for="n in lineCount" :key="n">{{ n }}</div>
          </div>

          <div
            ref="editableRef"
            contenteditable="true"
            @blur="handleBlur"
            @input="updateLineCount"
            @keyup="updateLineCount"
            @scroll="(e) => { if (linesRef) linesRef.scrollTop = e.target.scrollTop }"
            class="flex-1 h-full bg-transparent border-none focus:ring-0 font-mono leading-relaxed overflow-auto custom-scrollbar-note text-lg outline-none transition-all duration-500 whitespace-pre"
            :class="{
              'caret-emerald-500': terminalColor === 'emerald',
              'caret-amber-500': terminalColor === 'amber',
              'caret-rose-500': terminalColor === 'rose'
            }"
            style="color: #10b981;"
          ></div>
        </div>
      </div>


    </div>
  </aside>


</template>

<style scoped>
.custom-scrollbar-note::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar-note::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar-note::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.1);
  border-radius: 10px;
}
.custom-scrollbar-note::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.2);
}

aside {
  will-change: width, transform;
}
</style>

