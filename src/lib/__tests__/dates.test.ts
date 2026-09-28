import { describe, expect, it } from '@jest/globals';

import { addDays, ageOn, daysBetween, toDateKey } from '@/lib/dates';

describe('datas', () => {
  it('usa o dia local, não UTC (23h no Brasil ainda é o mesmo dia)', () => {
    expect(toDateKey(new Date(2026, 8, 28, 23, 30))).toBe('2026-09-28');
    expect(toDateKey(new Date(2026, 8, 29, 0, 5))).toBe('2026-09-29');
  });

  it('soma dias atravessando mês e ano', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('conta dias entre datas', () => {
    expect(daysBetween('2026-09-28', '2026-10-05')).toBe(7);
  });

  it('calcula idade antes e depois do aniversário', () => {
    expect(ageOn('1994-10-01', '2026-09-28')).toBe(31);
    expect(ageOn('1994-09-28', '2026-09-28')).toBe(32);
  });
});
