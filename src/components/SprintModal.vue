<script setup>
import { ref } from 'vue';
import { X, Plus, Trash2, Calendar } from 'lucide-vue-next';
import { db } from '../db.js';
import { toast as sToast, confirm as sConfirm } from '../utils/swal.js';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const taskStore = useTaskStore();
const settings = useSettingsStore();

const props = defineProps({
  activeSprintId: [String, Number]
});

const emit = defineEmits(['close', 'updated', 'select-sprint']);

const newSprintDate = ref(null);
const showAddForm = ref(false);

const addSprint = async () => {
  if (!newSprintDate.value) return;
  
  try {
    // newSprintDate.value já é um objeto Date vindo do seletor
    const dateToSave = new Date(newSprintDate.value).toISOString();
    
    await db.sprints.add({
      endDate: dateToSave,
      createdAt: Date.now()
    });
    newSprintDate.value = null;
    showAddForm.value = false;
    await taskStore.loadSprints();
    sToast.fire({ icon: 'success', title: 'Sprint cadastrada!' });
    emit('updated');
  } catch (error) {
    console.error("Failed to add sprint:", error);
  }
};

const deleteSprint = async (id) => {
  const result = await sConfirm({
    title: 'Excluir Sprint',
    message: 'Isso não excluirá as tarefas associadas, mas removerá o vínculo. Continuar?',
    confirmText: 'Excluir',
    confirmButtonClass: 'btn btn-danger',
    type: 'danger'
  });

  if (result.isConfirmed) {
    try {
      await db.sprints.delete(id);
      await taskStore.loadSprints();
      sToast.fire({ icon: 'success', title: 'Sprint removida!' });
      emit('updated');
    } catch (error) {
      console.error("Failed to delete sprint:", error);
    }
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};
</script>

<template>
  <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.3s_ease-out]" @click.self="emit('close')">
    <section class="glass-panel w-[90%] max-w-sm p-0 animate-scaleIn overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Gerenciar Sprints</h2>
        <button class="icon-btn" @click="emit('close')">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto custom-scrollbar">
        <!-- Ação de Cadastrar Nova -->
        <button 
          @click="showAddForm = !showAddForm"
          class="w-full mb-6 btn btn-primary flex items-center justify-center gap-2 py-3 shadow-lg shadow-indigo-500/20"
        >
          <Plus class="w-5 h-5" />
          <span class="text-sm font-bold">Cadastrar Nova Sprint</span>
        </button>

        <!-- Formulário de Cadastro (Ocultável) -->
        <div v-show="showAddForm" class="mb-8 p-6 bg-indigo-500/5 dark:bg-white/5 rounded-2xl border border-indigo-500/20 animate-fadeIn space-y-4">
          <div class="input-group">
            <label class="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 ml-1">Data de Término</label>
            <!-- Removidas propriedades format e locale que causavam conflito interno no componente -->
            <VueDatePicker 
              v-model="newSprintDate" 
              :dark="settings.theme === 'dark'"
              placeholder="Clique para selecionar..."
              auto-apply
              :enable-time-picker="false"
              class="tass-datepicker"
            />
          </div>
          <div class="flex gap-2">
            <button @click="showAddForm = false" class="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">Cancelar</button>
            <button @click="addSprint" class="flex-1 btn btn-primary !py-2 text-xs font-black shadow-md shadow-indigo-500/10" :disabled="!newSprintDate">
              Salvar Sprint
            </button>
          </div>
        </div>

        <!-- Filtro / Listagem -->
        <div>
          <h3 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">Selecione para Filtrar</h3>
          <div class="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <!-- Opção Todas -->
            <button 
              @click="emit('select-sprint', 'all')"
              class="w-full flex justify-between items-center p-3 rounded-xl border transition-all"
              :class="activeSprintId === 'all' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-indigo-500/50'"
            >
              <span class="text-sm font-bold uppercase tracking-wide">Todas as Sprints</span>
            </button>

            <div 
              v-for="sprint in taskStore.sprints" 
              :key="sprint.id"
              class="group relative"
            >
              <button 
                @click="emit('select-sprint', sprint.id)"
                class="w-full flex justify-between items-center p-3 rounded-xl border transition-all"
                :class="activeSprintId == sprint.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-indigo-500/50'"
              >
                <div class="flex items-center gap-3">
                  <Calendar class="w-4 h-4 opacity-70" />
                  <span class="text-sm font-medium">Término: {{ formatDate(sprint.endDate) }}</span>
                </div>
              </button>
              <!-- Botão Excluir Flutuante -->
              <button 
                @click.stop="deleteSprint(sprint.id)" 
                class="absolute right-2 top-1/2 -translate-y-1/2 icon-btn !p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:!bg-red-500/20 hover:!text-red-500"
                :class="activeSprintId == sprint.id ? 'text-white' : 'text-slate-400'"
                title="Excluir Sprint"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Padronizado -->
      <footer class="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <button @click="emit('close')" class="w-full py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl transition-all">
          Terminei
        </button>
      </footer>
    </section>
  </div>
</template>

<style>
.tass-datepicker {
  --dp-border-radius: 12px;
  --dp-font-family: inherit;
}
.dark .tass-datepicker {
  --dp-background-color: #0f172a;
  --dp-border-color: rgba(255, 255, 255, 0.1);
}
</style>
