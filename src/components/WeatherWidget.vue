<script setup>
import { onMounted, onUnmounted, computed } from 'vue';
import { useWeatherStore } from '../stores/weatherStore';
import { useSettingsStore } from '../stores/settingsStore';
import { RefreshCcw, MapPinOff, CloudOff } from 'lucide-vue-next';

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
    <div 
      v-if="settings.weatherWidgetEnabled && !weatherStore.locationDenied && (weatherStore.temperature !== null || weatherStore.isLoading || weatherStore.error)"
      class="fixed bottom-6 left-6 md:bottom-10 md:left-12 z-[240] pointer-events-auto group"
      title="Clique para atualizar o clima"
    >
      <button 
        @click="handleRefresh"
        class="flex items-center gap-3 px-3 py-2 shadow-2xl border border-app-border-light ring-1 ring-black/5 transition-all duration-300 hover:scale-105 active:scale-95"
        :style="{ 
          backgroundColor: `rgba(var(--app-bg-raw), var(--app-bottom-opacity))`,
          backdropFilter: `blur(var(--app-glass-blur)) brightness(var(--app-glass-brightness)) saturate(var(--app-glass-saturate))`,
          borderRadius: 'var(--app-card-radius)'
        }"
      >
        <!-- Ícone do Clima -->
        <div class="relative w-8 h-8 flex items-center justify-center shrink-0">
          <RefreshCcw v-if="weatherStore.isLoading && !weatherStore.iconUrl" class="w-5 h-5 text-indigo-500 animate-spin" />
          <CloudOff v-else-if="weatherStore.error && !weatherStore.iconUrl" class="w-5 h-5 text-red-400" />
          <img 
            v-else-if="weatherStore.iconUrl" 
            :src="weatherStore.iconUrl" 
            alt="Clima atual"
            class="w-full h-full object-contain drop-shadow-md"
            :class="{ 'opacity-50': weatherStore.isLoading || weatherStore.error }"
          />
        </div>

        <div class="flex flex-col items-start pr-1 max-w-[120px]">
          <span 
            v-if="weatherStore.error && weatherStore.temperature === null" 
            class="text-[10px] font-black text-red-400 tracking-tight leading-tight" 
            style="font-family: 'Inter', sans-serif;"
            :title="weatherStore.error"
          >
            Erro na Conexão
          </span>
          <span v-else class="text-sm font-black text-app-main tracking-tight leading-none" style="font-family: 'Inter', sans-serif;">
            {{ displayTemp }}°C
          </span>
          
          <span class="text-[9px] font-bold text-app-sub uppercase tracking-wider mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
            <span v-if="weatherStore.isLoading">Buscando...</span>
            <span v-else-if="weatherStore.error">Tentar Novamente</span>
            <span v-else>Atual</span>
          </span>
        </div>
      </button>
    </div>

    <!-- Widget de erro quando localização for negada -->
    <div 
      v-else-if="settings.weatherWidgetEnabled && weatherStore.locationDenied"
      class="fixed bottom-6 left-6 md:bottom-10 md:left-12 z-[240] pointer-events-none opacity-40 hover:opacity-100 transition-opacity"
    >
      <div 
        class="flex items-center gap-2 px-3 py-2 shadow-sm border border-app-border-light ring-1 ring-black/5 grayscale"
        :style="{ 
          backgroundColor: `rgba(var(--app-bg-raw), var(--app-bottom-opacity))`,
          backdropFilter: `blur(var(--app-glass-blur)) brightness(var(--app-glass-brightness)) saturate(var(--app-glass-saturate))`,
          borderRadius: 'var(--app-card-radius)'
        }"
      >
        <MapPinOff class="w-4 h-4 text-app-sub" />
        <span class="text-[10px] font-bold text-app-sub uppercase tracking-widest">Local Negado</span>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Transições suaves caso o SVG demore alguns ms para renderizar */
img {
  transition: opacity 0.3s ease;
}
</style>
