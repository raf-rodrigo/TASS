<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  Save, PlusCircle, Clock, Layout, 
  Settings2, ChevronDown, Globe, 
  FileText, Database, Layers, 
  AlertCircle, X, ExternalLink, GitBranch,
  Sparkles, Bug, Zap, RefreshCcw, ArrowDown, ArrowRight, ArrowUp, AlertOctagon
} from 'lucide-vue-next';
import { useTaskStore } from '../stores/taskStore';
import { useSprintStore } from '../stores/sprintStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStyleStore } from '../stores/taskStyleStore';
import { useUIStore } from '../stores/uiStore';
import { isValidUrl, ensureProtocol } from '../utils/validation';
import { formatMsToHMS } from '../utils/time';
import { hexToRgba } from '../utils/colors.js';
import { notificationService } from '../services/notificationService';
import BaseModal from './BaseModal.vue';
import AppInput from './base/AppInput.vue';
import AppTextarea from './base/AppTextarea.vue';
import AppSelect from './base/AppSelect.vue';
import AppColorPalette from './AppColorPalette.vue';

const taskStore = useTaskStore();
const sprintStore = useSprintStore();
const settings = useSettingsStore();
const taskStyleStore = useTaskStyleStore();
const uiStore = useUIStore();

const taskToEdit = uiStore.taskToEdit;

const activeTab = ref('basic');
const title = ref(taskToEdit ? taskToEdit.title : '');
const description = ref(taskToEdit ? taskToEdit.description : '');

// Advanced properties
const priority = ref(taskToEdit?.priority || 'Normal');
const devUrl = ref(taskToEdit?.devUrl || '');
const homologUrl = ref(taskToEdit?.homologUrl || '');
const prodUrl = ref(taskToEdit?.prodUrl || '');
const taskUrl = ref(taskToEdit?.taskUrl || '');
const isGitHub = computed(() => settings.gitProvider === 'github');
const branchName = ref(settings.gitProvider === 'github' ? (taskToEdit?.githubBranchName || '') : (taskToEdit?.branchName || ''));
const branchUrl = ref(settings.gitProvider === 'github' ? (taskToEdit?.githubBranchUrl || '') : (taskToEdit?.branchUrl || ''));
const dbScripts = ref(taskToEdit?.dbScripts || '');
const moreInfo = ref(taskToEdit?.moreInfo || '');
const sprintId = ref(taskToEdit?.sprintId || '');
const styleId = ref(taskToEdit?.styleId || '');

const hoveredStyleId = ref(null);
const showStyleDropdown = ref(false);

const getStyleLabel = (id) => {
  if (!id) return '🎨 Estilo Padrão (Global)';
  const style = taskStyleStore.getStyleById(id);
  return style ? `✨ ${style.name}` : '🎨 Estilo Padrão (Global)';
};

const activePreviewStyleId = computed(() => hoveredStyleId.value !== null ? hoveredStyleId.value : styleId.value);

const previewStyle = computed(() => {
  if (activePreviewStyleId.value) {
    const style = taskStyleStore.getStyleById(activePreviewStyleId.value);
    if (style && style.colors) {
      return {
        color: style.colors.color || '#6366f1',
        backgroundColor: style.colors.bgColor ? hexToRgba(style.colors.bgColor, settings.normalizedCardOpacity) : ''
      };
    }
  }
  return { 
    color: '#6366f1',
    backgroundColor: ''
  };
});

const tabs = [
  { id: 'basic', label: 'Geral', icon: Layout, color: 'text-indigo-500', desc: 'Dados essenciais para identificação da tarefa.' },
  { id: 'links', label: 'Conectividade', icon: Globe, color: 'text-emerald-500', desc: 'Gerenciamento de repositórios e links.' },
  { id: 'data', label: 'Documentação', icon: FileText, color: 'text-amber-500', desc: 'Queries, observações e detalhes técnicos.' },
  { id: 'timesheet', label: 'Jornada', icon: Clock, color: 'text-sky-500', desc: 'Registro diário de horas trabalhadas.' }
];

