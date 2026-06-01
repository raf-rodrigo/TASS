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
import GlobalDock from './components/GlobalDock.vue';
import RadioPlayer from './components/RadioPlayer.vue';
import WelcomeModal from './components/WelcomeModal.vue';
import GitRebuilder from './components/breeze/GitRebuilder.vue';
import { useRouter, useRoute } from 'vue-router';

// Composables
import { useWellness } from './composables/useWellness.js';
import { useShortcuts } from './composables/useShortcuts.js';
import { useNotesDrag } from './composables/useNotesDrag.js';
import { useTheme } from './composables/useTheme.js';
import { useSystemMonitoring } from './composables/useSystemMonitoring.js';
import { useGlobalPulse } from './composables/useGlobalPulse.js';

// Stores

import { notificationService } from './services/notificationService';
import { ClipboardList, Plus, Sun, Moon, Settings, Calendar, Maximize, RotateCcw, Pencil, CheckCircle, Trash2, X, Clock } from 'lucide-vue-next';

import { useSettingsStore } from './stores/settingsStore';
import { useTaskStore } from './stores/taskStore';
import { backupService } from './services/backupService';
import { db } from './db.js';
import { useTaskStyleStore } from './stores/taskStyleStore';

const settings = useSettingsStore();
const taskStore = useTaskStore();
const taskStyleStore = useTaskStyleStore();

// UI State
const showWelcome = ref(false);
const showModal = ref(false);
const showSettings = ref(false);
const showGitRebuilder = ref(false);
const showSprints = ref(false);
const showInterfaceMenu = ref(false);
const showTaskStyleBuilder = ref(false);
const showNotes = ref(false);
const showRadio = ref(false);
const showTimeAdjustment = ref(false);
const taskToEdit = ref(null);
const taskForTimeAdjustment = ref(null);
const router = useRouter();
const route = useRoute();

// Modal initial states for Welcome Modal redirects
const settingsInitialTab = ref(null);
const interfaceInitialTab = ref(null);
const sprintInitialShowAddForm = ref(false);
// Methods
const openAddModal = () => {
  taskToEdit.value = null;
  showModal.value = true;
};

const openEditModal = (task) => {
  taskToEdit.value = { ...task };
  showModal.value = true;
  taskStore.selectedTask = null;
};

const openTimeAdjustment = (task) => {
  taskForTimeAdjustment.value = task;
  showTimeAdjustment.value = true;
};

const { currentMessage, showMessage, triggerWellness } = useWellness(settings);

useShortcuts({
  onToggleNotes: (val) => {
    if (val === false) {
      showNotes.value = false;
      showSettings.value = false;
      showInterfaceMenu.value = false;
      showModal.value = false;
      showSprints.value = false;
      showTaskStyleBuilder.value = false;
      taskStore.selectedTask = null;
    } else {
      showNotes.value = !showNotes.value;
    }
  },
  onOpenAddModal: openAddModal,
  onOpenSettings: () => showSettings.value = true,
  onWellnessTest: () => triggerWellness(true),
  isNotesOpen: () => showNotes.value
});

const { onMouseDown: handleNotesDrag, isDragging: isNotesDragging } = useNotesDrag(settings, showNotes, 'vertical');
const { toggleTheme, applyTheme } = useTheme(settings);
const { checkMonitoring } = useSystemMonitoring(settings, taskStore);
useGlobalPulse(taskStore, checkMonitoring);

const handleToggleNotes = () => {
  showNotes.value = !showNotes.value;
};

const handleSaveTask = async (taskData) => {
  try {
    await taskStore.updateTask(taskData.id, taskData);
    showModal.value = false;
    notificationService.toast('Tarefa atualizada!', 'success');
  } catch (error) {
    console.error("Failed to update task:", error);
  }
};

const handleAddTask = async (taskData) => {
  try {
    await taskStore.addTask(taskData);
    showModal.value = false;
  } catch (error) {
    console.error("Failed to add task:", error);
  }
};

const handleToggleRadio = () => {
  showRadio.value = !showRadio.value;
};

