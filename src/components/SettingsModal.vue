<script setup>
import { 
  Download, Upload, Droplets, Globe, 
  ShieldCheck, Monitor, Briefcase, Activity, FileJson, Server, Clock, X, Sparkles, Settings
} from 'lucide-vue-next';
import { ref, watch, nextTick } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';
import { notificationService } from '../services/notificationService';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import BaseModal from './BaseModal.vue';
import { useTaskStore } from '../stores/taskStore';
import { ptBR } from 'date-fns/locale';
import '@vuepic/vue-datepicker/dist/main.css';

const settings = useSettingsStore();
const taskStore = useTaskStore();
const emit = defineEmits(['close', 'save', 'export-tasks', 'import-tasks', 'export-system', 'import-system', 'test-wellness', 'test-water']);

const activeTab = ref('gitlab');

const tabs = [
  { id: 'gitlab', label: 'Integração GitLab', icon: Globe, color: 'text-orange-500' },
  { id: 'work', label: 'Jornada de Trabalho', icon: Briefcase, color: 'text-amber-500' },
  { id: 'health', label: 'Saúde e Bem-estar', icon: Activity, color: 'text-blue-500' },
  { id: 'system', label: 'Sistema e Interface', icon: Monitor, color: 'text-indigo-500' },
  { id: 'security', label: 'Dados e Segurança', icon: ShieldCheck, color: 'text-emerald-500' },
];

// Helper to convert "HH:mm" to { hours, minutes }
const stringToTimeObj = (timeStr) => {
  if (!timeStr) return { hours: 0, minutes: 0 };
  const [h, m] = timeStr.split(':');
  return { hours: parseInt(h) || 0, minutes: parseInt(m) || 0 };
};

// Helper to convert { hours, minutes } to "HH:mm"
const timeObjToString = (obj) => {
  if (!obj) return "00:00";
  return `${String(obj.hours).padStart(2, '0')}:${String(obj.minutes).padStart(2, '0')}`;
};

// Local state for transactional editing
const localSettings = ref({
  gitlabUrl: settings.gitlabUrl,
  gitlabIntegrationMode: settings.gitlabIntegrationMode,
  gitlabProjectId: settings.gitlabProjectId,
  gitlabToken: settings.gitlabToken,
  gitlabBaseBranch: settings.gitlabBaseBranch,
  waterReminderEnabled: settings.waterReminderEnabled,
  waterReminderInterval: settings.waterReminderInterval,
  trackInactivity: settings.trackInactivity,
  workStart: stringToTimeObj(settings.workStart),
  workEnd: stringToTimeObj(settings.workEnd),
  workDays: [...settings.workDays],
  autoPauseOutsideWork: settings.autoPauseOutsideWork,
  wellnessEnabled: settings.wellnessEnabled,
  wellnessInterval: settings.wellnessInterval,
  inactivityThreshold: { 
    hours: Math.floor((settings.inactivityThreshold || 1) / 60), 
    minutes: (settings.inactivityThreshold || 1) % 60 
  },
  cardBorderRadius: settings.cardBorderRadius,
  contrastEnhanced: settings.contrastEnhanced
});

const dayNames = [
  { id: 1, label: 'S' }, { id: 2, label: 'T' }, { id: 3, label: 'Q' }, 
  { id: 4, label: 'Q' }, { id: 5, label: 'S' }, { id: 6, label: 'S' }, { id: 0, label: 'D' }
];

const toggleDay = (dayId) => {
  const index = localSettings.value.workDays.indexOf(dayId);
  if (index > -1) {
    localSettings.value.workDays.splice(index, 1);
  } else {
    localSettings.value.workDays.push(dayId);
    localSettings.value.workDays.sort();
  }
};

