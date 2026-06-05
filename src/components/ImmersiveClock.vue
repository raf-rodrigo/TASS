<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';

const settings = useSettingsStore();
const currentTime = ref('');

const updateTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  currentTime.value = `${hours}:${minutes}`;
};

let timer;
onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<template>
  <div 
    class="immersive-clock-container fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none overflow-hidden transition-all duration-1000"
    :style="{ opacity: settings.theme === 'dark' ? 0.07 : 0.04 }"
  >
    <div 
      class="immersive-clock-text font-black tracking-tighter leading-none"
      :style="{ 
        fontSize: '35vw',
        fontFamily: settings.fontFamily,
        color: settings.theme === 'dark' ? '#fff' : '#000',
        filter: 'blur(2px)'
      }"
    >
      {{ currentTime }}
    </div>
  </div>
</template>

<style scoped>
.immersive-clock-container {
  /* Garante que o relógio fique atrás do conteúdo principal mas acima do wallpaper */
  perspective: 1000px;
}

.immersive-clock-text {
  /* Efeito sutil de profundidade */
  transform: translateZ(-100px);
  will-change: contents;
}
</style>
