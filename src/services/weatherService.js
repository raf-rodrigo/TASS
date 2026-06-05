import { notificationService } from './notificationService';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Mapeia códigos WMO para nomes de ícones do Meteocons
// Referência WMO: https://open-meteo.com/en/docs
const wmoToIcon = (wmoCode, isDay = 1) => {
  const dayOrNight = isDay ? 'day' : 'night';
  
  const map = {
    0: `clear-${dayOrNight}`, // Clear sky
    1: `partly-cloudy-${dayOrNight}`, // Mainly clear
    2: `partly-cloudy-${dayOrNight}`, // Partly cloudy
    3: 'overcast', // Overcast
    45: 'fog', // Fog
    48: 'fog', // Depositing rime fog
    51: 'drizzle', // Drizzle: Light
    53: 'drizzle', // Drizzle: Moderate
    55: 'drizzle', // Drizzle: Dense intensity
    56: 'drizzle', // Freezing Drizzle: Light
    57: 'drizzle', // Freezing Drizzle: Dense
    61: 'rain', // Rain: Slight
    63: 'rain', // Rain: Moderate
    65: 'rain', // Rain: Heavy
    66: 'rain', // Freezing Rain: Light
    67: 'rain', // Freezing Rain: Heavy
    71: 'snow', // Snow fall: Slight
    73: 'snow', // Snow fall: Moderate
    75: 'snow', // Snow fall: Heavy
    77: 'snow', // Snow grains
    80: 'rain', // Rain showers: Slight
    81: 'rain', // Rain showers: Moderate
    82: 'rain', // Rain showers: Violent
    85: 'snow', // Snow showers slight
    86: 'snow', // Snow showers heavy
    95: 'thunderstorms', // Thunderstorm: Slight or moderate
    96: 'thunderstorms-rain', // Thunderstorm with slight hail
    99: 'thunderstorms-extreme-rain', // Thunderstorm with heavy hail
  };

  return map[wmoCode] || 'not-available';
};

class WeatherService {
  /**
   * Obtém os dados de clima da localização atual.
   * @param {number} lat Latitude
   * @param {number} lon Longitude
   * @returns {Promise<Object>} Dados processados de clima (temperatura, wmo, isDay, icone)
   */
  async fetchWeather(lat, lon) {
    try {
      const response = await fetch(
        `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&timezone=auto`
      );

      if (!response.ok) {
        throw new Error('Falha ao buscar dados climáticos na Open-Meteo');
      }

      const data = await response.json();
      
      if (!data || !data.current) {
        throw new Error('Dados de clima ausentes na resposta');
      }

      const current = data.current;
      
      const isDay = current.is_day;
      const wmoCode = current.weather_code;
      const temperature = current.temperature_2m;
      const iconName = wmoToIcon(wmoCode, isDay);
      const iconUrl = `https://cdn.jsdelivr.net/npm/@meteocons/svg@latest/fill/${iconName}.svg`;

      return {
        temperature,
        isDay,
        wmoCode,
        iconName,
        iconUrl,
        timestamp: new Date().getTime(),
      };
    } catch (error) {
      console.error('WeatherService Error:', error);
      throw error;
    }
  }

  async getCityCoordinates(cityName) {
    try {
      const response = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`);
      if (!response.ok) {
        throw new Error('Falha ao buscar coordenadas da cidade');
      }
      
      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        throw new Error(`Cidade "${cityName}" não encontrada.`);
      }
      
      const city = data.results[0];
      return {
        lat: city.latitude,
        lon: city.longitude,
      };
    } catch (error) {
      console.error('Erro na geocodificação:', error);
      throw error;
    }
  }

  /**
   * Obtém a localização do usuário através do navegador.
   * @returns {Promise<{lat: number, lon: number}>}
   */
  getUserLocation() {
    return new Promise((resolve) => {
      const fallback = { lat: -23.5505, lon: -46.6333 }; // São Paulo como fallback
      
      if (!navigator.geolocation) {
        console.warn('Geolocalização não suportada, usando fallback.');
        resolve(fallback);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Falha na geolocalização, usando fallback:', error);
          resolve(fallback);
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  }
}

export const weatherService = new WeatherService();