// Dock openers that reset welcome modal initial selections
const openSettingsFromDock = () => {
  settingsInitialTab.value = null;
  showSettings.value = true;
};

const openInterfaceFromDock = () => {
  interfaceInitialTab.value = null;
  showInterfaceMenu.value = true;
};

const openSprintsFromDock = () => {
  sprintInitialShowAddForm.value = false;
  showSprints.value = true;
};

// Handle welcome modal shortcut selection
const handleWelcomeShortcut = (action) => {
  showWelcome.value = false;
  if (action === 'wallpaper') {
    interfaceInitialTab.value = 'wallpapers';
    showInterfaceMenu.value = true;
  } else if (action === 'task') {
    openAddModal();
  } else if (action === 'sprint') {
    sprintInitialShowAddForm.value = true;
    showSprints.value = true;
  } else if (action === 'radio') {
    showRadio.value = true;
  } else if (action === 'gitlab') {
    settingsInitialTab.value = 'gitlab';
    showSettings.value = true;
  }
};

const handleOpenGitRebuilder = () => {
  showSettings.value = false;
  showGitRebuilder.value = true;
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
      await taskStore.toggleTimer(task);
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
  // Limpa dados legados de água e papéis de parede inválidos (Google Drive) do banco
  try {
    await db.settings.where('key').anyOf(['app-water-enabled', 'app-water-interval']).delete();
    
    const wps = await db.settings.get('app-custom-wallpapers');
    if (wps && wps.value && Array.isArray(wps.value)) {
      const limpos = wps.value.filter(w => !w.url.includes('drive.google.com'));
      if (limpos.length !== wps.value.length) await db.settings.put({ key: 'app-custom-wallpapers', value: limpos });
    }
    
    const bg = await db.settings.get('app-bg-image');
    if (bg && bg.value && bg.value.includes('drive.google.com')) {
      await db.settings.put({ key: 'app-bg-image', value: '' });
    }
  } catch (e) {
    console.warn("Falha na limpeza inicial do DB", e);
  }

  await settings.loadSettings();
  await taskStyleStore.loadStyles();
  applyTheme();
  await taskStore.loadTasks();
  await taskStore.loadSprints();

  if (!settings.hideWelcomeModal) {
    showWelcome.value = true;
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


  <div 
    v-if="settings.isInitialized" 
    id="app-root"
    class="relative z-10 mx-auto w-full min-h-screen flex flex-col items-center overflow-x-hidden transition-all duration-300"
    :class="{ 'select-none': isDraggingTask }"
    :style="{ fontFamily: settings.fontFamily }"
  >
    <div 
      class="w-full flex flex-col items-center px-4 md:px-6 pt-2 pb-32"
      :class="[
        isNotesDragging ? '' : 'transition-all duration-500',
        isDraggingTask ? 'is-dragging-mode' : ''
      ]"
      :style="{ maxWidth: '98%' }"
    >
      <!-- TASS Branding (Bottom Right) -->
      <div class="fixed bottom-6 right-6 md:bottom-10 md:right-12 z-20 flex flex-col items-end animate-[fadeInRight_0.8s_ease-out] select-none pointer-events-none opacity-30 md:opacity-60 hover:opacity-100 transition-opacity">
        <div class="flex items-center gap-2">
          <h1 
            class="text-xl md:text-2xl leading-none bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] bg-clip-text text-transparent pr-2"
            style="font-family: 'Satisfy', cursive;"
          >
            Tass
          </h1>
          <div class="w-1 h-6 md:h-8 bg-gradient-to-b from-[#00C4CC] to-[#7D2AE8] rounded-full shadow-[0_0_10px_rgba(0,196,204,0.2)]"></div>
        </div>
      </div>

      <main class="w-full mt-2 flex-1">
        <NotesPanel :isOpen="showNotes" @toggle="showNotes = !showNotes" @close="showNotes = false" />

        <!-- Roteador Principal -->
        <router-view 
          :isDraggingTask="isDraggingTask"
          @edit-task="openEditModal"
          @toggle-completion="toggleTaskCompletion"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          @open-time-adjustment="openTimeAdjustment"
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
          @edit="openEditModal(taskStore.selectedTask)"
          @toggle-completion="() => { toggleTaskCompletion(taskStore.selectedTask); taskStore.selectedTask = null; }"
          @delete="() => { taskStore.deleteTask(taskStore.selectedTask.id); taskStore.selectedTask = null; }"
          @adjust-time="() => { openTimeAdjustment(taskStore.selectedTask); taskStore.selectedTask = null; }"
        />
      </transition>

      <!-- Global Dock -->
      <transition 
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="translate-y-20 opacity-0 scale-95"
        enter-to-class="translate-y-0 opacity-100 scale-100"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="translate-y-0 opacity-100 scale-100"
        leave-to-class="translate-y-20 opacity-0 scale-95"
      >
        <GlobalDock 
          v-if="(!taskStore.selectedTask || settings.contextMenuMode === 'stack' || settings.contextMenuStyle === 'floating') && route.name !== 'ComponentSuite'"
          @add-task="openAddModal"
          @open-sprints="openSprintsFromDock"
          @open-notes="showNotes = !showNotes"
          @open-interface="openInterfaceFromDock"
          @open-settings="openSettingsFromDock"
          @toggle-theme="toggleTheme"
          @open-radio="handleToggleRadio"
          @open-git-rebuilder="handleOpenGitRebuilder"
        />
      </transition>
    </div>

    <!-- 4. Modal Layer -->
    <TaskModal 
      v-if="showModal" 
      :taskToEdit="taskToEdit"
      @close="showModal = false" 
      @add-task="handleAddTask" 
      @save-task="handleSaveTask"
    />

    <TimeAdjustmentModal
      v-if="showTimeAdjustment"
      :key="taskForTimeAdjustment?.id"
      :task="taskForTimeAdjustment"
      @close="showTimeAdjustment = false"
    />

    <GitRebuilder
      v-if="showGitRebuilder"
      @close="showGitRebuilder = false"
    />

    <SettingsModal
      v-if="showSettings"
      :initialTab="settingsInitialTab"
      @close="showSettings = false"
      @open-interface="() => { showSettings = false; showInterfaceMenu = true; }"
      @save="() => {}"
      @test-wellness="triggerWellness(true)"
      @test-modal="handleTestModal"
      @export-tasks="handleExportTasks"
      @import-tasks="handleImportTasks"
      @export-system="handleExportSystem"
      @import-system="handleImportSystem"
      @open-git-rebuilder="handleOpenGitRebuilder"
    />

    <SprintModal
      v-if="showSprints"
      :activeSprintId="settings.activeSprintId"
      :initialShowAddForm="sprintInitialShowAddForm"
      @close="showSprints = false"
      @select-sprint="(id) => settings.activeSprintId = id"
      @updated="taskStore.loadSprints"
    />

    <InterfaceMenu
      v-if="showInterfaceMenu"
      :isOpen="showInterfaceMenu"
      :initialTab="interfaceInitialTab"
      @close="showInterfaceMenu = false"
      @open-settings="() => { showInterfaceMenu = false; showSettings = true; }"
      @open-style-builder="() => { showTaskStyleBuilder = true; }"
    />

    <TaskStyleBuilderModal
      v-if="showTaskStyleBuilder"
      @close="showTaskStyleBuilder = false"
    />

    <RadioPlayer
      :isOpen="showRadio"
      @close="showRadio = false"
    />

    <NotificationContainer />
    <GlobalModal />

    <WellnessToast 
      :message="currentMessage" 
      :show="showMessage" 
    />

    <WelcomeModal
      v-if="showWelcome"
      @close="showWelcome = false"
      @select-shortcut="handleWelcomeShortcut"
    />

  </div>
  <div v-else class="relative z-10 min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
    <div class="animate-pulse text-indigo-500 font-bold">Carregando TASS...</div>
  </div>
</template>
