<script setup>
import { 
  CheckCircle, XCircle, AlertCircle, Info, X 
} from 'lucide-vue-next';
import { useNotificationStore } from '../stores/notificationStore';
import { useSettingsStore } from '../stores/settingsStore';

const notificationStore = useNotificationStore();
const settings = useSettingsStore();

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
};

const iconClasses = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  warning: 'text-amber-500',
  info: 'text-blue-500'
};
</script>

<template>
  <div 
    aria-live="assertive" 
    class="fixed inset-x-0 top-0 flex flex-col items-center justify-start px-4 py-6 pointer-events-none z-[9999]"
  >
    <div class="flex flex-col items-center space-y-4 w-full max-w-md">
      <transition-group 
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="-translate-y-4 opacity-0 scale-95"
        enter-to-class="translate-y-0 opacity-100 scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div 
          v-for="notification in notificationStore.notifications" 
          :key="notification.id"
          class="!p-4 w-full shadow-2xl pointer-events-auto border border-app-border-light ring-1 ring-black/5 bg-app-glass backdrop-blur-md"
          :style="{ borderRadius: 'var(--app-card-radius)' }"
        >
          <div class="flex items-start">
            <!-- Ícone de Status -->
            <div class="flex-shrink-0">
              <component 
                :is="icons[notification.type]" 
                class="h-6 w-6" 
                :class="iconClasses[notification.type]" 
                aria-hidden="true" 
              />
            </div>

            <!-- Conteúdo do Texto -->
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-black text-app-main leading-tight">
                {{ notification.title }}
              </p>
              <p v-if="notification.message" class="mt-1 text-xs text-app-sub font-medium leading-relaxed">
                {{ notification.message }}
              </p>
            </div>

            <!-- Botão de Fechar -->
            <div class="ml-4 flex-shrink-0 flex">
              <button 
                @click="notificationStore.remove(notification.id)"
                class="rounded-md inline-flex text-app-muted hover:text-app-main focus:outline-none transition-colors"
              >
                <span class="sr-only">Fechar</span>
                <X class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<style scoped>
</style>
