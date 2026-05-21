<script setup>
defineProps({
  width: {
    type: String,
    default: 'w-full'
  },
  height: {
    type: String,
    default: 'h-4'
  },
  rounded: {
    type: String,
    default: 'rounded-lg'
  },
  circle: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <div 
    class="bg-slate-200 dark:bg-white/5 animate-pulse relative overflow-hidden"
    :class="[width, height, circle ? 'rounded-full' : rounded]"
  >
    <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-[shimmer_2s_infinite]"></div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  100% { transform: translateX(100%); }
}
</style>
