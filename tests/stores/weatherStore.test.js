import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWeatherStore } from '../../src/stores/weatherStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { weatherService } from '../../src/services/weatherService';

describe('Weather Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('initializes with default state', () => {
    const store = useWeatherStore();
    expect(store.temperature).toBe(null);
    expect(store.isLoading).toBe(false);
  });

  it('refreshWeather updates state on success', async () => {
    const store = useWeatherStore();
    const settingsStore = useSettingsStore();
    settingsStore.weatherWidgetEnabled = true;
    
    vi.spyOn(weatherService, 'getUserLocation').mockResolvedValue({ lat: -23, lon: -46 });
    vi.spyOn(weatherService, 'fetchWeather').mockResolvedValue({
      temperature: 20,
      iconUrl: 'test.svg',
      isDay: 1,
      timestamp: 123456
    });

    await store.refreshWeather();

    expect(store.temperature).toBe(20);
    expect(store.iconUrl).toBe('test.svg');
    expect(store.error).toBe(null);
  });

  it('handles API fetch error correctly', async () => {
    const store = useWeatherStore();
    const settingsStore = useSettingsStore();
    settingsStore.weatherWidgetEnabled = true;
    
    vi.spyOn(weatherService, 'getUserLocation').mockResolvedValue({ lat: -23, lon: -46 });
    vi.spyOn(weatherService, 'fetchWeather').mockRejectedValue(new Error('API failure'));

    await store.refreshWeather();

    expect(store.error).toBe('API failure');
  });
});
