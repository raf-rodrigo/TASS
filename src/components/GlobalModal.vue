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

const iconColors = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  error: 'text-rose-500',
  success: 'text-emerald-500'
};

const iconBgColors = {
  info: 'bg-blue-500/10',
  warning: 'bg-amber-500/10',
  error: 'bg-rose-500/10',
  success: 'bg-emerald-500/10'
};

const primaryButtonClasses = {
  info: 'bg-indigo-600 hover:bg-indigo-500',
  warning: 'bg-amber-600 hover:bg-amber-500',
  error: 'bg-red-600 hover:bg-red-500',
  success: 'bg-emerald-600 hover:bg-emerald-500'
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
    <div v-if="modalStore.isOpen" class="fixed inset-0 z-[10000] overflow-y-auto" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
        @click="modalStore.handleCancel"
      ></div>

      <!-- Container -->
      <div class="flex min-h-full items-center justify-center p-6 text-center sm:p-0">
        <transition
          appear
          enter-active-class="ease-out duration-300"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="ease-in duration-200"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div 
            class="relative transform overflow-hidden rounded-[2rem] text-center shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-[360px] border border-white/5"
            :style="{ 
              backgroundColor: settings.theme === 'dark' ? '#1e2533' : '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
            }"
            @click.stop
          >
            <!-- Content Area (Centered) -->
            <div class="px-6 pt-8 pb-5 sm:px-8">
              <div class="flex flex-col items-center">
                <!-- Center Icon -->
                <div 
                  class="flex size-12 shrink-0 items-center justify-center rounded-full mb-4"
                  :class="iconBgColors[modalStore.type]"
                >
                  <component :is="icons[modalStore.type]" class="size-6" :class="iconColors[modalStore.type]" aria-hidden="true" />
                </div>

                <!-- Center Text Content -->
                <div class="w-full">
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white" id="modal-title">
                    {{ modalStore.title }}
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-slate-500 dark:text-slate-400 leading-snug px-2">
                      {{ modalStore.message }}
                    </p>
                  </div>

                  <!-- Centered Prompt Input -->
                  <div v-if="modalStore.isPrompt" class="mt-5">
                    <textarea
                      v-if="modalStore.promptType === 'textarea'"
                      ref="inputRef"
                      v-model="modalStore.promptValue"
                      :placeholder="modalStore.promptPlaceholder"
                      class="w-full rounded-xl bg-black/10 dark:bg-black/30 border border-white/10 px-4 py-3 text-sm text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all min-h-[80px] placeholder:text-slate-500"
                      @keydown.enter.ctrl="modalStore.handleConfirm"
                    ></textarea>
                    <input
                      v-else
                      ref="inputRef"
                      type="text"
                      v-model="modalStore.promptValue"
                      :placeholder="modalStore.promptPlaceholder"
                      class="w-full rounded-xl bg-black/10 dark:bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-center text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all placeholder:text-slate-500"
                      @keydown.enter="modalStore.handleConfirm"
                      @keydown.esc="modalStore.handleCancel"
                    />
                  </div>
                </div>

                <!-- Actions (Tighter bottom) -->
                <div class="mt-6 w-full flex flex-col items-center gap-3">
                  <button 
                    type="button" 
                    class="w-full inline-flex justify-center rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
                    :class="primaryButtonClasses[modalStore.type]"
                    @click="modalStore.handleConfirm"
                  >
                    {{ modalStore.confirmText }}
                  </button>

                  <div class="flex gap-4 items-center" v-if="modalStore.denyText || modalStore.cancelText">
                    <button 
                      v-if="modalStore.denyText"
                      @click="modalStore.handleDeny"
                      class="text-[11px] font-bold text-rose-500/80 hover:text-rose-500 transition-colors"
                    >
                      {{ modalStore.denyText }}
                    </button>
                    
                    <button 
                      v-if="modalStore.cancelText"
                      @click="modalStore.handleCancel"
                      class="text-[11px] font-bold text-slate-500/80 hover:text-slate-400 transition-colors"
                    >
                      {{ modalStore.cancelText }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Transição suave para o fundo */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
