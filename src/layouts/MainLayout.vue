<script setup>
import { ref, watch } from 'vue';
import GlobalDock from '../components/GlobalDock.vue';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStore } from '../stores/taskStore';
import { useTheme } from '../composables/useTheme.js';
import { bridgeService } from '../services/bridgeService';

const settings = useSettingsStore();
const taskStore = useTaskStore();
const { toggleTheme } = useTheme(settings);

const props = defineProps({
  isDraggingTask: Boolean
});

const emit = defineEmits([
  'open-add-modal',
  'open-sprints',
  'open-notes',
  'open-interface',
  'open-settings',
  'open-radio'
]);
</script>

<template>
  <div class="relative w-full min-h-screen">
    <!-- Background Wallpaper Layer -->
    <template v-if="settings.backgroundImage">
      <div 
        class="fixed -top-[40px] -left-[40px] -right-[40px] -bottom-[40px] z-[-2] pointer-events-none"
        :style="{ 
          backgroundImage: `url(${settings.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }"
      ></div>
      <div 
        class="fixed inset-0 z-[-1] pointer-events-none transition-all duration-700 ease-in-out"
        :style="{ 
          backdropFilter: `blur(${settings.backgroundBlur}px) brightness(${settings.theme === 'dark' ? (settings.darkenWallpaper ? 0.6 : 1.0) : 0.85})`,
          '-webkit-backdrop-filter': `blur(${settings.backgroundBlur}px) brightness(${settings.theme === 'dark' ? (settings.darkenWallpaper ? 0.6 : 1.0) : 0.85})`,
          backgroundColor: settings.theme === 'dark' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.05)'
        }"
      ></div>
    </template>

    <!-- Bridge Status Indicator -->
    <div 
      class="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-app-border-light pointer-events-auto opacity-40 hover:opacity-100 transition-opacity cursor-help select-none"
      v-tooltip="bridgeService.isServerOnline.value ? `Bridge Online v${bridgeService.serverVersion.value}` : 'Bridge Offline (Backend porta 5176)'"
    >
      <div 
        class="w-1.5 h-1.5 rounded-full"
        :class="bridgeService.isServerOnline.value ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'"
      ></div>
      <span class="text-[8px] font-black uppercase tracking-tighter text-app-muted">
        Bridge
      </span>
    </div>

    <!-- TASS Branding (Bottom Right) -->
    <div class="fixed bottom-6 right-6 md:bottom-10 md:right-12 z-20 flex flex-col items-end animate-[fadeInRight_0.8s_ease-out] select-none pointer-events-none opacity-30 md:opacity-60 hover:opacity-100 transition-opacity">
      <div class="flex items-center gap-2">
        <h1 
          class="text-xl md:text-2xl leading-none bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] bg-clip-text text-transparent pr-2"
          style="font-family: 'Satisfy', cursive;"
        >
          Tass
        </h1>
        <div class="w-1 h-6 md:h-8 bg-gradient-to-b from-[#00C4CC] to-[#7D2AE8] rounded-full shadow-[0_0_10px_rgba(0,196,204,0.2)]"></div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div 
      class="w-full flex flex-col items-center px-4 md:px-6 pt-2 pb-32"
      :style="{ maxWidth: '98%' }"
    >
      <slot />
    </div>

    <!-- Global Dock -->
    <div class="pointer-events-none">
      <transition 
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="translate-y-20 opacity-0 scale-95"
        enter-to-class="translate-y-0 opacity-100 scale-100"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="translate-y-0 opacity-100 scale-100"
        leave-to-class="translate-y-20 opacity-0 scale-95"
      >
        <GlobalDock 
          v-if="!taskStore.selectedTask || settings.contextMenuMode === 'stack' || settings.contextMenuStyle === 'floating'"
          @add-task="emit('open-add-modal')"
          @open-sprints="emit('open-sprints')"
          @open-notes="emit('open-notes')"
          @open-interface="emit('open-interface')"
          @open-settings="emit('open-settings')"
          @toggle-theme="toggleTheme"
          @open-radio="emit('open-radio')"
          @open-components="$router.push('/components')"
          @open-workspace="$router.push('/')"
        />
      </transition>
    </div>
  </div>
</template>
