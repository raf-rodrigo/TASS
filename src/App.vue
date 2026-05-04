<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { db } from './db.js';
import TaskCard from './components/TaskCard.vue';
import TaskModal from './components/TaskModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import SprintModal from './components/SprintModal.vue';
import InterfaceMenu from './components/InterfaceMenu.vue';
import NotesPanel from './components/NotesPanel.vue';
import draggable from 'vuedraggable';

// Composables
import { useWaterReminder } from './composables/useWaterReminder.js';
import { useShortcuts } from './composables/useShortcuts.js';
import { useNotesDrag } from './composables/useNotesDrag.js';

// Stores
import { notificationService } from './services/notificationService';
import { ClipboardList, Plus, Sun, Moon, Settings, Calendar, Maximize, StickyNote, RotateCcw, Pencil, CheckCircle, Trash2, X, Clock, Monitor } from 'lucide-vue-next';

import { useSettingsStore } from './stores/settingsStore';
import { useTaskStore } from './stores/taskStore';
import { backupService } from './services/backupService';

const settings = useSettingsStore();
const taskStore = useTaskStore();

// Local UI State
const statusFilter = ref('all');
const showModal = ref(false);
const showSettings = ref(false);
const showSprints = ref(false);
const showInterfaceMenu = ref(false);
const showNotes = ref(false);
const taskToEdit = ref(null);

let timerInterval = null;
let autoSaveInterval = null;

// Lógica de Filtros
const filteredTasks = computed(() => {
  let result = [...taskStore.tasks];
  
  if (settings.activeSprintId !== 'all') {
    const id = parseInt(settings.activeSprintId);
    result = result.filter(t => t.sprintId === id);
  }

  if (statusFilter.value === 'active') {
    result = result.filter(t => !t.completed);
  } else if (statusFilter.value === 'completed') {
    result = result.filter(t => t.completed);
  }
  
  return result;
});

const handleReorder = () => {
  taskStore.updateTaskPositions(filteredTasks.value);
};

// Methods
const openAddModal = () => {
  taskToEdit.value = null;
  showModal.value = true;
};

const openEditModal = (task) => {
  taskToEdit.value = { ...task };
  showModal.value = true;
  taskStore.selectedTask = null; // Limpa a seleção ao editar
};

// Composable initialization
const { startWaterReminder } = useWaterReminder(settings);
useShortcuts({
  onToggleNotes: () => showNotes.value = !showNotes.value,
  onOpenAddModal: openAddModal,
  onOpenSettings: () => showSettings.value = true
});

const { onMouseDown: handleNotesDrag, hasMoved: notesMoved, isDragging: isNotesDragging } = useNotesDrag(settings, showNotes, 'vertical');

const handleToggleNotes = () => {
  showNotes.value = !showNotes.value;
};