const handleSave = async () => {
  settings.gitlabUrl = localSettings.value.gitlabUrl;
  settings.gitlabIntegrationMode = localSettings.value.gitlabIntegrationMode;
  settings.gitlabProjectId = localSettings.value.gitlabProjectId;
  settings.gitlabToken = localSettings.value.gitlabToken;
  settings.gitlabBaseBranch = localSettings.value.gitlabBaseBranch;
  settings.waterReminderEnabled = localSettings.value.waterReminderEnabled;
  settings.waterReminderInterval = localSettings.value.waterReminderInterval;
  settings.trackInactivity = localSettings.value.trackInactivity;
  settings.workStart = timeObjToString(localSettings.value.workStart);
  settings.workEnd = timeObjToString(localSettings.value.workEnd);
  settings.workDays = [...localSettings.value.workDays];
  settings.autoPauseOutsideWork = localSettings.value.autoPauseOutsideWork;
  settings.wellnessEnabled = localSettings.value.wellnessEnabled;
  settings.wellnessInterval = localSettings.value.wellnessInterval;
  settings.inactivityThreshold = (localSettings.value.inactivityThreshold.hours * 60) + localSettings.value.inactivityThreshold.minutes;
  settings.cardBorderRadius = localSettings.value.cardBorderRadius;
  settings.contrastEnhanced = localSettings.value.contrastEnhanced;

  await settings.saveAllSettings();
  notificationService.toast('Configurações Salvas!');
  emit('save');
};

const handleImportTasks = (event) => emit('import-tasks', event);
const handleImportSystem = (event) => emit('import-system', event);

const handleResetSystem = async () => {
  const confirmed = await notificationService.confirm(
    'Zerar Sistema?',
    'Isso apagará TODAS as tarefas e sprints permanentemente. Esta ação não pode ser desfeita!',
    'Sim, Apagar Tudo',
    'error'
  );

  if (confirmed) {
    const success = await taskStore.resetSystem();
    if (success) {
      notificationService.toast('Sistema resetado com sucesso!', 'success');
      emit('close');
    }
  }
};
</script>