const activeTabObj = computed(() => tabs.find(t => t.id === activeTab.value) || tabs[0]);

// Time State (Simple Hours)
const parseEstimatedHours = (timeStr) => {
  if (!timeStr) return 0;
  const h = timeStr.match(/(\d+)h/);
  return h ? parseInt(h[1]) : (parseInt(timeStr) || 0);
};

const estimatedHours = ref(parseEstimatedHours(taskToEdit?.estimatedTime));
const errors = ref({});

const validateFields = () => {
  errors.value = {};
  let firstErrorTab = null;

  const urlFields = [
    { key: 'devUrl', value: devUrl.value, label: 'Desenvolvimento', tab: 'links' },
    { key: 'homologUrl', value: homologUrl.value, label: 'Homologação', tab: 'links' },
    { key: 'prodUrl', value: prodUrl.value, label: 'Produção', tab: 'links' },
    { key: 'taskUrl', value: taskUrl.value, label: 'Link da Tarefa', tab: 'links' },
    { key: 'branchUrl', value: branchUrl.value, label: 'Link da Branch', tab: 'links' }
  ];

  for (const field of urlFields) {
    if (field.value && !isValidUrl(field.value)) {
      errors.value[field.key] = `Link de ${field.label} inválido!`;
      if (!firstErrorTab) firstErrorTab = field.tab;
    }
  }

  // Validar título (aba basic)
  if (!title.value.trim()) {
    errors.value.title = 'O título é obrigatório!';
    if (!firstErrorTab) firstErrorTab = 'basic';
  }

  return firstErrorTab;
};

const hasErrorInTab = (tabId) => {
  if (tabId === 'links') {
    return !!(errors.value.devUrl || errors.value.homologUrl || errors.value.prodUrl || errors.value.taskUrl || errors.value.branchUrl);
  }
  if (tabId === 'basic') {
    return !!errors.value.title;
  }
  return false;
};

const clearError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field];
  }
};



const sprintOptions = computed(() => {
  return [
    { label: 'Nenhuma Sprint', value: '' },
    ...sprintStore.sprints.map(sprint => ({
      label: `Ciclo de ${new Date(sprint.endDate).toLocaleDateString('pt-BR')}`,
      value: sprint.id
    }))
  ];
});

const priorityOptions = [
  { label: 'Baixa', value: 'Baixa' },
  { label: 'Normal', value: 'Normal' },
  { label: 'Alta', value: 'Alta' },
  { label: 'Urgente', value: 'Urgente' }
];

onMounted(() => {
  if (!taskToEdit && sprintStore.sprints.length > 0) {
    const latestSprint = [...sprintStore.sprints].sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];
    if (latestSprint) {
      sprintId.value = latestSprint.id;
    }
  }
});

const submitTask = () => {
  const errorTab = validateFields();
  
  if (errorTab) {
    activeTab.value = errorTab; // Navega para a aba com erro
    notificationService.toast('Verifique os campos com erro.', 'error');
    return;
  }
  
  const timeStr = estimatedHours.value > 0 ? `${estimatedHours.value}h` : '';

  const payload = {
    title: title.value.trim(),
    description: description.value.trim(),
    estimatedTime: timeStr,
    priority: priority.value,
    devUrl: ensureProtocol(devUrl.value.trim()),
    homologUrl: ensureProtocol(homologUrl.value.trim()),
    prodUrl: ensureProtocol(prodUrl.value.trim()),
    taskUrl: ensureProtocol(taskUrl.value.trim()),
    ...(settings.gitProvider === 'github' ? {
      githubBranchName: branchName.value.trim(),
      githubBranchUrl: ensureProtocol(branchUrl.value.trim())
    } : {
      branchName: branchName.value.trim(),
      branchUrl: ensureProtocol(branchUrl.value.trim())
    }),
    dbScripts: dbScripts.value.trim(),
    moreInfo: moreInfo.value.trim(),
    sprintId: sprintId.value ? parseInt(sprintId.value) : null,
    styleId: styleId.value || null,
    // Limpar as propriedades legadas para evitar sobreposição de estilos
    color: '',
    bgColor: '',
    textLightColor: '',
    textDarkColor: ''
  };

  if (taskToEdit) {
    taskStore.updateTask(taskToEdit.id, payload).then(() => {
      notificationService.toast('Tarefa atualizada!', 'success');
    });
  } else {
    taskStore.addTask(payload);
  }
  
  uiStore.closeTaskModal();
};
</script>

