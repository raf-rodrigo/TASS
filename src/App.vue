<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import TaskCard from './components/TaskCard.vue';
import TaskBoard from './components/TaskBoard.vue';
import TaskModal from './components/TaskModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import SprintModal from './components/SprintModal.vue';
import InterfaceMenu from './components/InterfaceMenu.vue';
import NotesPanel from './components/NotesPanel.vue';
import WellnessToast from './components/WellnessToast.vue';
import draggable from 'vuedraggable';

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

const settings = useSettingsStore();
const taskStore = useTaskStore();

// Board State Proxy (A Ponte de Dados)
const boardColumns = ref([[], [], [], []]);

const syncBoardWithStore = () => {
  for (let i = 1; i <= 4; i++) {
    boardColumns.value[i-1] = taskStore.filteredTasks
      .filter(t => t.columnId === i)
      .sort((a, b) => a.position - b.position);
  }
};

// UI State
const showModal = ref(false);
const showSettings = ref(false);
const showSprints = ref(false);
const showInterfaceMenu = ref(false);
const showNotes = ref(false);
const taskToEdit = ref(null);

// Sincroniza o board local quando as tarefas ou filtros mudam
watch(
  [() => taskStore.filteredTasks, () => taskStore.statusFilter, () => settings.activeSprintId], 
  () => {
    syncBoardWithStore();
  }, 
  { deep: true, immediate: true }
);

const handleBoardChange = async (evt, columnId) => {
  if (evt.added) {
    const task = evt.added.element;
    await taskStore.updateTask(task.id, { columnId });
  }
  
  const allOrderedTasks = [];
  for (let i = 0; i < settings.columns; i++) {
    allOrderedTasks.push(...boardColumns.value[i]);
  }
  await taskStore.updateAllPositions(allOrderedTasks);
};

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

const { currentMessage, showMessage, triggerWellness } = useWellness(settings);

