import { describe, it, expect } from 'vitest';
import { formatMsToHMS } from './time';

describe('formatMsToHMS', () => {
  it('deve formatar milissegundos para o padrão HH:mm:ss', () => {
    // 3661000ms = 1h 1m 1s
    expect(formatMsToHMS(3661000)).toBe('01:01:01');
  });

  it('deve retornar 00:00:00 para valores inválidos ou zero', () => {
    expect(formatMsToHMS(0)).toBe('00:00:00');
    expect(formatMsToHMS(null)).toBe('00:00:00');
    expect(formatMsToHMS(undefined)).toBe('00:00:00');
  });

  it('deve formatar no modo curto (Xh Ym) quando solicitado', () => {
    // 3661000ms = 1h 1m (ignorando segundos no modo curto)
    expect(formatMsToHMS(3661000, true)).toBe('1h 1m');
  });

  it('deve lidar com grandes quantidades de horas', () => {
    // 100 horas = 360,000,000 ms
    expect(formatMsToHMS(360000000)).toBe('100:00:00');
  });
});
