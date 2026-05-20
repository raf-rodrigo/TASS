<script setup>
import { ref, onMounted, watch, toRef, nextTick } from 'vue';
import { X, StickyNote, Terminal } from 'lucide-vue-next';
import { useNoteStore } from '../stores/noteStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useNotesDrag } from '../composables/useNotesDrag.js';
import { bridgeService } from '../services/bridgeService';

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

// Estado do Terminal
const activeMode = ref('notes'); // 'notes' ou 'terminal'
const terminalHistory = ref([
  { type: 'output', text: 'TASS Terminal [Versão 1.0.5]\n(c) 2026 TASS Corporation. Todos os direitos reservados.\nDigite "ajuda" ou "help" para ver os comandos locais disponíveis.\n' }
]);
const commandInput = ref('');
const commandHistory = ref([]);
const historyIndex = ref(-1);
const currentCwd = ref('');
const isExecuting = ref(false);
const terminalLinesRef = ref(null);
const terminalInputRef = ref(null);

const formatCwd = (path) => {
  if (!path) return 'TASS';
  if (path.length > 35) {
    const parts = path.split(/[\\/]/);
    if (parts.length > 3) {
      return `...\\${parts[parts.length - 2]}\\${parts[parts.length - 1]}`;
    }
  }
  return path;
};

const initTerminal = async () => {
  if (bridgeService.isServerOnline.value) {
    const info = await bridgeService.getTerminalInfo();
    if (info && info.cwd) {
      currentCwd.value = info.cwd;
    }
  }
};

const focusTerminalInput = () => {
  if (terminalInputRef.value) {
    terminalInputRef.value.focus();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (terminalLinesRef.value) {
      terminalLinesRef.value.scrollTop = terminalLinesRef.value.scrollHeight;
    }
  });
};

const runCommand = async () => {
  const cmd = commandInput.value.trim();
  if (!cmd) return;

  // Adiciona ao histórico do terminal
  terminalHistory.value.push({
    type: 'command',
    cwd: currentCwd.value,
    text: cmd
  });

  // Adiciona ao histórico de comandos navegáveis
  commandHistory.value.push(cmd);
  historyIndex.value = commandHistory.value.length;
  commandInput.value = '';

  const cleanCmd = cmd.toLowerCase();

  // Comandos Locais
  if (cleanCmd === 'clear' || cleanCmd === 'cls') {
    terminalHistory.value = [];
    scrollToBottom();
    return;
  }

  if (cleanCmd === 'ajuda' || cleanCmd === 'help') {
    terminalHistory.value.push({
      type: 'output',
      text: 'Comandos locais disponíveis:\n' +
            '  ajuda / help  - Mostra este menu de ajuda.\n' +
            '  clear / cls   - Limpa a tela do terminal.\n\n' +
            'Qualquer outro comando inserido será executado via PowerShell no backend do TASS.'
    });
    scrollToBottom();
    return;
  }

  // Execução via Backend
  if (!bridgeService.isServerOnline.value) {
    terminalHistory.value.push({
      type: 'error',
      text: 'Erro: O servidor backend do TASS está offline. Inicie o servidor (npm run dev/server.js) para executar comandos.'
    });
    scrollToBottom();
    return;
  }

  isExecuting.value = true;
  scrollToBottom();

  const response = await bridgeService.executeTerminalCommand(cmd, currentCwd.value);
  
  isExecuting.value = false;

  if (response.stdout) {
    terminalHistory.value.push({
      type: 'output',
      text: response.stdout
    });
  }

  if (response.stderr) {
    terminalHistory.value.push({
      type: 'error',
      text: response.stderr
    });
  }

  if (response.cwd) {
    currentCwd.value = response.cwd;
  }

  scrollToBottom();
};

