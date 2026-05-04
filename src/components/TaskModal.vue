<script setup>
import { ref, onMounted } from 'vue';
import { Save, PlusCircle, Clock, Layout, Settings2, ChevronDown } from 'lucide-vue-next';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import BaseModal from './BaseModal.vue';
import '@vuepic/vue-datepicker/dist/main.css';

const taskStore = useTaskStore();
const settings = useSettingsStore();

const props = defineProps({
  taskToEdit: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'add-task', 'save-task']);

const title = ref(props.taskToEdit ? props.taskToEdit.title : '');
const description = ref(props.taskToEdit ? props.taskToEdit.description : '');

// Advanced properties
const showAdvanced = ref(false);
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

// Time Picker State (Object for VueDatePicker)
const parseEstimatedTime = (timeStr) => {
  if (!timeStr) return { hours: 0, minutes: 0 };
  const h = timeStr.match(/(\d+)h/);
  const m = timeStr.match(/(\d+)m/);
  return {
    hours: h ? parseInt(h[1]) : 0,
    minutes: m ? parseInt(m[1]) : 0
  };
};

const estimatedTimeObj = ref(parseEstimatedTime(props.taskToEdit?.estimatedTime));

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
  
  const { hours, minutes } = estimatedTimeObj.value || { hours: 0, minutes: 0 };
  const timeStr = hours > 0 || minutes > 0 ? `${hours}h ${minutes}m` : '';

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
    :title="taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa'" 
    maxWidth="max-w-2xl" 
    @close="emit('close')"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-2xl text-white shadow-lg" :style="{ backgroundColor: color, boxShadow: `0 8px 20px -4px ${color}44` }">
          <Layout class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-none">{{ taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa' }}</h2>
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detalhamento da Task</p>
        </div>
      </div>
    </template>

    <form @submit.prevent="submitTask" class="flex flex-col gap-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <label for="task-title" class="block mb-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Número da Tarefa</label>
          <input 
            id="task-title" 
            v-model="title" 
            type="text" 
            placeholder="Ex: TSK-1234" 
            required 
            class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold"
            :style="{ color: color }"
          />
        </div>

        <div>
          <label class="block mb-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Cor da Categoria</label>
          <div class="flex gap-2 flex-wrap p-2 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl justify-between h-[50px] items-center">
            <button 
              v-for="c in colors" 
              :key="c.value"
              type="button"
              @click="color = c.value"
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
        <textarea 
          id="task-desc" 
          v-model="description" 
          placeholder="O que você precisa fazer?"
          rows="2"
          class="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
        ></textarea>
      </div>

      <div class="mt-2">
        <button 
          type="button" 
          @click="showAdvanced = !showAdvanced"
          class="w-full flex items-center justify-between p-4 bg-slate-500/5 hover:bg-slate-500/10 border border-slate-500/20 rounded-2xl transition-all group"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
              <Settings2 class="w-5 h-5" />
            </div>
            <div class="text-left">
              <span class="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">Mais Opções Avançadas</span>
              <span class="text-[9px] text-slate-500 font-medium">Links, Prazos e Ambientes</span>
            </div>
          </div>
          <div class="w-8 h-8 rounded-full bg-white dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm transition-transform duration-300" :class="{ 'rotate-180': showAdvanced }">
            <ChevronDown class="w-4 h-4 text-slate-400" />
          </div>
        </button>
      </div>

      <div v-show="showAdvanced" class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn pt-2">
        
        <div class="md:col-span-1">
          <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Sprint</label>
          <select 
            v-model="sprintId"
            class="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer"
          >
            <option value="">Nenhuma Sprint</option>
            <option v-for="sprint in taskStore.sprints" :key="sprint.id" :value="sprint.id">
              Até {{ new Date(sprint.endDate).toLocaleDateString('pt-BR') }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3 md:col-span-1">
          <div>
            <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Estimativa</label>
            <VueDatePicker 
              v-model="estimatedTimeObj" 
              time-picker 
              placeholder="00:00"
              auto-apply
              :dark="settings.theme === 'dark'"
              class="tass-timepicker"
            >
              <template #input-icon>
                <Clock class="w-4 h-4 ml-2 text-slate-400" />
              </template>
            </VueDatePicker>
          </div>
          <div>
            <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Prioridade</label>
            <select v-model="priority" class="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer">
              <option value="Baixa">Baixa</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
        </div>

        <div class="md:col-span-1">
          <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Link da Tarefa</label>
          <input v-model="taskUrl" type="url" placeholder="https://..." class="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all" />
        </div>

        <div class="md:col-span-1">
          <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Link da Branch</label>
          <input v-model="branchUrl" type="url" placeholder="https://..." class="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all" />
        </div>

        <div class="md:col-span-2 grid grid-cols-3 gap-3">
          <div>
            <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 text-orange-500">Desenvolvimento</label>
            <input v-model="devUrl" type="url" placeholder="https://..." class="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all" />
          </div>
          <div>
            <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 text-emerald-500">Homologação</label>
            <input v-model="homologUrl" type="url" placeholder="https://..." class="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all" />
          </div>
          <div>
            <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 text-blue-500">Produção</label>
            <input v-model="prodUrl" type="url" placeholder="https://..." class="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all" />
          </div>
        </div>
        
        <div class="md:col-span-2">
          <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Scripts de Banco</label>
          <textarea v-model="dbScripts" rows="2" placeholder="Queries SQL..." class="w-full px-3 py-2 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all resize-y"></textarea>
        </div>

        <div class="md:col-span-2">
          <label class="block mb-1.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Observações</label>
          <textarea v-model="moreInfo" rows="2" placeholder="Mais detalhes..." class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 text-sm transition-all resize-y"></textarea>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-4">
        <button type="button" class="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all" @click="emit('close')">Cancelar</button>
        <button type="submit" class="px-8 py-3 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-widest active:scale-95 disabled:opacity-50" :disabled="!title.trim()">
          <Save v-if="taskToEdit" class="w-4 h-4 mr-2 inline" />
          <PlusCircle v-else class="w-4 h-4 mr-2 inline" />
          {{ taskToEdit ? 'Salvar Tarefa' : 'Criar Tarefa' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<style>
.tass-timepicker {
  --dp-border-radius: 12px;
  --dp-input-padding: 11px 12px 11px 40px;
  --dp-font-size: 14px;
  --dp-background-color: #ffffff;
  --dp-text-color: #1e293b;
  --dp-border-color: #e2e8f0;
}

.dark .tass-timepicker {
  --dp-background-color: #0f172a; /* slate-900 */
  --dp-text-color: #f1f5f9;
  --dp-border-color: rgba(255, 255, 255, 0.1);
  --dp-hover-color: rgba(255, 255, 255, 0.05);
  --dp-hover-text-color: #ffffff;
  --dp-primary-color: #6366f1; /* indigo-500 */
  --dp-primary-text-color: #ffffff;
  --dp-menu-border-color: rgba(255, 255, 255, 0.1);
}

.dp__theme_dark {
  --dp-background-color: #0f172a !important;
  --dp-border-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
