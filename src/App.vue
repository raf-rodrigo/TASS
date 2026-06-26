<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import TaskCard from './components/TaskCard.vue';
import TaskModal from './components/TaskModal.vue';
import TimeAdjustmentModal from './components/TimeAdjustmentModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import SprintModal from './components/SprintModal.vue';
import InterfaceMenu from './components/InterfaceMenu.vue';
import TaskStyleBuilderModal from './components/TaskStyleBuilderModal.vue';
import NotesPanel from './components/NotesPanel.vue';
import WellnessToast from './components/WellnessToast.vue';
import NotificationContainer from './components/NotificationContainer.vue';
import GlobalModal from './components/GlobalModal.vue';
import TaskContextMenu from './components/TaskContextMenu.vue';
import WorkspaceContextMenu from './components/WorkspaceContextMenu.vue';
import StylePickerMenu from './components/StylePickerMenu.vue';
import GlobalDock from './components/GlobalDock.vue';
import RadioPlayer from './components/RadioPlayer.vue';
import WelcomeModal from './components/WelcomeModal.vue';
import WeatherWidget from './components/WeatherWidget.vue';
import ImmersiveClock from './components/ImmersiveClock.vue';
import GitRebuilder from './components/breeze/GitRebuilder.vue';
import { useRouter, useRoute } from 'vue-router';

// Composables
import { useWellness } from './composables/useWellness.js';
import { useShortcuts } from './composables/useShortcuts.js';
import { useNotesDrag } from './composables/useNotesDrag.js';
import { useTheme } from './composables/useTheme.js';
import { useSystemMonitoring } from './composables/useSystemMonitoring.js';
import { useGlobalPulse } from './composables/useGlobalPulse.js';
import { useTaskShortcuts } from './composables/useTaskShortcuts.js';
import { useDeviceBehavior } from './composables/useDeviceBehavior.js';

// Stores

import { notificationService } from './services/notificationService';
import { ClipboardList, Plus, Sun, Moon, Settings, Calendar, Maximize, RotateCcw, Pencil, CheckCircle, Trash2, X, Clock, LogOut, Sparkles } from 'lucide-vue-next';

import { useSettingsStore } from './stores/settingsStore';
import { useTaskStore } from './stores/taskStore';
import { useSprintStore } from './stores/sprintStore';
import { useTimerStore } from './stores/timerStore';
import { backupService } from './services/backupService';
import { db } from './db.js';
import { useTaskStyleStore } from './stores/taskStyleStore';
import { useUIStore } from './stores/uiStore';

const settings = useSettingsStore();
const taskStore = useTaskStore();
const sprintStore = useSprintStore();
const timerStore = useTimerStore();
const taskStyleStore = useTaskStyleStore();
const uiStore = useUIStore();
const router = useRouter();
const route = useRoute();

// Estado de Autenticação do Usuário
const currentUser = computed(() => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('tass_user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
});

const handleLogout = () => {
  db.auth.logout();
};

// Modal initial states for Welcome Modal redirects
const interfaceInitialTab = ref(null);
const sprintInitialShowAddForm = ref(false);
// Methods

const usersList = ref([]);
const loadUsers = async () => {
  try {
    usersList.value = await db.users.list();
  } catch (err) {
    console.error("Failed to load users list:", err);
  }
};