const handleKeyDown = (e) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (commandHistory.value.length > 0 && historyIndex.value > 0) {
      historyIndex.value--;
      commandInput.value = commandHistory.value[historyIndex.value];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex.value < commandHistory.value.length - 1) {
      historyIndex.value++;
      commandInput.value = commandHistory.value[historyIndex.value];
    } else {
      historyIndex.value = commandHistory.value.length;
      commandInput.value = '';
    }
  }
};

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
  if (activeMode.value === 'notes' && editableRef.value) {
    editableRef.value.focus();
    document.execCommand('foreColor', false, colorMap[color]);
  } else if (activeMode.value === 'terminal') {
    focusTerminalInput();
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

// Lógica de arraste e redimensionamento unificada (Aba Mestra)
const { onMouseDown: handleResize, isDragging: isResizingLocal, hasMoved: notesMoved } = useNotesDrag(settings, toRef(props, 'isOpen'));

onMounted(async () => {
  await noteStore.loadNote();
  if (editableRef.value) {
    editableRef.value.innerHTML = noteStore.note || '<div><br></div>';
    updateLineCount();
  }
});

watch(activeMode, (newMode) => {
  if (newMode === 'terminal') {
    if (!currentCwd.value) {
      initTerminal();
    }
    nextTick(() => {
      focusTerminalInput();
    });
  } else {
    nextTick(() => {
      focusAtEnd();
    });
  }
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (activeMode.value === 'terminal') {
        focusTerminalInput();
      } else {
        focusAtEnd();
      }
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
      :data-tip="isOpen ? 'Arraste para redimensionar / Clique para fechar' : 'Arraste para mover / Clique para abrir'"
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
              data-tip="Tema Red Alert"
            ></div>
            <div 
              @click="setTerminalColor('amber')" 
              class="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.3)] cursor-pointer hover:scale-110 active:scale-90 transition-transform"
              data-tip="Tema Vintage Gold"
            ></div>
            <div 
              @click="setTerminalColor('emerald')" 
              class="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)] cursor-pointer hover:scale-110 active:scale-90 transition-transform"
              data-tip="Tema Classic Terminal"
            ></div>
         </div>
         <div class="flex-1 flex justify-center">
            <div class="flex bg-black/20 p-1 rounded-lg border border-app-border-light text-[10px] font-bold font-mono">
               <button 
                 @click="activeMode = 'notes'"
                 class="px-3 py-1 rounded transition-all duration-300"
                 :class="activeMode === 'notes' ? 'bg-app-glass text-app-main shadow-sm' : 'text-app-muted hover:text-app-main opacity-60 hover:opacity-100'"
               >
                 NOTAS
               </button>
               <button 
                 @click="activeMode = 'terminal'"
                 class="px-3 py-1 rounded transition-all duration-300"
                 :class="activeMode === 'terminal' ? 'bg-app-glass text-app-main shadow-sm' : 'text-app-muted hover:text-app-main opacity-60 hover:opacity-100'"
               >
                 TERMINAL
               </button>
            </div>
         </div>
         <button 
           @click="close" 
           class="transition-colors text-app-muted hover:text-app-main opacity-40 hover:opacity-100"
         >
            <X class="w-4 h-4" />
         </button>
      </div>


      <!-- Área de Texto (Rich Terminal Edition) -->
      <div v-show="activeMode === 'notes'" class="flex-1 p-6 relative flex flex-col terminal-text">
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
            :style="{ color: colorMap[terminalColor] }"
          ></div>
        </div>
      </div>

      <!-- Área do Terminal -->
      <div 
        v-if="activeMode === 'terminal'"
        class="flex-1 p-5 relative flex flex-col font-mono text-sm overflow-hidden select-text"
        @click="focusTerminalInput"
      >
        <!-- Histórico do Terminal -->
        <div 
          ref="terminalLinesRef"
          class="flex-1 overflow-y-auto mb-4 space-y-2 pr-1 custom-scrollbar-note text-left whitespace-pre-wrap select-text leading-relaxed"
          :style="{ color: colorMap[terminalColor] }"
        >
          <div v-for="(line, idx) in terminalHistory" :key="idx">
            <!-- Comando Digitado -->
            <div v-if="line.type === 'command'" class="flex items-start gap-1.5 opacity-80">
              <span class="text-blue-400 font-bold shrink-0">PS</span>
              <span class="text-slate-400 text-xs shrink-0">{{ formatCwd(line.cwd) }}</span>
              <span class="text-slate-300 shrink-0">&gt;</span>
              <span class="font-semibold break-all text-left flex-1">{{ line.text }}</span>
            </div>
            
            <!-- Saída Normal -->
            <div v-else-if="line.type === 'output'" class="font-normal text-left break-all">{{ line.text }}</div>
            
            <!-- Saída de Erro -->
            <div v-else-if="line.type === 'error'" class="text-red-400 font-medium text-left break-all">{{ line.text }}</div>
          </div>

          <!-- Indicador de Comando Executando -->
          <div v-if="isExecuting" class="flex items-center gap-2 opacity-65 animate-pulse text-left">
            <span>Executando...</span>
            <div class="w-1.5 h-3 bg-current animate-ping"></div>
          </div>
        </div>

        <!-- Alerta de Servidor Offline -->
        <div 
          v-if="!bridgeService.isServerOnline.value"
          class="mb-3 px-4 py-2 border rounded-lg bg-red-950/20 border-red-500/30 text-red-400 text-xs flex items-center justify-between"
        >
          <span>Backend offline. Execute o servidor para conectar o terminal.</span>
          <button 
            @click="initTerminal" 
            class="px-2 py-0.5 rounded border border-red-500/40 hover:bg-red-500/20 transition-all font-bold"
          >
            Reconectar
          </button>
        </div>

        <!-- Linha de Prompt Ativa -->
        <div 
          class="flex items-center gap-2 border-t pt-3 border-app-border-light text-left shrink-0 relative cursor-text select-none"
          :style="{ color: colorMap[terminalColor] }"
          @click="focusTerminalInput"
        >
          <span class="text-blue-400 font-bold shrink-0 select-none">PS</span>
          <span 
            class="text-slate-400 text-xs max-w-[200px] truncate shrink-0 select-none" 
            :title="currentCwd || 'Carregando diretório...'"
          >
            {{ formatCwd(currentCwd) || '...' }}
          </span>
          <span class="text-slate-300 shrink-0 select-none">&gt;</span>

          <!-- Representação Visual do Comando e do Cursor Customizado -->
          <div class="flex-1 flex items-center font-mono text-sm overflow-hidden select-text min-h-[20px]">
            <span v-if="commandInput" class="whitespace-pre break-all text-left select-text">{{ commandInput }}</span>
            <span v-else class="opacity-30 select-none text-left">Digite um comando...</span>
            <span 
              class="inline-block w-2 h-4 shrink-0 animate-[pulse_1s_infinite] ml-0.5"
              :style="{ backgroundColor: colorMap[terminalColor] }"
            ></span>
          </div>

          <!-- Input ocultado fisicamente mas focado para capturar eventos de teclado -->
          <input
            ref="terminalInputRef"
            v-model="commandInput"
            @keydown.enter="runCommand"
            @keydown="handleKeyDown"
            type="text"
            class="absolute opacity-0 w-0 h-0 pointer-events-none"
            :disabled="isExecuting"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />

          <!-- 
            TRILHA DE PÃO: Para reverter esta alteração e voltar ao input tradicional do navegador,
            basta substituir todo o conteúdo desta div "Linha de Prompt Ativa" pelo seguinte bloco:
            
            <span class="text-blue-400 font-bold shrink-0 select-none">PS</span>
            <span 
              class="text-slate-400 text-xs max-w-[200px] truncate shrink-0 select-none" 
              :title="currentCwd || 'Carregando diretório...'"
            >
              {{ formatCwd(currentCwd) || '...' }}
            </span>
            <span class="text-slate-300 shrink-0 select-none">&gt;</span>
            <input
              ref="terminalInputRef"
              v-model="commandInput"
              @keydown.enter="runCommand"
              @keydown="handleKeyDown"
              type="text"
              class="flex-1 bg-transparent border-none focus:ring-0 font-mono text-sm outline-none p-0"
              :style="{ color: colorMap[terminalColor] }"
              :class="{
                'caret-emerald-500': terminalColor === 'emerald',
                'caret-amber-500': terminalColor === 'amber',
                'caret-rose-500': terminalColor === 'rose'
              }"
              placeholder="Digite um comando..."
              :disabled="isExecuting"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
            />
          -->
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