<template>
  <BaseModal 
    maxWidth="max-w-5xl" 
    @close="uiStore.closeTaskModal()" 
    layout="sidebar" 
    customClass="h-[95vh] md:h-[700px] flex flex-col"
    :title="activeTabObj.label"
    :subtitle="activeTabObj.desc"
    :icon="activeTabObj.icon"
  >
    <!-- Sidebar (Navegação) -->
    <template #sidebar>
      <nav class="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          type="button"
          class="flex-shrink-0 flex items-center gap-3 px-4 md:px-3 py-2 md:py-2.5 rounded-xl transition-all group relative"
          :class="activeTab === tab.id 
            ? 'bg-app-surface text-indigo-600 dark:text-indigo-400' 
            : 'text-app-sub hover:bg-app-surface'"
        >
          <div class="relative">
            <component :is="tab.icon" class="w-4 h-4" :class="activeTab === tab.id ? tab.color : 'text-slate-400'" />
            <div v-if="hasErrorInTab(tab.id)" class="absolute -top-1.5 -right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50 dark:border-slate-800 animate-pulse"></div>
          </div>
          <span class="text-[11px] md:text-xs font-bold whitespace-nowrap">{{ tab.label }}</span>
        </button>
      </nav>

      <div class="mt-auto hidden md:block p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
        <div class="flex items-center gap-2 mb-2">
          <AlertCircle class="w-3 h-3 text-indigo-500" />
          <span class="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Dica TASS</span>
        </div>
        <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
          Mantenha suas branches organizadas para facilitar o deploy.
        </p>
      </div>
    </template>

    <!-- Conteúdo Principal -->
    <form id="taskForm" @submit.prevent="submitTask" novalidate class="flex-1 flex flex-col justify-between h-full">
      <transition name="fade-slide" mode="out-in">
        <!-- ABA 1: Cadastro Básico -->
        <div v-if="activeTab === 'basic'" :key="'basic'" class="space-y-6">
          <AppInput
            v-model="title"
            label="Número da Tarefa"
            placeholder="Ex: TSK-1234"
            :error="errors.title"
            @update:modelValue="clearError('title')"
            required
            class="font-mono font-bold"
            :style="previewStyle"
          />

          <AppInput
            v-model="description"
            label="Descrição"
            placeholder="O que você precisa fazer?"
            class="font-medium"
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="relative flex-1">
              <label class="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                <div class="flex items-center gap-1.5">
                  <Sparkles class="w-3.5 h-3.5 text-indigo-500" />
                  Estilo da Tarefa
                </div>
              </label>
              
              <div 
                @click="showStyleDropdown = !showStyleDropdown"
                class="app-input px-3 py-2 text-sm w-full cursor-pointer bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium flex justify-between items-center"
              >
                <span class="truncate">{{ getStyleLabel(styleId) }}</span>
                <ChevronDown class="w-4 h-4 text-slate-400" />
              </div>

              <!-- Overlay invisible to close on click outside -->
              <div v-if="showStyleDropdown" @click="showStyleDropdown = false" class="fixed inset-0 z-40"></div>

              <div 
                v-if="showStyleDropdown"
                class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col"
                style="max-height: 240px;"
              >
                <div class="overflow-y-auto custom-scrollbar flex-1 py-1">
                  <div
                    @mouseenter="hoveredStyleId = ''"
                    @mouseleave="hoveredStyleId = null"
                    @click="styleId = ''; showStyleDropdown = false"
                    class="px-3 py-2 text-sm cursor-pointer transition-colors"
                    :class="styleId === '' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'"
                  >
                    🎨 Estilo Padrão (Global)
                  </div>
                  
                  <div
                    v-for="s in taskStyleStore.sortedStyles"
                    :key="s.id"
                    @mouseenter="hoveredStyleId = s.id"
                    @mouseleave="hoveredStyleId = null"
                    @click="styleId = s.id; showStyleDropdown = false"
                    class="px-3 py-2 text-sm cursor-pointer transition-colors"
                    :class="styleId === s.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'"
                  >
                    ✨ {{ s.name }}
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 mt-4 md:mt-6 bg-app-surface p-3 rounded-2xl border border-app-border-light">
               <div class="flex-1 flex gap-2">
                 <div class="w-6 h-6 rounded-full shadow-sm border border-app-border-light" :style="{ backgroundColor: previewStyle.color }"></div>
                 <div class="w-6 h-6 rounded-full shadow-sm border border-app-border-light" :style="{ backgroundColor: previewStyle.backgroundColor || (settings.theme === 'dark' ? '#1e293b' : '#ffffff') }"></div>
               </div>
               <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prévia de Cores</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <AppSelect
                v-model="sprintId"
                label="Sprint"
                :icon="Layers"
                iconColor="text-slate-400"
                :options="sprintOptions"
              />
            </div>

            <div>
              <AppSelect 
                v-model="priority" 
                label="Prioridade" 
                :options="priorityOptions" 
                class="font-bold" 
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <AppInput
                v-model="estimatedHours"
                type="number"
                label="Estimativa (Horas)"
                :icon="Clock"
                min="0"
                placeholder="0"
                class="font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Sessão Atual</label>
                <div class="app-input px-4 py-3 shadow-sm transition-all flex items-center gap-2 cursor-default">
                  <Clock class="w-3.5 h-3.5 text-indigo-500" />
                  <span class="text-[10px] md:text-xs font-black font-mono text-app-main">{{ taskToEdit ? formatMsToHMS(taskToEdit.totalTimeSpent) : '00:00:00' }}</span>
                </div>
              </div>
              <div>
                <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Total</label>
                <div class="app-input px-4 py-3 shadow-sm transition-all flex items-center gap-2 cursor-default">
                  <Layout class="w-3.5 h-3.5 text-indigo-500" />
                  <span class="text-[10px] md:text-xs font-black font-mono text-app-main">{{ taskToEdit ? formatMsToHMS(taskToEdit.totalWorked || taskToEdit.totalTimeSpent || 0) : '00:00:00' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ABA 2: Desenvolvimento -->
        <div v-else-if="activeTab === 'links'" :key="'links'" class="space-y-8">
          <div class="glass-section p-6 space-y-4">
            <div class="flex items-center gap-3 mb-2">
              <GitBranch class="w-4 h-4 text-indigo-500" />
              <h4 class="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em]">Source Control</h4>
            </div>
            <div class="grid grid-cols-1 gap-6">
              <AppInput 
                v-model="taskUrl" 
                type="url" 
                label="Link da Tarefa (Issue)" 
                placeholder="https://..."
                :error="errors.taskUrl"
                @update:modelValue="clearError('taskUrl')"
              />
            </div>
            <AppInput 
              v-model="branchUrl" 
              type="url" 
              label="Link da Branch (Repositório)" 
              placeholder="https://gitlab.com/.../-/tree/main"
              :error="errors.branchUrl"
              @update:modelValue="clearError('branchUrl')"
            />
          </div>

          <div class="p-6 bg-slate-500/5 rounded-3xl border border-app-border-light space-y-6">
            <div class="flex items-center gap-3 mb-2">
              <Globe class="w-4 h-4 text-indigo-500" />
              <h4 class="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em]">Pipeline</h4>
            </div>
            
            <div class="grid grid-cols-1 gap-6">
              <AppInput v-model="devUrl" type="url" label="Desenvolvimento" label-color="text-orange-500" placeholder="https://..." :error="errors.devUrl" @update:modelValue="clearError('devUrl')" />
              <AppInput v-model="homologUrl" type="url" label="Homologação" label-color="text-emerald-500" placeholder="https://..." :error="errors.homologUrl" @update:modelValue="clearError('homologUrl')" />
              <AppInput v-model="prodUrl" type="url" label="Produção" label-color="text-blue-500" placeholder="https://..." :error="errors.prodUrl" @update:modelValue="clearError('prodUrl')" />
            </div>
          </div>
        </div>

        <!-- ABA 3: Documentação -->
        <div v-else-if="activeTab === 'data'" :key="'data'" class="space-y-6">
          <AppTextarea v-model="dbScripts" label="Scripts de Banco (SQL)" :icon="Database" icon-color="text-indigo-500" placeholder="SELECT * FROM..." rows="4" class="font-mono" />
          <AppTextarea v-model="moreInfo" label="Observações Adicionais" :icon="FileText" icon-color="text-amber-500" placeholder="Ponto de atenção..." rows="4" />
        </div>

        <!-- ABA 4: Jornada -->
        <div v-else-if="activeTab === 'timesheet'" :key="'timesheet'" class="space-y-6 h-full flex flex-col">
          <div class="flex-1 p-6 bg-slate-500/5 rounded-3xl border border-app-border-light flex flex-col min-h-0">
            <div class="flex items-center gap-3 mb-6 flex-shrink-0">
              <Clock class="w-4 h-4 text-sky-500" />
              <h4 class="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em]">Apontamento de Horas</h4>
            </div>

            <div v-if="!taskToEdit || !taskToEdit.dailyLogs || Object.keys(taskToEdit.dailyLogs).length === 0" class="flex flex-col items-center justify-center py-10 text-center flex-1">
              <div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Clock class="w-6 h-6 text-slate-400" />
              </div>
              <p class="text-sm font-bold text-slate-600 dark:text-slate-300">Nenhum registro ainda</p>
              <p class="text-xs text-slate-500 mt-1 max-w-xs">Ligue o cronômetro para começar a registrar sua jornada nesta tarefa.</p>
            </div>

            <div v-else class="flex flex-col min-h-0">
              <div class="grid grid-cols-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 pb-2 border-b border-app-border-light flex-shrink-0">
                <span>Data</span>
                <span class="text-right">Horas Trabalhadas</span>
              </div>
              
              <div class="space-y-1 overflow-y-auto no-scrollbar py-2 flex-1 min-h-[150px]">
                <div v-for="(ms, date) in taskToEdit.dailyLogs" :key="date" class="grid grid-cols-2 items-center px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/5 transition-all hover:border-sky-500/30">
                  <span class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ date.split('-').reverse().join('/') }}</span>
                  <span class="text-xs font-mono text-right text-sky-600 dark:text-sky-400">{{ formatMsToHMS(ms) }}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 items-center px-4 pt-4 mt-2 border-t border-app-border-light flex-shrink-0">
                <span class="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Total</span>
                <span class="text-sm font-mono font-bold text-right text-indigo-600 dark:text-indigo-400">{{ formatMsToHMS(taskToEdit.totalTimeSpent) }}</span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </form>

    <template #footer>
      <button type="button" @click="uiStore.closeTaskModal()" class="btn btn-secondary px-6 py-2 border-none shadow-none text-xs">Cancelar</button>
      <button type="submit" form="taskForm" class="btn btn-primary px-6 py-2 border-none shadow-none text-xs">
        {{ taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa' }}
      </button>
    </template>
  </BaseModal>
</template>
