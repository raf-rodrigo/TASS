<script setup>
import { ref } from 'vue';
import { 
  Download, Upload, Droplets, Globe, 
  ShieldCheck, Monitor, Briefcase, Activity, FileJson, Server
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { notificationService } from '../services/notificationService';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import BaseModal from './BaseModal.vue';
import '@vuepic/vue-datepicker/dist/main.css';

const settings = useSettingsStore();
const emit = defineEmits(['close', 'save', 'export-tasks', 'import-tasks', 'export-system', 'import-system']);

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
  formatText: settings.formatText,
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
  autoPauseOutsideWork: settings.autoPauseOutsideWork
});

const dayNames = [
  { id: 0, label: 'D' }, { id: 1, label: 'S' }, { id: 2, label: 'T' }, 
  { id: 3, label: 'Q' }, { id: 4, label: 'Q' }, { id: 5, label: 'S' }, { id: 6, label: 'S' }
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

const handleWaterToggle = async () => {
  if (localSettings.value.waterReminderEnabled) {
    const granted = await notificationService.requestPermission();
    if (!granted) {
      notificationService.alert('Notificações Bloqueadas', 'Permita as notificações para receber os lembretes.', 'warning');
      localSettings.value.waterReminderEnabled = false;
    }
  }
};

const handleTestNotification = async () => {
  notificationService.notify('Teste TASK 💧', 'Sua notificação está funcionando!');
  notificationService.toast('Teste Disparado! 💧');
};

const handleSave = async () => {
  settings.formatText = localSettings.value.formatText;
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

  await settings.saveAllSettings();
  notificationService.toast('Configurações Salvas!');
  emit('save');
};

const handleImportTasks = (event) => emit('import-tasks', event);
const handleImportSystem = (event) => emit('import-system', event);
</script>

<template>
  <BaseModal 
    title="Ajustes TASS" 
    maxWidth="max-w-4xl" 
    customClass="h-[90vh] md:h-[600px] !p-0"
    @close="emit('close')"
  >
    <template #header>
      <!-- Overriding default header to show sidebar integration better -->
      <div class="hidden"></div>
    </template>

    <div class="flex flex-col md:flex-row h-full overflow-hidden">
      <!-- Sidebar de Abas -->
      <aside class="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col p-4">
        <div class="hidden md:flex items-center gap-3 px-2 mb-8">
          <div class="p-2 bg-indigo-500 rounded-xl text-white">
            <Monitor class="w-5 h-5" />
          </div>
          <h2 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">Ajustes TASS</h2>
        </div>

        <nav class="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar gap-1 md:space-y-1 pb-2 md:pb-0">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex-shrink-0 flex items-center gap-3 px-4 md:px-3 py-2 md:py-2.5 rounded-xl transition-all group"
            :class="activeTab === tab.id 
              ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-slate-200 dark:ring-white/10' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'"
          >
            <component :is="tab.icon" class="w-4 h-4" :class="activeTab === tab.id ? tab.color : 'text-slate-400'" />
            <span class="text-[11px] md:text-xs font-bold whitespace-nowrap">{{ tab.label }}</span>
          </button>
        </nav>

        <div class="hidden md:block p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 mt-auto">
          <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
            Confirme as alterações no botão abaixo para persistir no banco de dados.
          </p>
        </div>
      </aside>

      <!-- Conteúdo da Aba -->
      <main class="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden relative">
        <div class="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <transition name="fade-slide" mode="out-in">
            <!-- ABA: GitLab -->
            <div v-if="activeTab === 'gitlab'" :key="'gitlab'" class="space-y-8">
              <div>
                <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Integração GitLab</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Conecte o TASS aos seus projetos e automatize seu workflow.</p>
              </div>

              <div class="space-y-6">
                <div class="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-fit">
                  <button @click="localSettings.gitlabIntegrationMode = 'link'" class="px-6 py-1.5 text-xs font-bold rounded-lg transition-all" :class="localSettings.gitlabIntegrationMode === 'link' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'">Link Mágico</button>
                  <button @click="localSettings.gitlabIntegrationMode = 'api'" class="px-6 py-1.5 text-xs font-bold rounded-lg transition-all" :class="localSettings.gitlabIntegrationMode === 'api' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'">API Automática</button>
                </div>

                <div class="grid gap-4">
                  <div class="input-group">
                    <label>URL da Instância</label>
                    <input type="url" v-model="localSettings.gitlabUrl" placeholder="https://gitlab.com" />
                  </div>

                  <template v-if="localSettings.gitlabIntegrationMode === 'api'">
                    <div class="grid grid-cols-2 gap-4">
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
            <div v-else-if="activeTab === 'work'" :key="'work'" class="space-y-8">
              <div>
                <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Jornada de Trabalho</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Defina seu horário para evitar registros de tempo fora do expediente.</p>
              </div>

              <div class="p-6 bg-amber-500/5 dark:bg-amber-500/10 rounded-3xl border border-amber-500/10 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div class="input-group">
                    <label class="!text-amber-600 dark:!text-amber-400">Início</label>
                    <VueDatePicker v-model="localSettings.workStart" time-picker auto-apply :dark="settings.theme === 'dark'" class="tass-timepicker" />
                  </div>
                  <div class="input-group">
                    <label class="!text-amber-600 dark:!text-amber-400">Término</label>
                    <VueDatePicker v-model="localSettings.workEnd" time-picker auto-apply :dark="settings.theme === 'dark'" class="tass-timepicker" />
                  </div>
                </div>

                <div class="space-y-3">
                  <label class="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dias Ativos</label>
                  <div class="flex flex-wrap gap-2">
                    <button v-for="day in dayNames" :key="day.id" @click="toggleDay(day.id)"
                      class="w-10 h-10 rounded-xl text-xs font-black transition-all border"
                      :class="localSettings.workDays.includes(day.id) ? 'bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-400'">
                      {{ day.label }}
                    </button>
                  </div>
                </div>

                <label class="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl cursor-pointer border border-amber-500/10">
                  <div>
                    <p class="text-sm font-bold text-slate-700 dark:text-slate-200">Pausa Automática</p>
                    <p class="text-[10px] text-slate-500">Pausar tarefas ao atingir o horário de término.</p>
                  </div>
                  <div class="relative inline-flex items-center">
                    <input type="checkbox" class="sr-only peer" v-model="localSettings.autoPauseOutsideWork">
                    <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </div>
                </label>
              </div>
            </div>

            <!-- ABA: Saúde -->
            <div v-else-if="activeTab === 'health'" :key="'health'" class="space-y-8">
              <div>
                <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Saúde e Bem-estar</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Lembretes inteligentes para você se manter saudável enquanto produz.</p>
              </div>

              <div class="p-6 bg-blue-500/5 dark:bg-blue-500/10 rounded-3xl border border-blue-500/10 space-y-6">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="p-3 bg-blue-500 rounded-2xl text-white">
                      <Droplets class="w-6 h-6" />
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-700 dark:text-slate-200">Alerta de Hidratação</p>
                      <p class="text-[10px] text-slate-500">Lembrete para beber água periodicamente.</p>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" v-model="localSettings.waterReminderEnabled" @change="handleWaterToggle">
                    <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                <div v-if="localSettings.waterReminderEnabled" class="space-y-4 pt-4 border-t border-blue-500/10">
                  <div class="flex justify-between">
                    <span class="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">Intervalo</span>
                    <span class="text-sm font-black text-slate-700 dark:text-slate-200">{{ localSettings.waterReminderInterval }} min</span>
                  </div>
                  <input type="range" v-model.number="localSettings.waterReminderInterval" min="5" max="180" step="5" class="w-full accent-blue-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none" />
                  <button @click="handleTestNotification" class="text-[10px] font-bold text-blue-500 hover:underline">Testar Alerta</button>
                </div>
              </div>
            </div>

            <!-- ABA: Sistema -->
            <div v-else-if="activeTab === 'system'" :key="'system'" class="space-y-8">
              <div>
                <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Sistema e Interface</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Configurações globais de comportamento e automação.</p>
              </div>

              <div class="space-y-4">
                <label class="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl cursor-pointer border border-slate-200 dark:border-white/10 group">
                  <div>
                    <p class="text-sm font-bold text-slate-700 dark:text-slate-200">Formatar Branches</p>
                    <p class="text-[10px] text-slate-500">Normalizar títulos para criação de branches.</p>
                  </div>
                  <div class="relative inline-flex items-center">
                    <input type="checkbox" class="sr-only peer" v-model="localSettings.formatText">
                    <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </div>
                </label>

                <label class="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl cursor-pointer border border-slate-200 dark:border-white/10 group">
                  <div>
                    <p class="text-sm font-bold text-slate-700 dark:text-slate-200">Track de Inatividade</p>
                    <p class="text-[10px] text-slate-500">Detectar automaticamente quando o PC estiver ocioso.</p>
                  </div>
                  <div class="relative inline-flex items-center">
                    <input type="checkbox" class="sr-only peer" v-model="localSettings.trackInactivity">
                    <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </div>
                </label>
              </div>
            </div>

            <!-- ABA: Segurança -->
            <div v-else-if="activeTab === 'security'" :key="'security'" class="space-y-8">
              <div>
                <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1">Dados e Segurança</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Gerencie seu banco de dados local com backups parciais ou totais.</p>
              </div>

              <div class="space-y-6">
                <!-- Backup de Tarefas -->
                <div class="p-6 bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4">
                  <div class="flex items-center gap-3 mb-2">
                    <FileJson class="w-5 h-5 text-indigo-500" />
                    <h4 class="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Backup de Tarefas</h4>
                  </div>
                  <p class="text-[11px] text-slate-500 leading-relaxed mb-4">Exporta apenas a sua lista de tarefas atual. Ideal para transferências rápidas ou backups frequentes.</p>
                  <div class="flex flex-col sm:flex-row gap-3">
                    <button @click="emit('export-tasks')" class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-indigo-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-white/10">
                      <Download class="w-4 h-4" /> Exportar Tarefas
                    </button>
                    <label class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-emerald-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-white/10 cursor-pointer text-center">
                      <Upload class="w-4 h-4" /> Importar Tarefas
                      <input type="file" accept=".json" class="hidden" @change="handleImportTasks" />
                    </label>
                  </div>
                </div>

                <!-- Backup Completo do Sistema -->
                <div class="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-3xl border border-emerald-500/20 space-y-4 relative overflow-hidden">
                  <div class="absolute top-0 right-0 p-4 opacity-5">
                    <Server class="w-20 h-20" />
                  </div>
                  <div class="flex items-center gap-3 mb-2">
                    <ShieldCheck class="w-5 h-5 text-emerald-500" />
                    <h4 class="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Sistema Completo</h4>
                  </div>
                  <p class="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4">Exporta <b>absolutamente tudo</b>: tarefas, sprints, notas rápidas e todas as suas configurações de interface e jornada.</p>
                  <div class="flex flex-col sm:flex-row gap-3">
                    <button @click="emit('export-system')" class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20">
                      <Download class="w-4 h-4" /> Exportar Tudo
                    </button>
                    <label class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer text-center">
                      <Upload class="w-4 h-4" /> Restaurar Sistema
                      <input type="file" accept=".json" class="hidden" @change="handleImportSystem" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Footer Manual -->
        <footer class="p-4 md:p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col md:flex-row gap-2 md:gap-4">
          <button @click="emit('close')" class="flex-1 px-6 py-2.5 md:py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 rounded-2xl transition-all">Terminei</button>
          <button @click="handleSave" class="flex-2 px-12 py-2.5 md:py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-xl shadow-indigo-500/20">Salvar Alterações</button>
        </footer>
      </main>
    </div>
  </BaseModal>
</template>

<style scoped>
.input-group label {
  @apply block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1;
}

.input-group input {
  @apply w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all;
}

.tass-timepicker {
  --dp-border-radius: 12px;
}
</style>
