<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  AlertTriangle,
  Check,
  GitBranch,
  Info,
  RefreshCw
} from 'lucide-vue-next';
import BaseModal from './BaseModal.vue';
import { useSettingsStore } from '../stores/settingsStore.js';
import { gitProviderService } from '../services/gitProvider.js';
import { notificationService } from '../services/notificationService.js';

const props = defineProps({
  sourceBranch: {
    type: String,
    required: true
  },
  targetEnvironment: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'merged']);

const settings = useSettingsStore();
const checkStatus = ref('checking');
const checkMessage = ref('');
const currentRequestId = ref(null);
const isExecuting = ref(false);
const isClosing = ref(false);
let isActive = true;

const providerName = computed(() => gitProviderService.getProviderName(settings));
const canMerge = computed(() => checkStatus.value === 'mergeable' && currentRequestId.value !== null);

const statusPanelClasses = computed(() => ({
  'bg-app-surface border-app-border-light text-app-sub': ['checking', 'idle'].includes(checkStatus.value),
  'bg-app-success/10 border-app-success/20 text-app-success': checkStatus.value === 'mergeable',
  'bg-app-danger/10 border-app-danger/20 text-app-danger': ['conflict', 'error'].includes(checkStatus.value),
  'bg-app-warning/10 border-app-warning/20 text-app-warning': checkStatus.value === 'no_changes'
}));

const statusIcon = computed(() => {
  if (checkStatus.value === 'checking') return RefreshCw;
  if (checkStatus.value === 'mergeable') return Check;
  if (['conflict', 'error'].includes(checkStatus.value)) return AlertTriangle;
  return Info;
});

const closeRemoteCheck = async () => {
  if (currentRequestId.value === null) return;

  const requestId = currentRequestId.value;
  await gitProviderService.breezeCloseMergeRequest(settings, requestId);
  if (currentRequestId.value === requestId) currentRequestId.value = null;
};

const analyzeMerge = async () => {
  checkStatus.value = 'checking';
  checkMessage.value = `Analisando branch e verificando conflitos no ${providerName.value}...`;

  try {
    const result = await gitProviderService.breezeCheckMergeStatus(
      settings,
      props.sourceBranch,
      props.targetEnvironment.branch
    );

    if (!isActive) {
      if (result.mrIid !== undefined && result.mrIid !== null) {
        await gitProviderService.breezeCloseMergeRequest(settings, result.mrIid);
      }
      return;
    }

    checkStatus.value = result.status === 'error' ? 'error' : result.status;
    checkMessage.value = result.message;
    currentRequestId.value = result.mrIid ?? null;
  } catch (error) {
    if (!isActive) return;
    checkStatus.value = 'error';
    checkMessage.value = `Erro na verificação: ${error.message}`;
  }
};

const cancelMerge = async () => {
  if (isClosing.value) return;
  isClosing.value = true;
  isActive = false;

  try {
    await closeRemoteCheck();
  } catch (error) {
    console.error('Falha ao fechar a verificação de merge:', error);
  } finally {
    emit('close');
  }
};

const executeMerge = async () => {
  if (!canMerge.value || isExecuting.value) return;

  const requestId = currentRequestId.value;
  isExecuting.value = true;

  try {
    await gitProviderService.breezeExecuteMergeRequest(settings, requestId);
    currentRequestId.value = null;
    notificationService.toast(
      `Merge de '${props.sourceBranch}' para '${props.targetEnvironment.branch}' concluído.`,
      'success'
    );
    emit('merged');
    emit('close');
  } catch (error) {
    checkStatus.value = 'error';
    checkMessage.value = `Erro ao executar o merge: ${error.message}`;
  } finally {
    isExecuting.value = false;
  }
};

onMounted(analyzeMerge);

onBeforeUnmount(() => {
  isActive = false;
  if (currentRequestId.value !== null) {
    void closeRemoteCheck().catch(error => {
      console.error('Falha ao encerrar a verificação de merge:', error);
    });
  }
});
</script>

<template>
  <BaseModal
    title="Confirmar Mesclagem de Branch"
    subtitle="Mesclar código da tarefa no ambiente integrado"
    :icon="GitBranch"
    :ok-text="canMerge ? 'Mesclar' : ''"
    :cancel-text="isExecuting ? '' : 'Cancelar'"
    :ok-loading="isExecuting"
    :show-close="!isExecuting"
    :close-on-click-outside="!isExecuting"
    @close="cancelMerge"
    @cancel="cancelMerge"
    @ok="executeMerge"
  >
    <div class="space-y-4 text-left">
      <div
        class="flex items-start gap-3 border border-app-accent/20 bg-app-accent/10"
        :style="{
          borderRadius: 'var(--app-card-radius)',
          padding: 'var(--app-card-padding)'
        }"
      >
        <Info class="mt-0.5 h-5 w-5 shrink-0 text-app-accent" />
        <div class="text-xs leading-relaxed text-app-sub">
          <p class="mb-1 font-bold text-app-accent">Ação de integração:</p>
          Você está prestes a mesclar a branch da tarefa
          <span class="rounded-[var(--app-input-radius)] bg-app-surface px-1.5 py-0.5 font-mono font-bold text-app-accent">
            {{ sourceBranch }}
          </span>
          no ambiente <strong class="text-app-main">{{ targetEnvironment.alias }}</strong>, branch de destino
          <span class="rounded-[var(--app-input-radius)] bg-app-surface px-1.5 py-0.5 font-mono font-bold text-app-warning">
            {{ targetEnvironment.branch }}
          </span>.
        </div>
      </div>

      <div
        class="flex items-start gap-3 border transition-all duration-300"
        :class="statusPanelClasses"
        :style="{
          borderRadius: 'var(--app-card-radius)',
          padding: 'var(--app-card-padding)'
        }"
        aria-live="polite"
      >
        <component
          :is="statusIcon"
          class="mt-0.5 h-5 w-5 shrink-0"
          :class="{ 'animate-spin': checkStatus === 'checking' }"
        />

        <div class="text-xs font-medium leading-relaxed">
          <p class="mb-1 text-[10px] font-black uppercase tracking-widest">Status da análise:</p>
          {{ checkMessage }}
        </div>
      </div>
    </div>
  </BaseModal>
</template>
