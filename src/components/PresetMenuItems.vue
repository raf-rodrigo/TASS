<script setup>
import { computed } from 'vue';
import { Check } from 'lucide-vue-next';
import { useTaskStyleStore } from '../stores/taskStyleStore';

defineProps({
  title: {
    type: String,
    required: true
  },
  currentPresetId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['apply', 'preview', 'clear-preview']);
const taskStyleStore = useTaskStyleStore();

const layoutClasses = computed(() => {
  const count = taskStyleStore.sortedStyles.length;

  return [
    count > 24 ? 'w-[580px]' : count > 12 ? 'w-[380px]' : 'w-[200px]',
    count > 12 ? 'grid gap-x-2 gap-y-0.5' : 'flex flex-col gap-0.5',
    count > 24 ? 'grid-cols-3' : count > 12 ? 'grid-cols-2' : ''
  ];
});
</script>

<template>
  <div>
    <div class="px-3 py-1.5 text-[10px] font-black uppercase text-app-sub tracking-widest border-b border-app-border-light mb-1">
      {{ title }}
    </div>

    <div :class="layoutClasses" @mouseleave="emit('clear-preview')">
      <button
        data-test="preset-option-default"
        class="context-menu-item flex justify-between items-center"
        :class="currentPresetId === '' ? 'bg-indigo-500/10 text-indigo-500 font-bold' : ''"
        @click="emit('apply', '')"
        @mouseenter="emit('preview', '')"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-3 h-3 rounded-full border border-black/10 dark:border-white/10 flex-shrink-0 bg-slate-200"></div>
          <span>Padrão Global</span>
        </div>
        <Check v-if="currentPresetId === ''" class="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 ml-auto" />
      </button>

      <hr v-if="taskStyleStore.sortedStyles.length <= 12" class="border-t border-app-border-light my-1 mx-2" />

      <button
        v-for="preset in taskStyleStore.sortedStyles"
        :key="preset.id"
        :data-test="`preset-option-${preset.id}`"
        class="context-menu-item flex justify-between items-center"
        :class="currentPresetId === preset.id ? 'bg-indigo-500/10 text-indigo-500 font-bold' : ''"
        @click="emit('apply', preset.id)"
        @mouseenter="emit('preview', preset.id)"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-3 h-3 rounded-full border border-black/10 dark:border-white/10 flex-shrink-0"
            :style="{ backgroundColor: preset.colors?.bgColor || '#e2e8f0' }"
          ></div>
          <span>{{ preset.name }}</span>
        </div>
        <Check v-if="currentPresetId === preset.id" class="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 ml-auto" />
      </button>

      <div
        v-if="taskStyleStore.sortedStyles.length === 0"
        class="py-3 px-2 text-center"
        :class="taskStyleStore.sortedStyles.length > 12 ? 'col-span-full' : ''"
      >
        <p class="text-[10px] text-slate-400 italic">Nenhum preset.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.context-menu-item {
  @apply w-full px-3 py-2 flex items-center gap-3 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors rounded-[8px] active:scale-[0.98] cursor-pointer overflow-hidden;
}

.context-menu-item span {
  @apply truncate;
}
</style>