const handleSaveTask = async (taskData) => {
  try {
    await taskStore.updateTask(taskData.id, taskData);
    showModal.value = false;
    sToast.fire({ icon: 'success', title: 'Tarefa atualizada!' });
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

const lastActivity = ref(Date.now());
const resetInactivity = () => {
  lastActivity.value = Date.now();
};

const startGlobalTimer = () => {
  timerInterval = setInterval(() => {
    const now = Date.now();

    // Monitor de Inatividade (Dinâmico)
    if (settings.trackInactivity && taskStore.activeTask) {
      const thresholdMs = (settings.inactivityThreshold || 1) * 60000;
      if (now - lastActivity.value > thresholdMs) {
        const pausedTaskName = taskStore.activeTask.title;
        taskStore.toggleTimer(taskStore.activeTask);
        notificationService.alert('Monitor de Inatividade', `A tarefa ativa (${pausedTaskName}) foi parada por falta de atividade.`, 'warning');
        resetInactivity(); // Reseta para não disparar alerta em loop
      }
    }

    // Verificação de pausa automática fora do expediente
    if (settings.autoPauseOutsideWork && taskStore.activeTask) {
      const nowDate = new Date();
      const currentDay = nowDate.getDay();
      const currentTimeStr = nowDate.getHours().toString().padStart(2, '0') + ':' + nowDate.getMinutes().toString().padStart(2, '0');
      
      const isWorkDay = settings.workDays.includes(currentDay);
      const isWithinHours = currentTimeStr >= settings.workStart && currentTimeStr < settings.workEnd;
      
      if (!isWorkDay || !isWithinHours) {
        taskStore.toggleTimer(taskStore.activeTask);
        notificationService.alert('Expediente Encerrado', 'Sua tarefa foi pausada automaticamente seguindo sua jornada de trabalho.', 'info');
        return;
      }
    }
    taskStore.updateRunningTasks();
  }, 1000);
};

const startAutoSave = () => {
  autoSaveInterval = setInterval(() => {
    taskStore.autoSaveRunningTasks();
  }, 10000);
};

const toggleTheme = () => {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  settings.saveSetting('app-theme', settings.theme); 
  applyTheme();
};

const applyTheme = () => {
  if (settings.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
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
    applyTheme(); // Reaplica o tema após restauração das configs
    event.target.value = '';
  }
};

const resetFilters = () => {
  statusFilter.value = 'all';
  settings.activeSprintId = 'all';
  notificationService.toast('Filtros limpos', 'info', 1500);
};

onMounted(async () => {
  await settings.loadSettings();
  applyTheme();
  await taskStore.loadTasks();
  await taskStore.loadSprints();
  startGlobalTimer();
  startAutoSave();
  startWaterReminder();

  // Iniciar monitor de inatividade
  window.addEventListener('mousemove', resetInactivity);
  window.addEventListener('keydown', resetInactivity);
  window.addEventListener('click', resetInactivity);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  window.removeEventListener('mousemove', resetInactivity);
  window.removeEventListener('keydown', resetInactivity);
  window.removeEventListener('click', resetInactivity);
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

  <div v-if="settings.isInitialized" class="relative z-10 mx-auto w-full flex flex-col items-center p-4 md:p-8 pb-32 ease-in-out" :class="isNotesDragging ? '' : 'transition-all duration-500'" :style="{ maxWidth: settings.appWidth + 'px', fontFamily: settings.fontFamily }" @click="taskStore.selectedTask = null">
    <!-- TASS Branding (Top Left) -->
    <div class="fixed top-6 left-8 z-20 flex flex-col items-start animate-[fadeInLeft_0.8s_ease-out] select-none pointer-events-none">
      <div class="flex items-center gap-2">
        <div class="w-1.5 h-10 bg-gradient-to-b from-indigo-600 via-purple-500 to-blue-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)]"></div>
        <h1 class="text-4xl font-black tracking-tighter leading-none bg-gradient-to-r from-indigo-600 via-purple-500 to-blue-500 bg-clip-text text-transparent italic pr-2">
          TASS
        </h1>
      </div>
      <div class="mt-1 flex items-center gap-2">
        <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-3 whitespace-nowrap">
          Gerenciador de Tarefas
        </span>
        <div class="h-[1px] w-8 bg-slate-200 dark:bg-white/10"></div>
      </div>
    </div>

    <main class="w-full mt-24">
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
        @save="startWaterReminder"
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

      <section>
        <div v-if="taskStore.tasks.length === 0" class="text-center py-16 text-slate-500 dark:text-slate-400">
          <ClipboardList class="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Nenhuma tarefa encontrada.</p>
        </div>

        <draggable :list="filteredTasks" @end="handleReorder" item-key="id" class="grid gap-4 w-full" :class="{
            'grid-cols-1': settings.columns === 1,
            'grid-cols-1 md:grid-cols-2': settings.columns === 2,
            'grid-cols-1 md:grid-cols-3': settings.columns === 3,
            'grid-cols-1 md:grid-cols-4': settings.columns === 4
          }" ghost-class="opacity-50" drag-class="scale-95" animation="300" handle=".cursor-grab">
          <template #item="{ element: task }">
            <TaskCard :task="task" @toggle-completion="toggleTaskCompletion" @delete-task="deleteTask" @edit-task="openEditModal" @toggle-timer="taskStore.toggleTimer" />
          </template>
        </draggable>
      </section>
    </main>

    <footer class="fixed bottom-0 left-0 w-full grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-6 px-8 z-40 pointer-events-none">
      <div class="flex justify-center md:justify-start gap-2 pointer-events-auto">
        <div 
          class="flex items-center gap-1 p-1 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg backdrop-blur-md transition-all duration-300"
          :style="{ backgroundColor: settings.theme === 'dark' 
            ? `rgba(30, 41, 59, ${settings.opacityTargets.actionBar ? settings.cardOpacity / 100 : 0.98})` 
            : `rgba(255, 255, 255, ${settings.opacityTargets.actionBar ? settings.cardOpacity / 100 : 0.95})` 
          }"
        >
          <button class="p-1.5 hover:scale-110 transition-transform" @click="toggleTheme" :title="settings.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'">
            <Sun v-if="settings.theme === 'dark'" class="w-5 h-5 text-amber-500" />
            <Moon v-else class="w-5 h-5 text-indigo-500" />
          </button>
          <button class="p-1.5 hover:scale-110 transition-transform group" @click="showInterfaceMenu = true" title="Ajustes de Interface">
            <Maximize class="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </button>
          <button class="p-1.5 hover:scale-110 transition-transform group" @click="showSprints = true" title="Gerenciar Sprints">
            <Calendar class="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </button>
          <button class="p-1.5 hover:scale-110 transition-transform group" @click="showSettings = true" title="Configurações">
            <Settings class="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </button>
        </div>
      </div>

      <!-- Center: Separate Filters & Metrics (Grouped for Layout) -->
      <div class="flex flex-col md:flex-row justify-center items-center gap-3 pointer-events-auto w-full md:w-auto">
        <!-- Status Filters Capsule -->
        <div 
          class="flex items-center gap-0.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg backdrop-blur-xl"
          :style="{ backgroundColor: settings.theme === 'dark' 
            ? `rgba(30, 41, 59, ${settings.opacityTargets.bottomBar ? settings.cardOpacity / 100 : 0.98})` 
            : `rgba(255, 255, 255, ${settings.opacityTargets.bottomBar ? settings.cardOpacity / 100 : 0.95})` 
          }"
        >
          <button class="filter-btn" :class="{ 'active': statusFilter === 'all' }" @click="resetFilters">Todas</button>
          <button class="filter-btn" :class="{ 'active': statusFilter === 'active' }" @click="statusFilter = 'active'">Ativas</button>
          <button class="filter-btn" :class="{ 'active': statusFilter === 'completed' }" @click="statusFilter = 'completed'">Concluídas</button>
          <button v-if="statusFilter !== 'all' || settings.activeSprintId !== 'all'" @click="resetFilters" class="icon-btn hover:text-red-500 ml-1 px-2 !bg-transparent !border-none">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Metrics Info Capsule -->
        <div 
          class="flex items-center gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg backdrop-blur-xl"
          :style="{ backgroundColor: settings.theme === 'dark' 
            ? `rgba(30, 41, 59, ${settings.opacityTargets.bottomBar ? settings.cardOpacity / 100 : 0.98})` 
            : `rgba(255, 255, 255, ${settings.opacityTargets.bottomBar ? settings.cardOpacity / 100 : 0.95})` 
          }"
        >
          <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/5">
            <Calendar class="w-3.5 h-3.5 text-indigo-500" />
            <span class="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase whitespace-nowrap">{{ taskStore.activeSprintName }}</span>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Clock class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{{ taskStore.activeSprintTotalTime }}</span>
          </div>

          <!-- Active Task Monitor -->
          <div v-if="taskStore.activeTask" class="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl border border-emerald-500/20 animate-scaleIn">
            <span class="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[80px] md:max-w-[120px]">{{ taskStore.activeTask.title }}</span>
            <span class="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {{ taskStore.activeTaskTimeFormatted }}
            </span>
            <span class="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></span>
          </div>

          <button v-if="taskStore.lastDeletedTask" @click="taskStore.restoreTask" class="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-md transition-all animate-pulse ml-1 border border-amber-500/20">
            <RotateCcw class="w-3.5 h-3.5" /> Desfazer
          </button>
        </div>
      </div>

      <div class="flex justify-center md:justify-end pointer-events-auto">
        <button 
          class="btn btn-primary !rounded-full !p-4 shadow-xl hover:rotate-90 transition-all duration-300 flex items-center justify-center w-14 h-14" 
          @click="openAddModal" 
          title="Nova Task"
        >
          <Plus class="w-7 h-7" />
        </button>
      </div>
    </footer>
  </div>
  <div v-else class="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
    <div class="animate-pulse text-indigo-500 font-bold">Carregando TASS...</div>
  </div>
</template>


