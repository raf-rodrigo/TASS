<script setup>
import { 
  AlertTriangle, CheckCircle, Info, XCircle, X 
} from 'lucide-vue-next';
import { ref, watch, nextTick } from 'vue';
import { useModalStore } from '../stores/modalStore';
import { useSettingsStore } from '../stores/settingsStore';

const modalStore = useModalStore();
const settings = useSettingsStore();
const inputRef = ref(null);

const icons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle
};

const iconClasses = {
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  error: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
  success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
};

const buttonClasses = {
  info: 'bg-blue-600 hover:bg-blue-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  error: 'bg-rose-600 hover:bg-rose-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white'
};

// Auto-focus logic
watch(() => modalStore.isOpen, (newVal) => {
  if (newVal && modalStore.isPrompt) {
    nextTick(() => {
      if (inputRef.value) inputRef.value.focus();
    });
  }
});
</script>

<template>
  <transition
    enter-active-class="ease-out duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="modalStore.isOpen" class="relative z-[10000]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        @click="modalStore.handleCancel"
      ></div>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <transition
            enter-active-class="ease-out duration-300"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div 
              class="relative transform overflow-hidden glass-panel text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border-white/10"
              :style="{ 
                backgroundColor: settings.theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(16px)'
              }"
            >
              <div class="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <!-- Ícone de Alerta -->
                  <div 
                    class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10"
                    :class="iconClasses[modalStore.type]"
                  >
                    <component :is="icons[modalStore.type]" class="h-6 w-6" aria-hidden="true" />
                  </div>

                  <!-- Conteúdo -->
                  <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <h3 
                      class="text-lg font-bold leading-6 text-slate-900 dark:text-white" 
                      id="modal-title"
                    >
                      {{ modalStore.title }}
                    </h3>
                    <div class="mt-2">
                      <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {{ modalStore.message }}
                      </p>
                    </div>

                    <!-- Prompt Input Area -->
                    <div v-if="modalStore.isPrompt" class="mt-4">
                      <textarea
                        v-if="modalStore.promptType === 'textarea'"
                        ref="inputRef"
                        v-model="modalStore.promptValue"
                        :placeholder="modalStore.promptPlaceholder"
                        class="app-input min-h-[120px] py-3 text-sm"
                        @keydown.enter.ctrl="modalStore.handleConfirm"
                      ></textarea>
                      <input
                        v-else
                        ref="inputRef"
                        type="text"
                        v-model="modalStore.promptValue"
                        :placeholder="modalStore.promptPlaceholder"
                        class="app-input"
                        @keydown.enter="modalStore.handleConfirm"
                        @keydown.esc="modalStore.handleCancel"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Botões de Ação -->
              <div class="px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 bg-slate-50/50 dark:bg-black/20 gap-3 border-t border-white/5">
                <button 
                  type="button" 
                  class="inline-flex w-full justify-center rounded-xl px-6 py-2.5 text-sm font-semibold shadow-sm sm:w-auto transition-all active:scale-95"
                  :class="buttonClasses[modalStore.type]"
                  @click="modalStore.handleConfirm"
                >
                  {{ modalStore.confirmText }}
                </button>
                <button 
                  v-if="modalStore.cancelText"
                  type="button" 
                  class="mt-3 inline-flex w-full justify-center rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-white/10 hover:bg-slate-100 dark:hover:bg-white/5 sm:mt-0 sm:w-auto transition-all active:scale-95"
                  @click="modalStore.handleCancel"
                >
                  {{ modalStore.cancelText }}
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.glass-panel {
  border-radius: var(--app-card-radius);
}
</style>
