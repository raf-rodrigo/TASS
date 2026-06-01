<script setup>
import { ref, onMounted, watch, toRef, nextTick } from 'vue';
import { X } from 'lucide-vue-next';
import { useNoteStore } from '../stores/noteStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useNotesDrag } from '../composables/useNotesDrag.js';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'toggle']);
const noteStore = useNoteStore();
const settings = useSettingsStore();

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

const focusAtEnd = () => {
  if (editableRef.value) {
    editableRef.value.focus();
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(editableRef.value);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

// Lógica de arraste e redimensionamento unificada
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

  <!-- Painel de Notas -->
  <aside 
    class="fixed top-0 h-full max-w-[90vw] z-[70] shadow-2xl flex flex-col glass-panel !p-0"
    :class="[
      isResizingLocal ? '' : 'transition-all duration-500 ease-in-out',
      settings.notesSide === 'right' ? 'right-0' : 'left-0',
      isOpen ? 'translate-x-0' : (settings.notesSide === 'right' ? 'translate-x-full' : '-translate-x-full')
    ]"
    :style="{ 
      width: settings.notesWidth + 'px',
      backgroundColor: `rgba(var(--app-bg-raw), var(--app-notes-opacity))`,
      backdropFilter: settings.opacityTargets.notes ? 'blur(var(--app-glass-blur)) brightness(var(--app-glass-brightness)) saturate(var(--app-glass-saturate))' : 'none',
      WebkitBackdropFilter: settings.opacityTargets.notes ? 'blur(var(--app-glass-blur)) brightness(var(--app-glass-brightness)) saturate(var(--app-glass-saturate))' : 'none'
    }" 
  >
    <!-- Aba de Arraste Física -->
    <div 
      class="absolute w-7 h-20 cursor-move flex items-center justify-center group z-[100] shadow-lg transition-all backdrop-blur-md border-y"
      :class="[
        settings.notesSide === 'right' ? 'right-full rounded-l-xl border-l' : 'left-full rounded-r-xl border-r',
        isResizingLocal ? '!transition-none' : '',
        'bg-app-glass border-app-border-light'
      ]"
      :style="{ top: settings.notesButtonTop + 'px' }"
      @mousedown.stop="handleResize"
      @click.stop="handleHandleClick"
      :data-tip="isOpen ? 'Arraste para redimensionar / Clique para fechar' : 'Arraste para mover / Clique para abrir'"
    >
      <div class="flex flex-col gap-1.5 opacity-40 group-hover:opacity-80 transition-all duration-500">
        <div class="w-1.5 h-1.5 rounded-full bg-app-main shadow-[0_0_5px_rgba(0,0,0,0.2)]"></div>
        <div class="w-1.5 h-1.5 rounded-full bg-app-main shadow-[0_0_5px_rgba(0,0,0,0.2)]"></div>
      </div>
    </div>

    <div class="flex-1 flex flex-col overflow-hidden rounded-[var(--app-card-radius)]">
      <!-- Header Simplificado -->
      <div class="flex items-center gap-4 px-5 py-3.5 border-b select-none transition-colors duration-500 bg-app-surface border-app-border-light">
         <div class="flex-1 text-sm font-bold text-app-muted tracking-wider">
           NOTAS RÁPIDAS
         </div>
         <button 
           @click="close" 
           class="transition-colors text-app-muted hover:text-app-main opacity-40 hover:opacity-100"
         >
            <X class="w-4 h-4" />
         </button>
      </div>

      <!-- Área de Texto -->
      <div class="flex-1 p-6 relative flex flex-col">
        <div class="flex items-start gap-3 h-full overflow-hidden">
          
          <!-- Numeração de Linhas -->
          <div 
            ref="linesRef"
            class="flex flex-col text-right pr-3 border-r border-app-border-light opacity-30 select-none font-mono text-lg h-full overflow-hidden leading-relaxed text-app-main"
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
            class="flex-1 h-full bg-transparent border-none focus:ring-0 font-mono leading-relaxed overflow-auto custom-scrollbar-note text-lg outline-none text-app-text-main whitespace-pre"
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
  background: var(--app-border-light);
  border-radius: 10px;
}
.custom-scrollbar-note::-webkit-scrollbar-thumb:hover {
  background: var(--app-text-sub);
}

aside {
  will-change: width, transform;
}
</style>
