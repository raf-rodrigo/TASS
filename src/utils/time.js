/**
 * Utilitários de tempo para o TASS
 */

/**
 * Formata milissegundos para HH:mm:ss ou Hh Mm
 * @param {number} ms - Tempo em milissegundos
 * @param {boolean} short - Se true, retorna no formato "Xh Ym"
 */
export const formatMsToHMS = (ms, short = false) => {
  if (!ms || ms < 0 || isNaN(ms)) return short ? '0h 0m' : '00:00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num) => String(num).padStart(2, '0');

  if (short) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Converte milissegundos para um objeto { hours, minutes }
 * @param {number} ms 
 */
export const getHMFromMs = (ms) => {
  if (!ms || ms < 0) return { hours: 0, minutes: 0 };
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
};

/**
 * Converte horas e minutos para milissegundos
 * @param {number} hours 
 * @param {number} minutes 
 */
export const hmsToMs = (hours = 0, minutes = 0) => {
  return (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
};
