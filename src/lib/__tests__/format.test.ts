import { describe, expect, it } from '@jest/globals';

import {
  formatDayMonth,
  formatDecimal,
  formatDuration,
  formatInt,
  formatLiters,
  formatTons,
  greeting,
} from '@/lib/format';

describe('formatação pt-BR', () => {
  it('inteiros com ponto de milhar', () => {
    expect(formatInt(2150)).toBe('2.150');
    expect(formatInt(970)).toBe('970');
    expect(formatInt(1234567)).toBe('1.234.567');
    expect(formatInt(-550)).toBe('-550');
    expect(formatInt(1499.6)).toBe('1.500');
  });

  it('decimais com vírgula e sem zeros sobrando', () => {
    expect(formatDecimal(69.4)).toBe('69,4');
    expect(formatDecimal(70)).toBe('70');
    expect(formatDecimal(-2.6)).toBe('-2,6');
    expect(formatDecimal(-0.01)).toBe('0');
    expect(formatLiters(1250)).toBe('1,25');
    expect(formatLiters(2500)).toBe('2,5');
    expect(formatTons(18200)).toBe('18,2');
  });

  it('durações', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(754)).toBe('12:34');
    expect(formatDuration(3725)).toBe('1:02:05');
  });

  it('datas e saudação', () => {
    expect(formatDayMonth('2026-09-28')).toBe('28 set');
    expect(greeting(new Date(2026, 8, 28, 8))).toBe('Bom dia');
    expect(greeting(new Date(2026, 8, 28, 14))).toBe('Boa tarde');
    expect(greeting(new Date(2026, 8, 28, 21))).toBe('Boa noite');
  });
});
