import { describe, it, expect } from 'vitest';
import { formatMsToHMS } from '../../src/utils/time';

describe('time utils', () => {
  it('deve formatar milissegundos em HH:MM:SS', () => {
    const ms = (2 * 3600 + 15 * 60 + 30) * 1000; // 02:15:30
    expect(formatMsToHMS(ms)).toBe('02:15:30');
  });

  it('deve lidar com menos de uma hora', () => {
    const ms = (45 * 60 + 5) * 1000; // 00:45:05
    expect(formatMsToHMS(ms)).toBe('00:45:05');
  });

  it('deve lidar com menos de um minuto', () => {
    const ms = 12 * 1000; // 00:00:12
    expect(formatMsToHMS(ms)).toBe('00:00:12');
  });

  it('deve retornar 00:00:00 para valores zerados ou negativos', () => {
    expect(formatMsToHMS(0)).toBe('00:00:00');
    expect(formatMsToHMS(-1000)).toBe('00:00:00');
  });
});