const activeSprintInfo = computed(() => {
  if (settings.activeSprintId === 'all') {
    return { name: 'Todas as Sprints', status: 'Geral', statusClass: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' };
  }
  const id = parseInt(settings.activeSprintId);
  const sprint = sprintStore.sprints.find(s => s.id === id);
  if (!sprint) {
    return { name: '', status: '', statusClass: '' };
  }

  const startStr = sprint.startDate ? new Date(sprint.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '';
  const endStr = new Date(sprint.endDate + 'T00:00:00').toLocaleDateString('pt-BR');
  const name = startStr ? `${startStr} a ${endStr}` : `Até ${endStr}`;

  // Days remaining calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let sprintEndDate;
  if (sprint.endDate.includes('-') && !sprint.endDate.includes('T')) {
    const [year, month, day] = sprint.endDate.split('-');
    sprintEndDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    sprintEndDate = new Date(sprint.endDate);
  }
  sprintEndDate.setHours(0, 0, 0, 0);

  const diffTime = sprintEndDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status = '';
  let statusClass = '';
  if (diffDays < 0) {
    status = 'Encerrada';
    statusClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
  } else if (diffDays === 0) {
    status = 'Termina hoje!';
    statusClass = 'bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse';
  } else if (diffDays === 1) {
    status = '1 dia restante';
    statusClass = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
  } else {
    status = `${diffDays} dias restantes`;
    statusClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  }

  return { name, status, statusClass };
});

const { currentMessage, showMessage, triggerWellness } = useWellness(settings);
const { shouldHideDockForModal, isMobile } = useDeviceBehavior();

const isDockVisible = computed(() => {
  return uiStore.showGlobalDock && 
         !shouldHideDockForModal.value && 
         (!taskStore.selectedTask || settings.contextMenuMode === 'stack' || settings.contextMenuStyle === 'floating') && 
         route.name === 'Workspace';
});

useTaskShortcuts();

useShortcuts({
  onToggleNotes: (val) => {
    if (val === false) {
      uiStore.showNotes = false;
      uiStore.showSettings = false;
      uiStore.showInterfaceMenu = false;
      uiStore.showTaskModal = false;
      uiStore.showSprints = false;
      uiStore.showTaskStyleBuilder = false;
      taskStore.selectedTask = null;
    } else {
      uiStore.showNotes = !uiStore.showNotes;
    }
  },
  onOpenAddModal: () => uiStore.openTaskModal(),
  onOpenSettings: () => uiStore.showSettings = true,
  onWellnessTest: () => triggerWellness(true),
  isNotesOpen: () => uiStore.showNotes
});

const { onMouseDown: handleNotesDrag, isDragging: isNotesDragging } = useNotesDrag(settings, computed(() => uiStore.showNotes), 'vertical');
const { toggleTheme, applyTheme } = useTheme(settings);
const { checkMonitoring } = useSystemMonitoring(settings, timerStore);
useGlobalPulse(timerStore, checkMonitoring);

const handleToggleNotes = () => {
  uiStore.showNotes = !uiStore.showNotes;
};



const handleToggleRadio = () => {
  uiStore.showRadio = !uiStore.showRadio;
};

// Dock openers that reset welcome modal initial selections
const openSettingsFromDock = () => {
  uiStore.openSettings(null);
};

const openInterfaceFromDock = () => {
  interfaceInitialTab.value = null;
  uiStore.showInterfaceMenu = true;
};

const openSprintsFromDock = () => {
  sprintInitialShowAddForm.value = false;
  uiStore.showSprints = true;
};

// Handle welcome modal shortcut selection
const handleWelcomeShortcut = async (action) => {
  uiStore.showWelcome = false;
  if (action === 'wallpaper') {
    interfaceInitialTab.value = 'wallpapers';
    uiStore.showInterfaceMenu = true;
  } else if (action === 'task') {
    uiStore.openTaskModal();
  } else if (action === 'sprint') {
    sprintInitialShowAddForm.value = true;
    uiStore.showSprints = true;
  } else if (action === 'radio') {
    uiStore.showRadio = true;
  } else if (action === 'gitlab') {
    uiStore.openSettings('gitlab');
  } else if (action === 'example-cards') {
    const laserLemon = taskStyleStore.styles.find(s => s.name === 'Laser Lemon' || s.id === 'style_laser_lemon' || s.id === 'neon-4');
    const matrixGreen = taskStyleStore.styles.find(s => s.name === 'Matrix Green' || s.id === 'neon-2');
    
    if (!laserLemon || !matrixGreen) {
      notificationService.toast('Os presets "Laser Lemon" e "Matrix Green" não estão presentes no sistema.', 'warning');
      return;
    }

    const basePayload = {
      estimatedTime: '',
      priority: 'Normal',
      devUrl: 0,
      homologUrl: 0,
      prodUrl: 0,
      taskUrl: '',
      branchName: '',
      branchUrl: '',
      dbScripts: '',
      moreInfo: '',
      sprintId: null,
      color: '',
      bgColor: '',
      textLightColor: '',
      textDarkColor: ''
    };
    
    await taskStore.addTask({
      ...basePayload,
      title: 'X0001',
      description: 'Exemplo de card utilizando o preset Laser Lemon.',
      styleId: laserLemon.id
    });
    
    await taskStore.addTask({
      ...basePayload,
      title: 'X0002',
      description: 'Exemplo de card utilizando o preset Matrix Green.',
      styleId: matrixGreen.id
    });
    
  } else if (action === 'task-styles') {
    interfaceInitialTab.value = 'tasks';
    uiStore.showInterfaceMenu = true;
  } else if (action === 'breeze') {
    handleOpenGitRebuilder();
  } else if (action === 'about') {
    uiStore.openSettings('about');
  }
};

const handleOpenGitRebuilder = () => {
  uiStore.showSettings = false;
  uiStore.showGitRebuilder = true;
};

const handleTestModal = async (type) => {
  if (type === 'success') {
    notificationService.alert('Teste Concluído!', 'O modal de sucesso está funcionando.', 'success');
  } else if (type === 'error') {
    notificationService.alert('Falha Simulada', 'O modal de erro foi disparado com sucesso.', 'error');
  } else if (type === 'warning') {
    await notificationService.confirm('Cuidado!', 'Isto é um teste do modal de aviso (warning).', 'Entendido', 'warning');
  } else if (type === 'prompt') {
    const result = await notificationService.prompt('Entrada de Dados', 'Digite algo para testar o prompt:', 'text');
    if (result) {
      notificationService.toast(`Você digitou: ${result}`, 'success');
    }
  }
};

const toggleTaskCompletion = async (task) => {
  try {
    const newStatus = !task.completed;
    if (newStatus && task.isRunning) {
      await timerStore.toggleTimer(task);
    }
    await taskStore.updateTask(task.id, { completed: newStatus });
    notificationService.toast(newStatus ? 'Tarefa concluída!' : 'Tarefa reaberta!');
  } catch (error) {
    console.error("Failed to update task completion:", error);
  }
};

const deleteTask = async (id) => {
  await taskStore.deleteTask(id);
};

// --- BACKUP HANDLERS ---
const handleExportTasks = () => backupService.exportTasks();
const handleExportSystem = () => backupService.exportSystem();

const handleImportTasks = async (event) => {
  const file = event.target.files[0];
  if (file) {
    await backupService.importTasks(file, taskStore);
    event.target.value = '';
  }
};

const handleImportSystem = async (event) => {
  const file = event.target.files[0];
  if (file) {
    await backupService.importSystem(file, settings, taskStore);
    applyTheme();
    event.target.value = '';
  }
};

const isDraggingTask = ref(false);

const handleDragStart = () => {
  isDraggingTask.value = true;
};

const handleDragEnd = () => {
  isDraggingTask.value = false;
};

const handleWorkspaceContextMenu = (event) => {
  if (isMobile.value) return; // Bloqueia o menu de contexto geral no celular

  // Capture click position
  uiStore.workspaceContextMenuPosition = { x: event.clientX, y: event.clientY };
  
  // Fechar menu de task ativo, se houver
  if (taskStore.selectedTask) taskStore.selectedTask = null;
  
  // Pequeno delay para remontagem limpa
  setTimeout(() => {
    uiStore.showWorkspaceContextMenu = true;
  }, 10);
};

// Sincroniza estado de arraste com o body para evitar seleção de texto
watch(isDraggingTask, (val) => {
  if (val) document.body.classList.add('dragging-task');
  else document.body.classList.remove('dragging-task');
});

// Sincroniza a fonte global no body para que elementos em arraste (ghosts) herdem a fonte correta
watch(() => settings.fontFamily, (newFont) => {
  if (newFont) {
    document.body.style.fontFamily = newFont;
  }
}, { immediate: true });

onMounted(async () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tass_auth_token') : null;
  
  if (token) {
    if (currentUser.value) {
      taskStore.selectedUserIdFilter = currentUser.value.id;
    }
    await settings.loadSettings();
    await taskStyleStore.loadStyles();
    applyTheme();
    await taskStore.loadTasks();
    await sprintStore.loadSprints();
    await loadUsers();

    if (!settings.hideWelcomeModal) {
      uiStore.showWelcome = true;
    }
  } else {
    // Se não está logado, inicializa com configurações fictícias ou padrão para não quebrar a tela de login
    settings.isInitialized = true;
  }
});
</script>

<template>
  <!-- Background Wallpaper Layer -->
  <template v-if="settings.backgroundImage">
    <!-- Camada 1: A Imagem (Limpa e com folga) -->
    <div 
      class="fixed -top-[40px] -left-[40px] -right-[40px] -bottom-[40px] z-0 pointer-events-none"
      :style="{ 
        backgroundImage: `url('${settings.backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }"
    ></div>
    <!-- Camada 2: O Vidro (Aplica o Blur e Brilho via Backdrop) -->
    <div 
      class="fixed inset-0 z-0 pointer-events-none transition-all duration-700 ease-in-out"
      :style="{ 
        backdropFilter: `blur(${settings.backgroundBlur}px) brightness(${settings.theme === 'dark' ? (settings.darkenWallpaper ? 0.6 : 1.0) : 0.85})`,
        '-webkit-backdrop-filter': `blur(${settings.backgroundBlur}px) brightness(${settings.theme === 'dark' ? (settings.darkenWallpaper ? 0.6 : 1.0) : 0.85})`,
        backgroundColor: settings.theme === 'dark' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.05)'
      }"
    ></div>
  </template>

  <!-- Immersive Clock Layer -->
  <ImmersiveClock v-if="settings.immersiveClockEnabled" />


  <div 
    v-if="settings.isInitialized" 
    id="app-root"
    class="relative z-10 mx-auto w-full min-h-screen flex flex-col items-center overflow-x-hidden transition-all duration-300"
    :class="{ 'select-none': isDraggingTask }"
    :style="{ fontFamily: settings.fontFamily }"
    @contextmenu.prevent="handleWorkspaceContextMenu"
  >
    <div 
      class="w-full flex flex-col items-center px-1 sm:px-4 md:px-6 pt-2 flex-1"
      :class="[
        isNotesDragging ? '' : 'transition-all duration-500',
        isDraggingTask ? 'is-dragging-mode' : ''
      ]"
      :style="{ maxWidth: '98%' }"
    >
      <!-- Navbar Superior (Exibida apenas se logado) -->
      <nav 
        v-if="currentUser"
        class="w-full max-w-7xl mx-auto flex items-center justify-between px-6 py-4 rounded-2xl border border-white/10 glass-panel shadow-lg mb-6 z-30 transition-all duration-300"
        style="background-color: rgba(15, 17, 26, 0.45); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Sparkles class="w-5 h-5" />
          </div>
          <h1 class="text-lg font-black tracking-widest text-white uppercase leading-none">TASS</h1>
        </div>

        <!-- Dropdown de Seleção de Usuários / Quadro -->
        <div v-if="currentUser" class="flex items-center gap-2">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar Quadro:</label>
          <select 
            v-model="taskStore.selectedUserIdFilter"
            class="bg-[#1e293b]/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option :value="currentUser.id" class="bg-slate-900 text-slate-300">Minhas Tarefas ({{ currentUser.username }})</option>
            <option value="all" class="bg-slate-900 text-slate-300">Todos os Usuários</option>
            <option 
              v-for="u in usersList.filter(user => user.id !== currentUser.id)" 
              :key="u.id" 
              :value="u.id" 
              class="bg-slate-900 text-slate-300"
            >
              Usuário: {{ u.username }}
            </option>
          </select>
        </div>

        <!-- Seletor de Sprint Ativa -->
        <div v-if="currentUser" class="hidden lg:flex items-center gap-2">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sprint:</label>
          <select 
            v-model="settings.activeSprintId"
            class="bg-[#1e293b]/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="all" class="bg-slate-900 text-slate-300">Todas as Sprints</option>
            <option 
              v-for="s in sprintStore.sprints" 
              :key="s.id" 
              :value="s.id"
              class="bg-slate-900 text-slate-300"
            >
              Ciclo: {{ s.startDate ? new Date(s.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : '' }} a {{ new Date(s.endDate + 'T00:00:00').toLocaleDateString('pt-BR') }}
            </option>
          </select>
          
          <!-- Badge de dias restantes ou encerrada -->
          <span 
            v-if="settings.activeSprintId !== 'all' && activeSprintInfo.status"
            :class="activeSprintInfo.statusClass" 
            class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider leading-none ml-1"
          >
            {{ activeSprintInfo.status }}
          </span>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-slate-300">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <span class="font-medium">Olá, {{ currentUser.username }}</span>
          </div>

          <button 
            @click="handleLogout"
            class="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-xs font-black uppercase tracking-wider text-rose-400 transition-all cursor-pointer"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </nav>
      <!-- TASS Branding (Bottom Right) -->
      <div class="hidden md:flex fixed bottom-6 right-6 md:bottom-10 md:right-12 z-20 flex-col items-end animate-[fadeInRight_0.8s_ease-out] select-none pointer-events-none opacity-30 md:opacity-60 hover:opacity-100 transition-opacity">
        <div class="flex items-center gap-2">
          <h1 
            class="text-xl md:text-2xl leading-none bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] bg-clip-text text-transparent pr-2"
            style="font-family: 'Satisfy', cursive;"
          >
            Tass
          </h1>
          <div class="w-1 h-6 md:h-8 bg-gradient-to-b from-[#00C4CC] to-[#7D2AE8] rounded-full shadow-[0_0_10px_rgba(0,196,204,0.2)]"></div>
          <div class="flex flex-col text-right justify-center">
            <span class="text-[8px] md:text-[9px] font-black text-slate-500/70 dark:text-slate-400/70 uppercase tracking-[0.2em] leading-none">Copyright &copy; 2026</span>
            <span class="text-[9px] md:text-[10px] font-medium text-slate-600 dark:text-slate-300 italic mt-1 leading-none">Feito com ❤️</span>
          </div>
        </div>
      </div>

      <main class="w-full mt-2 flex-1 flex flex-col">
        <NotesPanel v-if="currentUser" :isOpen="uiStore.showNotes" @toggle="uiStore.showNotes = !uiStore.showNotes" @close="uiStore.showNotes = false" />

        <!-- Roteador Principal -->
        <router-view 
          :isDraggingTask="isDraggingTask"
          @edit-task="uiStore.openTaskModal"
          @toggle-completion="toggleTaskCompletion"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          @open-time-adjustment="uiStore.openTimeAdjustment"
        />
      </main>
    </div>

    <!-- Camada de Interface: Global Dock e Task Context Menu -->
    <div class="pointer-events-none">
      <!-- Menu de Contexto da Tarefa -->
      <transition 
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <TaskContextMenu 
          v-if="taskStore.selectedTask"
          :task="taskStore.selectedTask"
          @close="taskStore.selectedTask = null"
        />
      </transition>

      <!-- Menu de Contexto do Workspace -->
      <transition 
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <WorkspaceContextMenu 
          v-if="uiStore.showWorkspaceContextMenu"
          @close="uiStore.showWorkspaceContextMenu = false"
        />
      </transition>

      <!-- Menu Flutuante de Seleção de Estilo -->
      <transition 
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <StylePickerMenu />
      </transition>

      <!-- Global Dock -->
      <GlobalDock 
        :visible="isDockVisible"
        @add-task="uiStore.openTaskModal"
        @open-sprints="openSprintsFromDock"
        @open-notes="uiStore.showNotes = !uiStore.showNotes"
        @open-interface="openInterfaceFromDock"
        @open-settings="openSettingsFromDock"
        @toggle-theme="toggleTheme"
        @open-radio="handleToggleRadio"
        @open-git-rebuilder="handleOpenGitRebuilder"
      />
    </div>

    <!-- Weather Widget -->
    <WeatherWidget />

    <!-- 4. Modal Layer -->
    <TaskModal 
      v-if="uiStore.showTaskModal" 
    />

    <TimeAdjustmentModal
      v-if="uiStore.showTimeAdjustment"
      :key="uiStore.taskForTimeAdjustment?.id"
      :task="uiStore.taskForTimeAdjustment"
    />

    <GitRebuilder
      v-if="uiStore.showGitRebuilder"
      @close="uiStore.showGitRebuilder = false"
    />

    <SettingsModal
      v-if="uiStore.showSettings"
      :initialTab="uiStore.settingsInitialTab"
      @close="uiStore.showSettings = false"
      @open-interface="() => { uiStore.showSettings = false; openInterfaceFromDock(); }"
      @test-wellness="() => triggerWellness(true)"
    />

    <SprintModal
      v-if="uiStore.showSprints"
      :activeSprintId="settings.activeSprintId"
      :initialShowAddForm="sprintInitialShowAddForm"
      @close="uiStore.showSprints = false"
      @select-sprint="(id) => settings.activeSprintId = id"
      @updated="sprintStore.loadSprints"
    />

    <InterfaceMenu
      v-if="uiStore.showInterfaceMenu"
      :isOpen="uiStore.showInterfaceMenu"
      :initialTab="interfaceInitialTab"
      @close="uiStore.showInterfaceMenu = false"
      @open-settings="() => { uiStore.showInterfaceMenu = false; uiStore.showSettings = true; }"
      @open-style-builder="() => { uiStore.showTaskStyleBuilder = true; }"
      @test-wellness="() => triggerWellness(true)"
    />

    <TaskStyleBuilderModal
      v-if="uiStore.showTaskStyleBuilder"
      @close="uiStore.showTaskStyleBuilder = false"
    />

    <RadioPlayer
      v-if="currentUser"
      :isOpen="uiStore.showRadio"
      @close="uiStore.showRadio = false"
    />

    <NotificationContainer />
    <GlobalModal />

    <WellnessToast 
      :message="currentMessage" 
      :show="showMessage" 
    />

    <WelcomeModal
      v-if="uiStore.showWelcome && route.name === 'Workspace'"
      @close="uiStore.showWelcome = false"
      @select-shortcut="handleWelcomeShortcut"
    />

  </div>
  <div v-else class="relative z-10 min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
    <div class="animate-pulse text-indigo-500 font-bold">Carregando TASS...</div>
  </div>
</template>
