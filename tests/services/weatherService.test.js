import { describe, it, expect, vi, beforeEach } from 'vitest';
import { weatherService } from '../../src/services/weatherService';

describe('weatherService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchWeather makes API call and formats data correctly', async () => {
    const mockResponse = {
      current: {
        temperature_2m: 25.5,
        is_day: 1,
        weather_code: 3 // overcast
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const data = await weatherService.fetchWeather(-23.5, -46.6);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('latitude=-23.5&longitude=-46.6')
    );
    expect(data.temperature).toBe(25.5);
    expect(data.isDay).toBe(1);
    expect(data.wmoCode).toBe(3);
    expect(data.iconName).toBe('overcast');
    expect(data.iconUrl).toContain('overcast.svg');
  });

  it('fetchWeather throws error when API fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false
    });

    await expect(weatherService.fetchWeather(0, 0)).rejects.toThrow('Falha ao buscar dados climáticos');
  });
});
