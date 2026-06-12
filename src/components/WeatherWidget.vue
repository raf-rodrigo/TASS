<script setup>
import { onMounted, onUnmounted, computed } from 'vue';
import { useWeatherStore } from '../stores/weatherStore';
import { useSettingsStore } from '../stores/settingsStore';
import { RefreshCcw, MapPinOff, CloudOff, Droplets } from 'lucide-vue-next';

const weatherStore = useWeatherStore();
const settings = useSettingsStore();

let refreshInterval;

onMounted(async () => {
  await weatherStore.initialize();
  // Tentar atualizar a cada 30 minutos em background
  refreshInterval = setInterval(() => {
    weatherStore.refreshWeather();
  }, 30 * 60 * 1000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});

const handleRefresh = () => {
  weatherStore.refreshWeather();
};

const displayTemp = computed(() => {
  if (weatherStore.temperature === null || weatherStore.temperature === undefined) return '--';
  return Math.round(weatherStore.temperature);
});
</script>

<template>
  <transition 
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="translate-y-10 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="translate-y-10 opacity-0 scale-95"
  >
    <!-- Widget quando ativo e com dados válidos -->
    <button 
      v-if="settings.weatherWidgetEnabled && !weatherStore.locationDenied && (weatherStore.temperature !== null || weatherStore.isLoading || weatherStore.error)"
      @click="handleRefresh"
      class="dock-item !bg-indigo-500/5 !border-indigo-500/20 px-3 flex items-center gap-2 h-12 md:h-10 shrink-0 hover:scale-105 active:scale-95 transition-all group"
      title="Clique para atualizar o clima"
    >
      <!-- Ícone do Clima -->
      <div class="relative w-6 h-6 flex items-center justify-center shrink-0">
        <RefreshCcw v-if="weatherStore.isLoading && !weatherStore.iconUrl" class="w-4 h-4 text-indigo-500 animate-spin" />
        <CloudOff v-else-if="weatherStore.error && !weatherStore.iconUrl" class="w-4 h-4 text-red-400" />
        <img 
          v-else-if="weatherStore.iconUrl" 
          :src="weatherStore.iconUrl" 
          alt="Clima atual"
          class="w-full h-full object-contain drop-shadow-md"
          :class="{ 'opacity-50': weatherStore.isLoading || weatherStore.error }"
        />
      </div>

      <div class="flex flex-col items-start pr-1">
        <span 
          v-if="weatherStore.error && weatherStore.temperature === null" 
          class="text-[9px] font-black text-red-400 tracking-tight leading-tight" 
          :title="weatherStore.error"
        >
          Erro
        </span>
        <span v-else class="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-tight leading-none">
          {{ displayTemp }}°C
        </span>
        
        <span class="text-[8px] font-bold text-app-sub uppercase tracking-wider mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          <span v-if="weatherStore.isLoading">Buscando...</span>
          <span v-else-if="weatherStore.error">Erro</span>
          <span v-else class="flex items-center gap-0.5 text-sky-500 dark:text-sky-400">
            <Droplets class="w-2.5 h-2.5" /> {{ weatherStore.precipitation }}%
          </span>
        </span>
      </div>
    </button>

    <!-- Widget de erro quando localização for negada -->
    <div 
      v-else-if="settings.weatherWidgetEnabled && weatherStore.locationDenied"
      class="dock-item px-3 flex items-center gap-2 h-12 md:h-10 shrink-0 opacity-40 hover:opacity-100 transition-opacity"
    >
      <MapPinOff class="w-4 h-4 text-app-sub" />
      <span class="text-[8px] font-black uppercase tracking-wider text-app-sub">Local Negado</span>
    </div>
  </transition>
</template>

<style scoped>
.dock-item {
  @apply flex items-center gap-2 bg-app-surface border border-app-border-light transition-all;
  border-radius: var(--app-input-radius);
}
/* Transições suaves caso o SVG demore alguns ms para renderizar */
img {
  transition: opacity 0.3s ease;
}
</style>
