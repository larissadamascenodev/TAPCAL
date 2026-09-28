import { describe, expect, it } from '@jest/globals';

import { sampleDay, sampleHistory } from '@/data/sample';
import { emptyDay } from '@/lib/day';
import { lastSevenDays, loggedDates, streak, weightTrend } from '@/lib/progress';

const TODAY = '2026-09-28';

describe('semana e sequência', () => {
  it('lista os 7 dias terminando hoje', () => {
    expect(lastSevenDays(TODAY)).toEqual([
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
      '2026-09-28',
    ]);
  });

  it('conta dias seguidos com registro', () => {
    const dates = loggedDates(sampleDay(TODAY), sampleHistory(TODAY));
    // exemplo: hoje, -1 e -2 registrados, -3 vazio
    expect(streak(dates, TODAY)).toBe(3);
  });

  it('hoje sem registro ainda não quebra a sequência', () => {
    const dates = loggedDates(emptyDay(TODAY), sampleHistory(TODAY));
    expect(dates.has(TODAY)).toBe(false);
    expect(streak(dates, TODAY)).toBe(2);
  });

  it('sequência zera se ontem ficou vazio', () => {
    expect(streak(new Set(['2026-09-25']), TODAY)).toBe(0);
  });
});

describe('peso', () => {
  const weights = [
    { id: '0', date: '2026-08-01', weightKg: 73 },
    { id: '1', date: '2026-08-31', weightKg: 71 },
    { id: '2', date: '2026-09-14', weightKg: 70.1 },
    { id: '3', date: '2026-09-28', weightKg: 69.4 },
  ];

  it('mostra a variação dos últimos 30 dias', () => {
    const t = weightTrend(weights, TODAY)!;
    expect(t.current).toBe(69.4);
    expect(t.deltaKg).toBe(-1.6);
    expect(t.points.map((p) => p.id)).toEqual(['1', '2', '3']);
    expect(t.spanDays).toBe(28);
  });

  it('sem pesagens recentes, usa a última', () => {
    const t = weightTrend(weights.slice(0, 1), TODAY)!;
    expect(t.current).toBe(73);
    expect(t.deltaKg).toBe(0);
  });

  it('sem pesagens, não há tendência', () => {
    expect(weightTrend([], TODAY)).toBeNull();
  });
});
