<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  Save, PlusCircle, Clock, Layout, 
  Settings2, ChevronDown, Globe, 
  FileText, Database, Layers, 
  AlertCircle, X, ExternalLink, GitBranch
} from 'lucide-vue-next';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import { isValidUrl, ensureProtocol } from '../utils/validation';
import { formatMsToHMS } from '../utils/time';
import { notificationService } from '../services/notificationService';
import BaseModal from './BaseModal.vue';
import AppInput from './base/AppInput.vue';
import AppTextarea from './base/AppTextarea.vue';

const taskStore = useTaskStore();
const settings = useSettingsStore();

const props = defineProps({
  taskToEdit: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'add-task', 'save-task']);

const activeTab = ref('basic');
const title = ref(props.taskToEdit ? props.taskToEdit.title : '');
const description = ref(props.taskToEdit ? props.taskToEdit.description : '');

// Advanced properties
const priority = ref(props.taskToEdit?.priority || 'Normal');
const devUrl = ref(props.taskToEdit?.devUrl || '');
const homologUrl = ref(props.taskToEdit?.homologUrl || '');
const prodUrl = ref(props.taskToEdit?.prodUrl || '');
const taskUrl = ref(props.taskToEdit?.taskUrl || '');
const branchUrl = ref(props.taskToEdit?.branchUrl || '');
const dbScripts = ref(props.taskToEdit?.dbScripts || '');
const moreInfo = ref(props.taskToEdit?.moreInfo || '');
const sprintId = ref(props.taskToEdit?.sprintId || '');
const color = ref(props.taskToEdit?.color || '#6366f1');

const tabs = [
  { id: 'basic', label: 'Geral', icon: Layout, color: 'text-indigo-500', desc: 'Dados essenciais para identificação da tarefa.' },
  { id: 'links', label: 'Conectividade', icon: Globe, color: 'text-emerald-500', desc: 'Gerenciamento de repositórios e links.' },
  { id: 'data', label: 'Documentação', icon: FileText, color: 'text-amber-500', desc: 'Queries, observações e detalhes técnicos.' },
];

const activeTabObj = computed(() => tabs.find(t => t.id === activeTab.value) || tabs[0]);

// Time State (Simple Hours)
const parseEstimatedHours = (timeStr) => {
  if (!timeStr) return 0;
  const h = timeStr.match(/(\d+)h/);
  return h ? parseInt(h[1]) : (parseInt(timeStr) || 0);
};

const estimatedHours = ref(parseEstimatedHours(props.taskToEdit?.estimatedTime));
const errors = ref({});

