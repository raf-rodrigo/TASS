import { defineStore } from 'pinia';
import { weatherService } from '../services/weatherService';
import { useSettingsStore } from './settingsStore';

// 30 minutos em milissegundos
const CACHE_DURATION = 30 * 60 * 1000;

export const useWeatherStore = defineStore('weather', {
  state: () => ({
    temperature: null,
    iconUrl: null,
    isDay: true,
    isLoading: false,
    error: null,
    lastUpdate: null,
    locationDenied: false,
  }),
  
  actions: {
    async initialize() {
      // Tentar carregar do cache primeiro (localStorage)
      this.loadFromCache();
      
      const now = new Date().getTime();
      
      // Se tivermos cache válido, não precisamos bater na API imediatamente
      if (this.lastUpdate && (now - this.lastUpdate < CACHE_DURATION) && !this.error) {
        return;
      }
      
      await this.refreshWeather();
    },
    
    async refreshWeather() {
      const settings = useSettingsStore();
      
      if (!settings.weatherWidgetEnabled) return;
      if (this.locationDenied && !settings.weatherCity) return;
      
      this.isLoading = true;
      this.error = null;
      
      try {
        let coords;
        if (settings.weatherCity && settings.weatherCity.trim().length > 0) {
          coords = await weatherService.getCityCoordinates(settings.weatherCity.trim());
        } else {
          coords = await weatherService.getUserLocation();
        }
        
        const data = await weatherService.fetchWeather(coords.lat, coords.lon);
        
        this.temperature = data.temperature;
        this.iconUrl = data.iconUrl;
        this.isDay = !!data.isDay;
        this.lastUpdate = data.timestamp;
        
        this.saveToCache();
      } catch (err) {
        console.error('Falha ao atualizar clima:', err);
        // Se o erro foi negação de localização, marcamos para não tentar de novo na mesma sessão
        if (err.code === 1 || (err.message && (err.message.includes('negada') || err.message.includes('denied')))) {
          this.locationDenied = true;
          this.error = 'Permissão de localização negada.';
        } else {
          this.error = err.message ? err.message : 'Falha na conexão com a API de clima.';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    saveToCache() {
      try {
        const data = {
          temperature: this.temperature,
          iconUrl: this.iconUrl,
          isDay: this.isDay,
          lastUpdate: this.lastUpdate,
        };
        localStorage.setItem('tass_weather_cache', JSON.stringify(data));
      } catch (e) {
        // Ignora erro de cota ou private browsing
      }
    },
    
    loadFromCache() {
      try {
        const dataStr = localStorage.getItem('tass_weather_cache');
        if (dataStr) {
          const data = JSON.parse(dataStr);
          this.temperature = data.temperature;
          this.iconUrl = data.iconUrl;
          this.isDay = data.isDay;
          this.lastUpdate = data.lastUpdate;
        }
      } catch (e) {
        // Ignora erro de parsing
      }
    }
  }
});