useShortcuts({
  onToggleNotes: () => showNotes.value = !showNotes.value,
  onOpenAddModal: openAddModal,
  onOpenSettings: () => showSettings.value = true,
  onWellnessTest: () => triggerWellness(true)
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

onMounted(async () => {
  // Limpa dados legados de água do banco
  try {
    await db.settings.where('key').anyOf(['app-water-enabled', 'app-water-interval']).delete();
  } catch (e) {
    console.warn("Nada para limpar no DB");
  }

  await settings.loadSettings();
  applyTheme();
  await taskStore.loadTasks();
  await taskStore.loadSprints();
  syncBoardWithStore();
});
</script>

<template>
  <!-- Background Wallpaper Layer -->
  <div 
    v-if="settings.backgroundImage" 
    class="fixed inset-0 z-[-1] pointer-events-none transition-all duration-1000 ease-in-out"
    :style="{ 
      backgroundImage: `url(${settings.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      filter: `blur(${settings.backgroundBlur}px) brightness(${settings.theme === 'dark' ? 0.6 : 0.9})`
    }"
  ></div>

  <div 
    v-if="settings.isInitialized" 
    id="app-root"
    class="relative z-10 mx-auto w-full min-h-screen flex flex-col items-center overflow-x-hidden"
    :style="{ fontFamily: settings.fontFamily }"
  >
    <div 
      class="w-full flex flex-col items-center px-4 md:px-6 pt-4 pb-32"
      :class="[
        isNotesDragging ? '' : 'transition-all duration-500',
        isDraggingTask ? 'is-dragging-mode' : ''
      ]"
      :style="{ maxWidth: '98%' }"
      @click="taskStore.selectedTask = null"
    >
    <!-- TASS Branding (Top Left) -->
    <div class="fixed top-4 left-6 md:top-8 md:left-12 z-20 flex flex-col items-start animate-[fadeInLeft_0.8s_ease-out] select-none pointer-events-none opacity-40 md:opacity-100">
      <div class="flex items-center gap-3">
        <div class="w-1 md:w-1.5 h-8 md:h-12 bg-gradient-to-b from-[#00C4CC] to-[#7D2AE8] rounded-full shadow-[0_0_15px_rgba(0,196,204,0.3)]"></div>
        <h1 
          class="text-3xl md:text-5xl leading-none bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] bg-clip-text text-transparent pr-2"
          style="font-family: 'Satisfy', cursive;"
        >
          Tass
        </h1>
      </div>
      <div class="mt-0.5 md:mt-1 flex items-center gap-2">
        <span class="text-[7px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-2 md:ml-4 whitespace-nowrap">
          Gerenciador de Tarefas
        </span>
        <div class="h-[0.5px] md:h-[1px] w-4 md:w-8 bg-slate-200 dark:bg-white/10"></div>
      </div>
    </div>

      <main class="w-full mt-24 flex-1">

      <transition 
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-10 opacity-0 scale-95"
        enter-to-class="translate-y-0 opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100 scale-100"
        leave-to-class="translate-y-10 opacity-0 scale-95"
      >
        <div v-if="taskStore.selectedTask" class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-auto" @click.stop>
          <div 
            class="glass-panel !py-2 !px-4 flex items-center gap-4 shadow-2xl border-indigo-500/30 backdrop-blur-md rounded-2xl ring-1 ring-black/5 transition-all duration-300"
            :style="{ backgroundColor: settings.theme === 'dark' 
              ? `rgba(30, 41, 59, ${settings.opacityTargets.contextMenu ? settings.cardOpacity / 100 : 0.98})` 
              : `rgba(255, 255, 255, ${settings.opacityTargets.contextMenu ? settings.cardOpacity / 100 : 0.95})` 
            }"
          >

            <div class="flex items-center gap-2">
              <button @click="openEditModal(taskStore.selectedTask)" class="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
                <Pencil class="w-4 h-4 text-indigo-500" /> Editar
              </button>
              <button @click="() => { toggleTaskCompletion(taskStore.selectedTask); taskStore.selectedTask = null; }" class="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
                <RotateCcw v-if="taskStore.selectedTask.completed" class="w-4 h-4 text-emerald-500" />
                <CheckCircle v-else class="w-4 h-4 text-emerald-500" />
                {{ taskStore.selectedTask.completed ? 'Reabrir' : 'Concluir' }}
              </button>
              <button @click="() => { taskStore.deleteTask(taskStore.selectedTask.id); taskStore.selectedTask = null; }" class="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                <Trash2 class="w-4 h-4" /> Excluir
              </button>
            </div>
            <button @click="taskStore.selectedTask = null" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </transition>

      <NotesPanel :isOpen="showNotes" @toggle="showNotes = !showNotes" @close="showNotes = false" />

      <!-- Quadro Kanban Principal -->
      <TaskBoard 
        :boardColumns="boardColumns"
        :isDraggingTask="isDraggingTask"
        @update-board="handleBoardChange"
        @edit-task="openEditModal"
        @toggle-completion="toggleTaskCompletion"
        @delete-task="deleteTask"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
      />
    </main>
  </div>

    <!-- 3. Bottom Bar Layer -->
    <footer class="fixed bottom-0 left-0 w-full flex justify-center items-center py-6 px-2 md:px-8 z-40 pointer-events-none">
      <div class="flex flex-col md:flex-row justify-center items-center gap-3 pointer-events-auto">
        <div class="bottom-capsule !gap-1" :style="{ backgroundColor: `rgba(var(--app-bg-raw), var(--app-action-opacity))` }">
          <button class="p-1.5 hover:scale-110 transition-transform" @click="toggleTheme" :title="settings.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'">
            <Sun v-if="settings.theme === 'dark'" class="w-5 h-5 text-amber-500" />
            <Moon v-else class="w-5 h-5 text-indigo-500" />
          </button>
          <button class="p-1.5 hover:scale-110 transition-transform group" @click="showInterfaceMenu = true" title="Ajustes de Interface">
            <Maximize class="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </button>
          <button class="p-1.5 hover:scale-110 transition-transform group" @click="showSettings = true" title="Configurações">
            <Settings class="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </button>
        </div>
        <div class="bottom-capsule">
          <button class="filter-btn" :class="{ 'active': taskStore.statusFilter === 'all' }" @click="taskStore.statusFilter = 'all'">Todas</button>
          <button class="filter-btn" :class="{ 'active': taskStore.statusFilter === 'active' }" @click="taskStore.statusFilter = 'active'">Ativas</button>
          <button class="filter-btn" :class="{ 'active': taskStore.statusFilter === 'completed' }" @click="taskStore.statusFilter = 'completed'">Concluídas</button>
          
          <button 
            class="ml-1 w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 hover:rotate-90 transition-all duration-300 active:scale-90"
            @click="openAddModal" 
            title="Nova Task"
          >
            <Plus class="w-5 h-5" />
          </button>
        </div>

        <div class="bottom-capsule">
          <div 
            @click="showSprints = true"
            class="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/5 relative group pr-7 transition-all cursor-pointer hover:bg-indigo-500/5 hover:border-indigo-500/30" 
            :class="{ 'pr-3': settings.activeSprintId === 'all' }"
            title="Gerenciar Sprints"
          >
            <Calendar class="w-3.5 h-3.5 text-indigo-500" />
            <span class="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase whitespace-nowrap truncate max-w-[100px] md:max-w-none">{{ taskStore.activeSprintName }}</span>
            <button 
              v-if="settings.activeSprintId !== 'all'" 
              @click.stop="settings.activeSprintId = 'all'" 
              class="absolute right-1.5 p-0.5 rounded-md hover:bg-red-500 hover:text-white text-slate-400 transition-all z-10"
              title="Limpar Filtro de Sprint"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Clock class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{{ taskStore.activeSprintTotalTime }}</span>
          </div>

          <button v-if="taskStore.lastDeletedTask" @click="taskStore.restoreTask" class="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-md transition-all animate-pulse ml-1 border border-amber-500/20">
            <RotateCcw class="w-3.5 h-3.5" /> Desfazer
          </button>
        </div>
      </div>
    </footer>

    <!-- 4. Modal Layer (Teleport-like behavior) -->
    <TaskModal 
      v-if="showModal" 
      :taskToEdit="taskToEdit"
      @close="showModal = false" 
      @add-task="handleAddTask" 
      @save-task="handleSaveTask"
    />

    <SettingsModal
      v-if="showSettings"
      @close="showSettings = false"
      @save="() => {}"
      @test-wellness="triggerWellness(true)"
      @export-tasks="handleExportTasks"
      @import-tasks="handleImportTasks"
      @export-system="handleExportSystem"
      @import-system="handleImportSystem"
    />

    <SprintModal
      v-if="showSprints"
      :activeSprintId="settings.activeSprintId"
      @close="showSprints = false"
      @select-sprint="(id) => settings.activeSprintId = id"
      @updated="taskStore.loadSprints"
    />

    <InterfaceMenu
      v-if="showInterfaceMenu"
      :isOpen="showInterfaceMenu"
      @close="showInterfaceMenu = false"
    />

    <WellnessToast 
      :message="currentMessage" 
      :show="showMessage" 
    />
  </div>
  <div v-else class="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
    <div class="animate-pulse text-indigo-500 font-bold">Carregando TASS...</div>
  </div>
</template>