const validateFields = () => {
  errors.value = {};
  let firstErrorTab = null;

  const urlFields = [
    { key: 'devUrl', value: devUrl.value, label: 'Desenvolvimento', tab: 'links' },
    { key: 'homologUrl', value: homologUrl.value, label: 'Homologação', tab: 'links' },
    { key: 'prodUrl', value: prodUrl.value, label: 'Produção', tab: 'links' },
    { key: 'taskUrl', value: taskUrl.value, label: 'Link da Tarefa', tab: 'links' },
    { key: 'branchUrl', value: branchUrl.value, label: 'URL do Merge', tab: 'links' }
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

const colors = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Slate', value: '#64748b' }
];

onMounted(() => {
  if (!props.taskToEdit && taskStore.sprints.length > 0) {
    const latestSprint = [...taskStore.sprints].sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];
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
    branchUrl: ensureProtocol(branchUrl.value.trim()),
    dbScripts: dbScripts.value.trim(),
    moreInfo: moreInfo.value.trim(),
    sprintId: sprintId.value ? parseInt(sprintId.value) : null,
    color: color.value
  };

  if (props.taskToEdit) {
    emit('save-task', { id: props.taskToEdit.id, ...payload });
  } else {
    emit('add-task', payload);
  }
  
  emit('close');
};
</script>

<template>
  <BaseModal 
    maxWidth="max-w-4xl" 
    @close="emit('close')" 
    layout="custom" 
    customClass="h-[90vh] md:h-[600px] !p-0"
  >
    <template #default="{ onMouseDown }">
      <div class="flex flex-col md:flex-row h-full w-full bg-transparent overflow-hidden">
        <!-- Sidebar (Navegação que vira Abas no Mobile) -->
        <aside 
          class="w-full md:w-64 border-b md:border-b-0 md:border-r border-app-border-light flex flex-col p-4 cursor-grab active:cursor-grabbing group shrink-0"
          :class="settings.opacityTargets.modals ? 'bg-transparent' : 'bg-white dark:bg-slate-950'"
          @mousedown="onMouseDown"
        >
          <div class="hidden md:flex items-center gap-3 mb-8 px-1">
            <div class="p-2.5 rounded-2xl text-white shadow-lg" :style="{ backgroundColor: color, boxShadow: `0 8px 20px -4px ${color}44` }">
              <Layout class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm font-black text-app-main uppercase tracking-tighter">{{ taskToEdit ? 'Editar' : 'Nova' }} Task</h2>
              <p class="text-[9px] text-app-muted font-bold uppercase tracking-widest">Gerenciamento</p>
            </div>
          </div>

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
        </aside>

        <!-- Conteúdo Principal -->
        <main 
          class="flex-1 flex flex-col overflow-hidden relative"
          :class="settings.opacityTargets.modals ? 'bg-transparent' : 'bg-white dark:bg-slate-950'"
        >
          <form @submit.prevent="submitTask" novalidate class="flex-1 flex flex-col overflow-hidden">
            <!-- Header da seção ativa (com botão de fechar) -->
            <div class="flex items-center justify-between px-6 md:px-10 py-3 border-b border-app-border-light shrink-0">
              <div class="flex items-center gap-2.5">
                <component :is="activeTabObj.icon" class="w-3.5 h-3.5 shrink-0" :class="activeTabObj.color" />
                <div>
                  <p class="text-[11px] font-black text-app-main leading-none uppercase tracking-wider">{{ activeTabObj.label }}</p>
                  <p class="text-[9px] text-app-muted font-medium mt-0.5">{{ activeTabObj.desc }}</p>
                </div>
              </div>
              <button type="button" @click="emit('close')" class="icon-btn -mr-2 z-10">
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Área de Scroll dos Inputs -->
            <div class="flex-1 overflow-y-auto px-6 md:px-10 py-6 custom-scrollbar pb-32 md:pb-6">
              <transition name="fade-slide" mode="out-in">
                <!-- ABA 1: Cadastro Básico -->
                <div v-if="activeTab === 'basic'" :key="'basic'" class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <AppInput
                      v-model="title"
                      label="Número da Tarefa"
                      placeholder="Ex: TSK-1234"
                      :error="errors.title"
                      @update:modelValue="clearError('title')"
                      required
                      class="font-mono font-bold"
                      :style="{ color: color }"
                    />

                    <div>
                      <label class="block mb-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Cor da Categoria</label>
                      <div class="flex gap-2 flex-wrap p-2 bg-slate-100/50 dark:bg-slate-900/40 border border-app-border-light rounded-xl justify-between h-[50px] items-center">
                        <button v-for="c in colors" :key="c.value" type="button" @click="color = c.value"
                          class="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                          :style="{ backgroundColor: c.value }"
                          :class="color === c.value ? 'border-slate-800 dark:border-white scale-110 ring-4 ring-indigo-500/10' : 'border-transparent opacity-80'"
                          :data-tip="c.name"
                        ></button>
                      </div>
                    </div>
                  </div>

                  <AppTextarea
                    v-model="description"
                    label="Título da Tarefa"
                    placeholder="O que você precisa fazer?"
                    rows="2"
                    class="font-medium"
                  />

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Sprint</label>
                      <div class="relative">
                        <Layers class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select v-model="sprintId" class="pl-10 appearance-none cursor-pointer">
                          <option value="">Nenhuma Sprint</option>
                          <option v-for="sprint in taskStore.sprints" :key="sprint.id" :value="sprint.id">
                            Ciclo de {{ new Date(sprint.endDate).toLocaleDateString('pt-BR') }}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Sessão Atual</label>
                        <div class="p-2.5 bg-slate-100 dark:bg-white/5 border border-app-border-light rounded-xl flex items-center gap-2">
                          <Clock class="w-3.5 h-3.5 text-indigo-500" />
                          <span class="text-[10px] md:text-xs font-black font-mono text-app-main">{{ taskToEdit ? formatMsToHMS(taskToEdit.totalTimeSpent) : '00:00:00' }}</span>
                        </div>
                      </div>
                      <div>
                        <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Total Trabalhado</label>
                        <div class="p-2.5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-center gap-2">
                          <Layout class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span class="text-[10px] md:text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">{{ taskToEdit ? formatMsToHMS(taskToEdit.totalWorked || taskToEdit.totalTimeSpent || 0) : '00:00:00' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Estimativa</label>
                      <div class="relative flex items-center group">
                        <Clock class="absolute left-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                        <input type="number" v-model="estimatedHours" min="0" placeholder="0" class="pl-10 pr-12 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        <span class="absolute right-3 text-[8px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">H</span>
                      </div>
                    </div>
                    <div>
                      <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Prioridade</label>
                      <select v-model="priority" class="appearance-none cursor-pointer font-bold">
                        <option value="Baixa">Baixa</option>
                        <option value="Normal">Normal</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">Urgente</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- ABA 2: Conectividade -->
                <div v-else-if="activeTab === 'links'" :key="'links'" class="space-y-8">
                  <div class="grid grid-cols-1 gap-8">
                    <div class="grid grid-cols-1 gap-6">
                        <AppInput
                          v-model="taskUrl"
                          type="url"
                          label="Link da Tarefa"
                          :icon="ExternalLink"
                          icon-color="text-indigo-500"
                          placeholder="https://..."
                          :error="errors.taskUrl"
                          @update:modelValue="clearError('taskUrl')"
                        />
                        <AppInput
                          v-model="branchUrl"
                          type="url"
                          label="URL do Merge"
                          :icon="GitBranch"
                          icon-color="text-purple-500"
                          placeholder="https://..."
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
                </div>

                <!-- ABA 3: Documentação -->
                <div v-else-if="activeTab === 'data'" :key="'data'" class="space-y-6">
                  <AppTextarea v-model="dbScripts" label="Scripts de Banco (SQL)" :icon="Database" icon-color="text-indigo-500" placeholder="SELECT * FROM..." rows="4" class="font-mono" />
                  <AppTextarea v-model="moreInfo" label="Observações Adicionais" :icon="FileText" icon-color="text-amber-500" placeholder="Ponto de atenção..." rows="4" />
                </div>
              </transition>
            </div>

            <!-- Footer Fixo (Standard TASS Style) -->
            <footer class="absolute bottom-0 left-0 right-0 p-6 md:px-10 border-t border-app-border-light bg-app-surface/95 backdrop-blur-md flex justify-end items-center gap-3 shrink-0 z-20">
              <button type="button" @click="emit('close')" class="btn btn-secondary px-6 border-none shadow-none">Cancelar</button>
              <button type="submit" class="btn btn-primary px-6 border-none shadow-none">
                {{ taskToEdit ? 'Salvar' : 'Criar' }}
              </button>
            </footer>
          </form>
        </main>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
</style>
