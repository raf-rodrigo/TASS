<script setup>
import { ref, onMounted } from 'vue';
import { 
  Save, PlusCircle, Clock, Layout, 
  Settings2, ChevronDown, Globe, 
  FileText, Database, Layers, 
  AlertCircle, X, ExternalLink, GitBranch
} from 'lucide-vue-next';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import BaseModal from './BaseModal.vue';

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
  { id: 'basic', label: 'Cadastro', icon: Layout, color: 'text-indigo-500' },
  { id: 'links', label: 'Conectividade', icon: Globe, color: 'text-emerald-500' },
  { id: 'data', label: 'Documentação', icon: FileText, color: 'text-amber-500' },
];

// Time State (Simple Hours)
const parseEstimatedHours = (timeStr) => {
  if (!timeStr) return 0;
  const h = timeStr.match(/(\d+)h/);
  return h ? parseInt(h[1]) : (parseInt(timeStr) || 0);
};

const estimatedHours = ref(parseEstimatedHours(props.taskToEdit?.estimatedTime));

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
  if (!title.value.trim()) return;
  
  const timeStr = estimatedHours.value > 0 ? `${estimatedHours.value}h` : '';

  const payload = {
    title: title.value.trim(),
    description: description.value.trim(),
    estimatedTime: timeStr,
    priority: priority.value,
    devUrl: devUrl.value.trim(),
    homologUrl: homologUrl.value.trim(),
    prodUrl: prodUrl.value.trim(),
    taskUrl: taskUrl.value.trim(),
    branchUrl: branchUrl.value.trim(),
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
    customClass="!p-0"
    :hideHeader="true"
    @close="emit('close')"
    v-slot="{ onMouseDown }"
  >
    <div class="flex flex-col md:flex-row h-[90vh] md:h-[650px] overflow-hidden">
      <!-- Sidebar (Navigation) -->
      <aside 
        class="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 flex flex-col p-5 bg-slate-50/50 dark:bg-white/[0.02]"
        @mousedown="onMouseDown"
      >
        <div class="flex items-center gap-3 mb-8 px-1">
          <div class="p-2.5 rounded-2xl text-white shadow-lg" :style="{ backgroundColor: color, boxShadow: `0 8px 20px -4px ${color}44` }">
            <Layout class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">{{ taskToEdit ? 'Editar' : 'Nova' }} Task</h2>
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Gerenciamento</p>
          </div>
        </div>

        <nav class="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            type="button"
            class="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
            :class="activeTab === tab.id 
              ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-slate-200 dark:ring-white/10' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'"
          >
            <component :is="tab.icon" class="w-4 h-4" :class="activeTab === tab.id ? tab.color : 'text-slate-400'" />
            <span class="text-xs font-bold whitespace-nowrap">{{ tab.label }}</span>
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

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950 relative">
        <!-- Close Button -->
        <button type="button" @click="emit('close')" class="absolute top-6 right-6 icon-btn z-20">
          <X class="w-5 h-5" />
        </button>

        <form @submit.prevent="submitTask" class="flex-1 flex flex-col overflow-hidden">
          <div class="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            <transition name="fade-slide" mode="out-in">
              <!-- ABA 1: Cadastro Básico -->
              <div v-if="activeTab === 'basic'" :key="'basic'" class="space-y-6">
                <div>
                  <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Informações Básicas</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 font-medium italic">Dados essenciais para identificação da tarefa.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div>
                    <label for="task-title" class="block mb-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Número da Tarefa</label>
                    <input id="task-title" v-model="title" type="text" placeholder="Ex: TSK-1234" required 
                      class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold"
                      :style="{ color: color }"
                    />
                  </div>

                  <div>
                    <label class="block mb-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Cor da Categoria</label>
                    <div class="flex gap-2 flex-wrap p-2 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl justify-between h-[50px] items-center">
                      <button v-for="c in colors" :key="c.value" type="button" @click="color = c.value"
                        class="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                        :style="{ backgroundColor: c.value }"
                        :class="color === c.value ? 'border-slate-800 dark:border-white scale-110 ring-4 ring-indigo-500/10' : 'border-transparent opacity-80'"
                        :title="c.name"
                      ></button>
                    </div>
                  </div>
                </div>

                <div>
                  <label for="task-desc" class="block mb-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Título da Tarefa</label>
                  <textarea id="task-desc" v-model="description" placeholder="O que você precisa fazer?" rows="2"
                    class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none font-medium"
                  ></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Sprint</label>
                    <div class="relative">
                      <Layers class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select v-model="sprintId" class="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer">
                        <option value="">Nenhuma Sprint</option>
                        <option v-for="sprint in taskStore.sprints" :key="sprint.id" :value="sprint.id">
                          Ciclo de {{ new Date(sprint.endDate).toLocaleDateString('pt-BR') }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Estimativa</label>
                      <div class="relative flex items-center group">
                        <Clock class="absolute left-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                        <input type="number" v-model="estimatedHours" min="0" placeholder="0" class="w-full pl-10 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        <span class="absolute right-3 text-[8px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">H</span>
                      </div>
                    </div>
                    <div>
                      <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Prioridade</label>
                      <select v-model="priority" class="w-full px-3 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer font-bold">
                        <option value="Baixa">Baixa</option>
                        <option value="Normal">Normal</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">Urgente</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ABA 2: Conectividade e Ambientes -->
              <div v-else-if="activeTab === 'links'" :key="'links'" class="space-y-8">
                <div>
                  <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Conectividade</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 font-medium italic">Gerenciamento de repositórios e acesso rápido aos ambientes.</p>
                </div>

                <div class="grid grid-cols-1 gap-8">
                  <!-- Seção: Gestão de Código -->
                  <div class="grid grid-cols-1 gap-6">
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-2 mb-1">
                        <ExternalLink class="w-3.5 h-3.5 text-indigo-500" />
                        <label class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Link da Tarefa</label>
                      </div>
                      <input v-model="taskUrl" type="url" placeholder="https://..." class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all shadow-sm" />
                    </div>
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-2 mb-1">
                        <GitBranch class="w-3.5 h-3.5 text-purple-500" />
                        <label class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">URL do Merge</label>
                      </div>
                      <input v-model="branchUrl" type="url" placeholder="https://..." class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all shadow-sm" />
                    </div>
                  </div>

                  <!-- Seção: Ambientes de Deploy -->
                  <div class="p-6 bg-slate-500/5 rounded-3xl border border-slate-500/10 space-y-6">
                    <div class="flex items-center gap-3 mb-2">
                      <Globe class="w-4 h-4 text-indigo-500" />
                      <h4 class="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em]">Fluxo de Ambientes (Pipeline)</h4>
                    </div>
                    
                    <div class="grid grid-cols-1 gap-6">
                      <div class="space-y-2">
                        <div class="flex items-center justify-between px-1">
                          <span class="text-[9px] font-black text-orange-500 uppercase tracking-widest">Desenvolvimento</span>
                          <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                        </div>
                        <input v-model="devUrl" type="url" placeholder="https://..." class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all shadow-sm" />
                      </div>
                      
                      <div class="space-y-2">
                         <div class="flex items-center justify-between px-1">
                          <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Homologação</span>
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        </div>
                        <input v-model="homologUrl" type="url" placeholder="https://..." class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all shadow-sm" />
                      </div>

                      <div class="space-y-2">
                         <div class="flex items-center justify-between px-1">
                          <span class="text-[9px] font-black text-blue-500 uppercase tracking-widest">Produção</span>
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                        </div>
                        <input v-model="prodUrl" type="url" placeholder="https://..." class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ABA 3: Documentação Técnica -->
              <div v-else-if="activeTab === 'data'" :key="'data'" class="space-y-6">
                <div>
                  <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Documentação Técnica</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 font-medium italic">Queries, observações e detalhes técnicos da implementação.</p>
                </div>

                <div class="space-y-6">
                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <Database class="w-4 h-4 text-indigo-500" />
                      <label class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Scripts de Banco (SQL)</label>
                    </div>
                    <textarea v-model="dbScripts" rows="4" placeholder="SELECT * FROM..." class="w-full px-4 py-3 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all resize-none"></textarea>
                  </div>

                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <FileText class="w-4 h-4 text-amber-500" />
                      <label class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Observações Adicionais</label>
                    </div>
                    <textarea v-model="moreInfo" rows="4" placeholder="Ponto de atenção, requisitos extras..." class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all resize-none"></textarea>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <!-- Footer (Persistent) -->
          <footer class="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex justify-end gap-3">
            <button type="button" @click="emit('close')" class="px-6 py-3 text-xs font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all uppercase tracking-widest">Cancelar</button>
            <button type="submit" class="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-xl shadow-indigo-500/25 disabled:opacity-50 uppercase tracking-widest flex items-center gap-2 active:scale-95" :disabled="!title.trim()">
              <Save v-if="taskToEdit" class="w-4 h-4" />
              <PlusCircle v-else class="w-4 h-4" />
              {{ taskToEdit ? 'Salvar Alterações' : 'Criar Nova Tarefa' }}
            </button>
          </footer>
        </form>
      </main>
    </div>
  </BaseModal>
</template>

<style scoped>
</style>
