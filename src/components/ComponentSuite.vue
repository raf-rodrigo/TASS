<script setup>
import { ref, computed } from 'vue';
import { 
  Palette, MousePointer2, Type, Box, Layers, 
  ChevronRight, Info, AlertTriangle, CheckCircle2, 
  XCircle, ArrowLeft, ExternalLink, Database, 
  Clock, Plus, Settings, MessageSquare, StickyNote,
  Sun, Moon, Layout, Activity, User, Loader2, HelpCircle
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { notificationService } from '../services/notificationService';

// Base Components
import AppInput from '../components/base/AppInput.vue';
import AppTextarea from '../components/base/AppTextarea.vue';
import AppTimePicker from '../components/base/AppTimePicker.vue';
import AppSelect from '../components/base/AppSelect.vue';
import AppSwitch from '../components/base/AppSwitch.vue';
import AppRadio from '../components/base/AppRadio.vue';
import AppBadge from '../components/base/AppBadge.vue';
import AppProgressBar from '../components/base/AppProgressBar.vue';
import AppAvatar from '../components/base/AppAvatar.vue';
import AppSkeleton from '../components/base/AppSkeleton.vue';

const settings = useSettingsStore();
const emit = defineEmits(['close']);

const activeTab = ref('inputs');

const tabs = [
  { id: 'inputs', label: 'Inputs & Forms', icon: Type },
  { id: 'buttons', label: 'Botões & Cliques', icon: MousePointer2 },
  { id: 'elements', label: 'Elementos UI', icon: Box },
  { id: 'modals', label: 'Modais & Feedbacks', icon: Layers },
  { id: 'visuals', label: 'Design System', icon: Palette }
];

// Form States
const textInput = ref('');
const textError = ref('Este campo é obrigatório');
const selectValue = ref('1');
const selectOptions = [
  { label: 'Alta Prioridade', value: '1' },
  { label: 'Média Prioridade', value: '2' },
  { label: 'Baixa Prioridade', value: '3' }
];
const switchValue = ref(true);
const radioValue = ref('a');

// Progress State para exemplo animado
const demoProgress = ref(65);

// Feedback Handlers
const showToast = (type) => {
  notificationService.toast(`Isto é um alerta de ${type}!`, type);
};

const showAlert = (type) => {
  if (type === 'success') {
    notificationService.alert('Operação Concluída', 'Seus dados foram salvos com sucesso no TASS.', 'success');
  } else if (type === 'error') {
    notificationService.alert('Erro Crítico', 'Não foi possível conectar ao servidor. Verifique sua conexão.', 'error');
  } else if (type === 'warning') {
    notificationService.confirm('Atenção!', 'Você está prestes a excluir todos os dados. Tem certeza?', 'Sim, Excluir', 'warning');
  }
};

const goBack = () => {
  emit('close');
};

const toggleTheme = () => {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  settings.saveSetting('app-theme', settings.theme);
  document.documentElement.classList.toggle('dark', settings.theme === 'dark');
};
</script>

<template>
  <div class="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans text-app-main overflow-y-auto custom-scrollbar">
    
    <!-- HEADER DA SUÍTE -->
    <header class="sticky top-0 z-50 glass-panel border-b border-app-border-light px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <button @click="goBack" class="p-2.5 hover:bg-indigo-500/10 text-indigo-500 rounded-2xl transition-all group">
          <ArrowLeft class="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-lg font-black text-app-main uppercase tracking-tighter">TASS Component Suite</h1>
            <span class="px-2 py-0.5 bg-indigo-500 text-[9px] font-black text-white rounded-full uppercase tracking-widest">v1.0</span>
          </div>
          <p class="text-[10px] text-app-muted font-bold uppercase tracking-widest">Guia de Padronização Visual e Interativa</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="toggleTheme" class="p-2.5 rounded-2xl bg-app-surface border border-app-border-light text-app-sub hover:text-indigo-500 transition-all shadow-sm">
          <component :is="settings.theme === 'dark' ? Sun : Moon" class="w-5 h-5" />
        </button>
        <div class="h-8 w-px bg-app-border-light mx-2"></div>
        <button @click="goBack" class="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-indigo-500/25">
          <span>VOLTAR AO WORKSPACE</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </button>
      </div>
    </header>

    <div class="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 p-6 md:p-10">
      
      <!-- SIDEBAR DE NAVEGAÇÃO -->
      <aside class="w-full md:w-64 space-y-2 shrink-0">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border group"
          :class="activeTab === tab.id 
            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
            : 'bg-white dark:bg-white/5 border-app-border-light text-app-sub hover:border-indigo-500/50'"
        >
          <component :is="tab.icon" class="w-5 h-5" :class="activeTab === tab.id ? 'text-white' : 'text-indigo-500'" />
          <span class="text-sm font-black uppercase tracking-tight">{{ tab.label }}</span>
          <ChevronRight v-if="activeTab === tab.id" class="w-4 h-4 ml-auto" />
        </button>

        <div class="mt-10 p-5 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
          <h4 class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Diretriz Técnica</h4>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Todos os componentes devem respeitar o <span class="text-indigo-500 font-bold">Zero Hardcoded</span>, utilizando apenas tokens do Tailwind configurados em <code class="text-[9px] bg-indigo-500/10 px-1 rounded">tailwind.config.js</code>.
          </p>
        </div>
      </aside>

      <!-- ÁREA DE CONTEÚDO -->
      <main class="flex-1 space-y-12">
        
        <!-- SEÇÃO: INPUTS -->
        <section v-if="activeTab === 'inputs'" class="animate-fadeIn space-y-8">
          <header>
            <h2 class="text-2xl font-black text-app-main tracking-tighter uppercase">Inputs & Formulários</h2>
            <p class="text-sm text-app-muted font-medium">Campos de entrada padronizados com suporte a validação e estados.</p>
          </header>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="glass-panel p-8 space-y-6">
              <h3 class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Box class="w-4 h-4" /> Componente: AppInput
              </h3>
              
              <AppInput v-model="textInput" label="Texto Padrão" placeholder="Digite algo..." :icon="Type" />
              <AppInput v-model="textInput" label="Estado de Erro" placeholder="Campo com problema" :icon="AlertTriangle" :error="textError" />
              <AppInput v-model="textInput" label="Campo de URL" placeholder="https://..." :icon="ExternalLink" type="url" />
            </div>

            <div class="glass-panel p-8 space-y-6">
              <h3 class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Box class="w-4 h-4" /> Seleção & Texto Longo
              </h3>

              <AppSelect v-model="selectValue" label="Select Customizado" :options="selectOptions" :icon="Layers" />
              <AppTextarea v-model="textInput" label="Observações Adicionais" placeholder="Descreva os detalhes aqui..." :icon="StickyNote" />
            </div>

            <div class="glass-panel p-8 space-y-8 col-span-1 md:col-span-2">
              <h3 class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Box class="w-4 h-4" /> Checks & Toggles (Chaves)
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div class="space-y-4">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Toggles Deslizantes (Switch)</p>
                  <div class="flex flex-col gap-5 max-w-sm">
                    <AppSwitch v-model="switchValue" label="Notificações de Sistema" description="Ativa alertas visuais na área de trabalho." />
                    <AppSwitch :modelValue="true" label="Modo Imersivo" description="Oculta elementos secundários durante o foco." activeColor="peer-checked:bg-emerald-500" />
                    <AppSwitch :modelValue="false" label="Sincronização Automática" description="Recurso desativado temporariamente." disabled />
                  </div>
                </div>

                <div class="space-y-4">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Radio Buttons (Seleção Única)</p>
                  <div class="flex flex-col gap-3">
                    <AppRadio v-model="radioValue" value="a" name="suite-radio" label="Opção Estratégica A" />
                    <AppRadio v-model="radioValue" value="b" name="suite-radio" label="Opção Operacional B" />
                    <AppRadio v-model="radioValue" value="c" name="suite-radio" label="Opção Tática C" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SEÇÃO: ELEMENTOS UI -->
        <section v-if="activeTab === 'elements'" class="animate-fadeIn space-y-8">
          <header>
            <h2 class="text-2xl font-black text-app-main tracking-tighter uppercase">Elementos UI</h2>
            <p class="text-sm text-app-muted font-medium">Componentes atômicos para enriquecer a experiência visual.</p>
          </header>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="glass-panel p-8 space-y-8">
              <h3 class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Box class="w-4 h-4" /> Componente: AppBadge
              </h3>
              
              <div class="flex flex-wrap gap-3">
                <AppBadge label="Pendente" variant="slate" />
                <AppBadge label="Em Progresso" variant="indigo" dot />
                <AppBadge label="Concluído" variant="emerald" />
                <AppBadge label="Atrasado" variant="red" dot />
                <AppBadge label="Atenção" variant="amber" />
                <AppBadge label="Beta" variant="purple" size="xs" />
              </div>
            </div>

            <div class="glass-panel p-8 space-y-8">
              <h3 class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User class="w-4 h-4" /> Componente: AppAvatar
              </h3>

              <div class="flex items-end gap-6">
                <AppAvatar name="Sérgio" size="xl" />
                <AppAvatar src="https://github.com/ssergio100.png" name="Sérgio" size="lg" />
                <AppAvatar name="UX" size="md" />
                <AppAvatar name="T" size="sm" />
              </div>
            </div>

            <div class="glass-panel p-8 space-y-8">
              <h3 class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Layout class="w-4 h-4" /> Componente: AppProgressBar
              </h3>

              <div class="space-y-6">
                <AppProgressBar :progress="100" variant="emerald" showLabel>Sincronização Cloud</AppProgressBar>
                <AppProgressBar :progress="demoProgress" variant="indigo" showLabel>Progresso da Sprint</AppProgressBar>
                <div class="flex gap-2 pt-4">
                   <button @click="demoProgress = Math.max(0, demoProgress - 10)" class="p-2 bg-app-surface border border-app-border-light rounded-lg text-[10px] font-black uppercase">-10%</button>
                   <button @click="demoProgress = Math.min(100, demoProgress + 10)" class="p-2 bg-app-surface border border-app-border-light rounded-lg text-[10px] font-black uppercase">+10%</button>
                </div>
              </div>
            </div>

            <div class="glass-panel p-8 space-y-8 text-app-main">
              <h3 class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Loader2 class="w-4 h-4" /> Componente: AppSkeleton
              </h3>

              <div class="space-y-4">
                <div class="flex items-center gap-4">
                  <AppSkeleton width="w-12" height="h-12" rounded="rounded-2xl" />
                  <div class="flex-1 space-y-2">
                    <AppSkeleton width="w-1/3" height="h-3" />
                    <AppSkeleton width="w-full" height="h-2" />
                  </div>
                </div>
                <AppSkeleton height="h-20" />
              </div>
            </div>
          </div>
        </section>

        <!-- SEÇÃO: BOTÕES -->
        <section v-if="activeTab === 'buttons'" class="animate-fadeIn space-y-8">
          <header>
            <h2 class="text-2xl font-black text-app-main tracking-tighter uppercase">Botões & Cliques</h2>
            <p class="text-sm text-app-muted font-medium">Ações primárias, secundárias e menus de contexto com suporte a tooltips.</p>
          </header>

          <div class="glass-panel p-8 space-y-10 text-app-main">
            <div class="space-y-6">
              <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ícones de Ação (com v-tooltip)</h3>
              <div class="flex flex-wrap gap-4">
                <button title="'Adicionar Nova Tarefa'" class="flex items-center justify-center p-3 rounded-xl transition-all hover:bg-emerald-500/10 text-emerald-500">
                  <Plus class="w-5 h-5" />
                </button>
                <button title="'Ver Scripts SQL'" class="flex items-center justify-center p-3 rounded-xl transition-all hover:bg-indigo-500/10 text-indigo-500">
                  <Database class="w-5 h-5" />
                </button>
                <button title="'Configurações do Workspace'" class="flex items-center justify-center p-3 rounded-xl transition-all hover:bg-slate-500/10 text-slate-500">
                  <Settings class="w-5 h-5" />
                </button>
                <button title="'Central de Ajuda'" class="flex items-center justify-center p-3 rounded-xl transition-all hover:bg-amber-500/10 text-amber-500">
                  <HelpCircle class="w-5 h-5" />
                </button>
              </div>
            </div>

            <div class="pt-10 border-t border-app-border-light space-y-6">
              <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estilos de Botão do Sistema</h3>
              <div class="flex flex-wrap gap-4">
                <button title="'Salvar todas as alterações agora'" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-indigo-500/20">PRIMÁRIO</button>
                <button title="'Cancelar e descartar edições'" class="px-6 py-3 bg-white dark:bg-white/5 border border-app-border-light text-app-main text-xs font-black rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800">SECUNDÁRIO</button>
                <button title="'Esta ação não pode ser desfeita!'" class="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-black rounded-2xl transition-all hover:bg-red-500 hover:text-white">PERIGO / DELETE</button>
              </div>
            </div>
          </div>
        </section>

        <!-- SEÇÃO: MODAIS -->
        <section v-if="activeTab === 'modals'" class="animate-fadeIn space-y-8">
          <header>
            <h2 class="text-2xl font-black text-app-main tracking-tighter uppercase">Modais & Feedbacks</h2>
            <p class="text-sm text-app-muted font-medium">Lógica global de notificações, alertas e diálogos de confirmação.</p>
          </header>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="glass-panel p-8 space-y-6">
              <h3 class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2"><MessageSquare class="w-4 h-4" /> Toasts</h3>
              <div class="grid grid-cols-2 gap-3">
                <button @click="showToast('success')" class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-500/20 transition-all text-emerald-600 font-black text-[10px]"><CheckCircle2 class="w-6 h-6" /> SUCESSO</button>
                <button @click="showToast('error')" class="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center gap-2 group hover:bg-red-500/20 transition-all text-red-600 font-black text-[10px]"><XCircle class="w-6 h-6" /> ERRO</button>
              </div>
            </div>

            <div class="glass-panel p-8 space-y-6">
              <h3 class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Layers class="w-4 h-4" /> Alertas</h3>
              <div class="space-y-3">
                <button @click="showAlert('success')" class="w-full p-4 bg-white dark:bg-white/5 border border-app-border-light rounded-2xl flex items-center gap-4 hover:border-indigo-500/50 transition-all text-left">
                  <div class="p-2 bg-emerald-500 rounded-xl text-white shadow-lg"><CheckCircle2 class="w-5 h-5" /></div>
                  <span class="text-xs font-black uppercase text-app-main">Modal Sucesso</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- SEÇÃO: DESIGN SYSTEM -->
        <section v-if="activeTab === 'visuals'" class="animate-fadeIn space-y-8">
          <header>
            <h2 class="text-2xl font-black text-app-main tracking-tighter uppercase">Design System</h2>
            <p class="text-sm text-app-muted font-medium">Paleta de cores, tipografia e regras de geometria.</p>
          </header>

          <div class="glass-panel p-8 space-y-10 text-app-main">
            <div class="space-y-6">
              <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Colors</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="space-y-2"><div class="h-20 bg-indigo-500 rounded-3xl shadow-lg"></div><p class="text-[10px] font-black text-center uppercase">Indigo</p></div>
                <div class="space-y-2"><div class="h-20 bg-emerald-500 rounded-3xl shadow-lg"></div><p class="text-[10px] font-black text-center uppercase">Emerald</p></div>
                <div class="space-y-2"><div class="h-20 bg-red-500 rounded-3xl shadow-lg"></div><p class="text-[10px] font-black text-center uppercase">Red</p></div>
                <div class="space-y-2"><div class="h-20 bg-amber-500 rounded-3xl shadow-lg"></div><p class="text-[10px] font-black text-center uppercase">Amber</p></div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>

    <!-- FOOTER -->
    <footer class="mt-20 border-t border-app-border-light px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
      <div class="flex items-center gap-3">
         <h1 class="text-2xl bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] bg-clip-text text-transparent pr-2" style="font-family: 'Satisfy', cursive;">Tass</h1>
         <div class="w-1 h-6 bg-app-border-light rounded-full"></div>
         <p class="text-[10px] font-bold text-app-muted uppercase tracking-[0.2em]">Engineering Standards © 2026</p>
      </div>
      <div class="flex gap-6">
        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-default">Docs Local: /suite</span>
        <div class="h-4 w-px bg-app-border-light opacity-50"></div>
        <a href="https://github.com/ssergio100/TASS" target="_blank" class="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline flex items-center gap-1.5">
          <Database class="w-3 h-3" />
          Repositório Git
        </a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.glass-panel {
  @apply bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-2xl;
  border-radius: var(--app-card-radius);
}

.animate-fadeIn {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }
</style>
