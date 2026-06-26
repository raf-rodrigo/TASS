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

export const getWorkingIntervalsForDay = (date, settings) => {
  const day = date.getDay();
  const workDays = settings.workDays || [1, 2, 3, 4, 5];
  if (!workDays.includes(day)) return [];

  const [startH, startM] = (settings.workStart || '08:00').split(':').map(Number);
  const [endH, endM] = (settings.workEnd || '18:00').split(':').map(Number);

  const baseTime = new Date(date);
  baseTime.setHours(0, 0, 0, 0);
  const baseMs = baseTime.getTime();

  const workStartMs = baseMs + (startH * 60 + startM) * 60 * 1000;
  const workEndMs = baseMs + (endH * 60 + endM) * 60 * 1000;

  // Almoço padrão: 12:00 às 13:00
  const lunchStartMs = baseMs + 12 * 60 * 60 * 1000;
  const lunchEndMs = baseMs + 13 * 60 * 60 * 1000;

  const intervals = [];

  if (workEndMs <= lunchStartMs || workStartMs >= lunchEndMs) {
    intervals.push({ start: workStartMs, end: workEndMs });
  } else {
    if (workStartMs < lunchStartMs) {
      intervals.push({ start: workStartMs, end: lunchStartMs });
    }
    if (workEndMs > lunchEndMs) {
      intervals.push({ start: lunchEndMs, end: workEndMs });
    }
  }

  return intervals;
};

export const calculateWorkingTime = (fromMs, toMs, settings) => {
  if (!fromMs || !toMs || fromMs >= toMs) return 0;

  let totalMs = 0;
  
  const startDay = new Date(fromMs);
  startDay.setHours(0, 0, 0, 0);

  const endDay = new Date(toMs);
  endDay.setHours(0, 0, 0, 0);

  let currentDay = new Date(startDay);
  while (currentDay <= endDay) {
    const intervals = getWorkingIntervalsForDay(currentDay, settings);
    for (const interval of intervals) {
      const overlapStart = Math.max(fromMs, interval.start);
      const overlapEnd = Math.min(toMs, interval.end);
      if (overlapStart < overlapEnd) {
        totalMs += (overlapEnd - overlapStart);
      }
    }
    currentDay.setDate(currentDay.getDate() + 1);
  }

  return totalMs;
};

export const distributeDailyLogs = (task, fromMs, toMs, settings) => {
  task.dailyLogs = task.dailyLogs || {};
  if (!fromMs || !toMs || fromMs >= toMs) return;

  const startDay = new Date(fromMs);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(toMs);
  endDay.setHours(0, 0, 0, 0);

  let currentDay = new Date(startDay);
  while (currentDay <= endDay) {
    const yyyy = currentDay.getFullYear();
    const mm = String(currentDay.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDay.getDate()).padStart(2, '0');
    const dayStr = `${yyyy}-${mm}-${dd}`;

    const intervals = getWorkingIntervalsForDay(currentDay, settings);
    let dayWorkingMs = 0;
    for (const interval of intervals) {
      const overlapStart = Math.max(fromMs, interval.start);
      const overlapEnd = Math.min(toMs, interval.end);
      if (overlapStart < overlapEnd) {
        dayWorkingMs += (overlapEnd - overlapStart);
      }
    }

    if (dayWorkingMs > 0) {
      task.dailyLogs[dayStr] = (task.dailyLogs[dayStr] || 0) + dayWorkingMs;
    }

    currentDay.setDate(currentDay.getDate() + 1);
  }
};

/**
 * Formata datas de maneira segura e livre de deslocamento de fuso horário
 * @param {string|Date} dateStr 
 */
export const safeFormatDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string') {
    if (dateStr.includes('-') && !dateStr.includes('T')) {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return d.toLocaleDateString('pt-BR');
    }
    if (dateStr.includes('T')) {
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      return d.toLocaleDateString('pt-BR');
    }
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
};