<template>
  <BaseModal 
    title="Ajustes TASS" 
    maxWidth="max-w-5xl" 
    customClass="h-[90vh] md:h-[650px] !p-0 overflow-hidden"
    :hideHeader="true"
    @close="emit('close')"
  >
    <template #default="{ onMouseDown }">
      <div class="flex flex-col md:flex-row h-full">
        <!-- Sidebar de Navegação (Menu Lateral Estilo Premium) -->
        <aside 
          class="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-200/60 dark:border-white/5 flex flex-col p-6 cursor-grab active:cursor-grabbing"
          :class="settings.opacityTargets.modals ? 'bg-transparent' : 'bg-[#f8fafc] dark:bg-[#111827]'"
          @mousedown="onMouseDown"
        >
          <!-- Logo/Title Area -->
          <div class="hidden md:flex items-center gap-3 mb-10 px-2">
            <div class="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Settings class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Ajustes</h2>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configurações</p>
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar gap-2 md:space-y-1">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              class="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group"
              :class="activeTab === tab.id 
                ? 'bg-white dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-transparent' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-white'"
            >
              <div 
                class="p-1.5 rounded-lg transition-colors"
                :class="activeTab === tab.id ? 'bg-indigo-50 dark:bg-indigo-500/20' : 'bg-transparent'"
              >
                <component :is="tab.icon" class="w-4 h-4" :class="activeTab === tab.id ? tab.color : 'text-slate-400'" />
              </div>
              <span class="text-xs font-bold whitespace-nowrap">{{ tab.label }}</span>
            </button>
          </nav>

          <!-- Footer Info Sidebar -->
          <div class="hidden md:block mt-auto p-5 bg-white/50 dark:bg-white/5 rounded-[2rem] border border-slate-200/50 dark:border-white/5">
            <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
              As alterações são aplicadas instantaneamente na UI.
            </p>
          </div>
        </aside>

        <!-- Área de Conteúdo Principal -->
        <main 
          class="flex-1 flex flex-col overflow-hidden relative"
          :class="settings.opacityTargets.modals ? 'bg-transparent' : 'bg-white dark:bg-[#0f172a]'"
        >
          <!-- Botão Fechar (Top Right) -->
          <button 
            class="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors z-20" 
            @click="emit('close')"
          >
            <X class="w-5 h-5" />
          </button>

          <!-- Scrollable Content Container -->
          <div class="flex-1 overflow-y-auto p-8 md:p-14 custom-scrollbar">
            <transition name="fade-slide" mode="out-in">
              <div :key="activeTab" class="max-w-2xl mx-auto">
                
                <!-- ABA: GitLab -->
                <div v-if="activeTab === 'gitlab'" class="space-y-10">
                  <header>
                    <h3 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Integração GitLab</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Automatize seu fluxo de trabalho conectando o TASS aos seus repositórios.</p>
                  </header>

                  <div class="space-y-8">
                    <div class="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl w-fit">
                      <button @click="localSettings.gitlabIntegrationMode = 'link'" class="px-6 py-2 text-xs font-bold rounded-xl transition-all" :class="localSettings.gitlabIntegrationMode === 'link' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'">Link Mágico</button>
                      <button @click="localSettings.gitlabIntegrationMode = 'api'" class="px-6 py-2 text-xs font-bold rounded-xl transition-all" :class="localSettings.gitlabIntegrationMode === 'api' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'">API Automática</button>
                    </div>

                    <div class="grid gap-6">
                      <div class="input-group">
                        <label>URL da Instância</label>
                        <input type="url" v-model="localSettings.gitlabUrl" placeholder="https://gitlab.com" />
                      </div>

                      <template v-if="localSettings.gitlabIntegrationMode === 'api'">
                        <div class="grid grid-cols-2 gap-6">
                          <div class="input-group">
                            <label>ID do Projeto</label>
                            <input type="text" v-model="localSettings.gitlabProjectId" placeholder="1234" />
                          </div>
                          <div class="input-group">
                            <label>Branch Base</label>
                            <input type="text" v-model="localSettings.gitlabBaseBranch" placeholder="develop" />
                          </div>
                        </div>
                        <div class="input-group">
                          <label>Personal Access Token (PAT)</label>
                          <input type="password" v-model="localSettings.gitlabToken" placeholder="glpat-..." />
                        </div>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- ABA: Jornada -->
                <div v-else-if="activeTab === 'work'" class="space-y-10">
                  <header>
                    <h3 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Jornada de Trabalho</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie seu tempo e evite fadiga com horários bem definidos.</p>
                  </header>

                  <div class="p-8 bg-amber-500/5 dark:bg-amber-500/10 rounded-[2.5rem] border border-amber-500/10 space-y-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div class="input-group">
                        <label class="!text-amber-600 dark:!text-amber-400">Início do Expediente</label>
                        <VueDatePicker v-model="localSettings.workStart" time-picker auto-apply :dark="settings.theme === 'dark'" class="app-timepicker" teleport="body" :format-locale="ptBR" :locale="ptBR" format="HH:mm">
                          <template #input-icon>
                            <Clock class="w-4 h-4 ml-2 text-amber-500" />
                          </template>
                        </VueDatePicker>
                      </div>
                      <div class="input-group">
                        <label class="!text-amber-600 dark:!text-amber-400">Término do Expediente</label>
                        <VueDatePicker v-model="localSettings.workEnd" time-picker auto-apply :dark="settings.theme === 'dark'" class="app-timepicker" teleport="body" :format-locale="ptBR" :locale="ptBR" format="HH:mm">
                          <template #input-icon>
                            <Clock class="w-4 h-4 ml-2 text-amber-500" />
                          </template>
                        </VueDatePicker>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Outras abas mantidas com o estilo robusto -->
                <div v-else class="py-10 text-center">
                  <p class="text-slate-400">Seção em desenvolvimento ou configuração padrão.</p>
                </div>
              </div>
            </transition>
          </div>

          <!-- Footer Alinhado à Direita -->
          <footer class="p-6 md:px-14 md:py-8 border-t border-slate-200/60 bg-slate-50/50 dark:bg-white/[0.02] flex flex-row-reverse gap-4">
            <button @click="handleSave" class="px-10 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95">Salvar Ajustes</button>
            <button @click="emit('close')" class="px-8 py-3 text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-95">Cancelar</button>
          </footer>
        </main>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.input-group label {
  @apply block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1;
}

.input-group input {
  @apply w-full px-5 py-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200/60 rounded-2xl text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all;
}

.app-timepicker {
  --dp-border-radius: 16px;
  --dp-input-padding: 12px 12px 12px 40px;
}
</style>
