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
