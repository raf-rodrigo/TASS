<script setup>
import { X } from 'lucide-vue-next';
import { useModalDrag } from '../composables/useModalDrag';
import { useSettingsStore } from '../stores/settingsStore';

const settings = useSettingsStore();
const props = defineProps({
  title: String,
  subtitle: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  layout: { type: String, default: 'standard', validator: v => ['standard', 'custom'].includes(v) },
  showClose: { type: Boolean, default: true },
  maxWidth: { type: String, default: 'max-w-2xl' },
  customClass: { type: String, default: '' },
  animate: { type: Boolean, default: true },
  hideHeader: { type: Boolean, default: false } // Deprecated: Use layout="custom" instead
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
      <!-- ============================================== -->
      <!-- MODO: CUSTOM (Sem estrutura injetada, total liberdade) -->
      <!-- ============================================== -->
      <template v-if="layout === 'custom' || hideHeader">
        <slot :onMouseDown="onMouseDown"></slot>
      </template>

      <!-- ============================================== -->
      <!-- MODO: STANDARD (Padrão Cursorrules) -->
      <!-- ============================================== -->
      <template v-else>
        <!-- Header -->
        <header 
          class="flex items-center justify-between p-6 pb-4 border-b border-app-border-light cursor-grab active:cursor-grabbing select-none"
          @mousedown="onMouseDown"
        >
          <slot name="header" :onMouseDown="onMouseDown">
            <div class="flex items-center gap-3">
              <div v-if="icon" class="p-2.5 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                <component :is="icon" class="w-5 h-5" />
              </div>
              <div v-else class="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
              
              <div>
                <h2 :class="icon ? 'text-2xl font-black text-app-main tracking-tighter leading-none' : 'text-sm font-black text-app-main uppercase tracking-tighter'">
                  {{ title }}
                </h2>
                <span v-if="subtitle" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ subtitle }}</span>
              </div>
            </div>
          </slot>
          
          <button v-if="showClose" @click="emit('close')" class="icon-btn">
            <X class="w-5 h-5" />
          </button>
        </header>

        <!-- Content Area -->
        <main class="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <slot :onMouseDown="onMouseDown"></slot>
        </main>

        <!-- Footer Area -->
        <footer v-if="$slots.footer" class="p-6 border-t border-app-border-light bg-app-surface flex gap-3 mt-auto">
          <div class="flex items-center gap-3 w-full">
            <slot name="footer"></slot>
          </div>
        </footer>
      </template>
    </section>
  </div>
</template>

<style scoped>
</style>

