<script setup>
import { X } from 'lucide-vue-next';
import { useModalDrag } from '../composables/useModalDrag';
import { useSettingsStore } from '../stores/settingsStore';

const settings = useSettingsStore();
const props = defineProps({
  title: String,
  showClose: { type: Boolean, default: true },
  maxWidth: { type: String, default: 'max-w-2xl' },
  customClass: { type: String, default: '' },
  animate: { type: Boolean, default: true },
  hideHeader: { type: Boolean, default: false }
});

const emit = defineEmits(['close']);
const { position, onMouseDown } = useModalDrag();
</script>

<template>
  <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-transparent" @click.self="emit('close')">
    <section 
      class="glass-panel !p-0 w-full flex flex-col shadow-2xl border-indigo-500/10 overflow-hidden"
      :class="[maxWidth, customClass, { 'animate-scaleIn': animate }]"
      :style="{ 
        '--modal-x': `${position.x}px`,
        '--modal-y': `${position.y}px`,
        transform: `translate(var(--modal-x), var(--modal-y))`,
        backgroundColor: `rgba(var(--app-bg-raw), var(--app-modal-opacity))`
      }"
    >
      <!-- Header / Drag Handle -->
      <header 
        v-if="!hideHeader"
        class="flex items-center justify-between p-6 pb-2 cursor-grab active:cursor-grabbing group select-none"
        @mousedown="onMouseDown"
      >
        <slot name="header" :onMouseDown="onMouseDown">
          <div class="flex items-center gap-3">
            <div class="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
            <h2 class="text-sm font-black text-app-main uppercase tracking-tighter">{{ title }}</h2>
          </div>
        </slot>
        
        <button v-if="showClose" @click="emit('close')" class="icon-btn">
          <X class="w-5 h-5" />
        </button>
      </header>

      <!-- Content Area -->
      <main 
        class="flex-1 overflow-y-auto custom-scrollbar"
        :class="hideHeader ? 'p-0' : 'p-6 pt-2'"
      >
        <slot :onMouseDown="onMouseDown"></slot>
      </main>

      <!-- Footer Area -->
      <footer v-if="$slots.footer" class="p-5 border-t border-app-border-light bg-app-surface">
        <slot name="footer"></slot>
      </footer>
    </section>
  </div>
</template>

<style scoped>
</style>

