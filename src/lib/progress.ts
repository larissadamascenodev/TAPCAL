/**
 * Progresso ao longo dos dias: semana, sequência de dias registrados e peso.
 */

import { addDays, daysBetween } from '@/lib/dates';
import type { DateKey, DayLog, WeightEntry } from '@/types';

/** Os 7 dias que terminam hoje (o mais antigo primeiro). */
export function lastSevenDays(today: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
}

/** Um dia conta como registrado se tem pelo menos um alimento. */
export function hasFood(day: DayLog): boolean {
  return Object.values(day.meals).some((m) => m.length > 0);
}

/** Datas com comida registrada, juntando hoje e o histórico. */
export function loggedDates(today: DayLog, history: readonly DayLog[]): Set<DateKey> {
  const set = new Set<DateKey>();
  for (const d of [today, ...history]) if (hasFood(d)) set.add(d.date);
  return set;
}

/**
 * Sequência de dias seguidos com registro. Hoje ainda sem registro não quebra
 * a sequência (o dia não acabou): conta a partir de ontem.
 */
export function streak(dates: ReadonlySet<DateKey>, today: DateKey): number {
  let day = dates.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (dates.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

export type WeightTrend = {
  current: number;
  /** Variação dentro da janela (negativo = perdeu). */
  deltaKg: number;
  /** Dias entre a primeira e a última pesagem da janela. */
  spanDays: number;
  /** Pesagens dentro da janela, da mais antiga para a mais nova. */
  points: WeightEntry[];
};

/** Tendência do peso nos últimos `days` dias. */
export function weightTrend(
  weights: readonly WeightEntry[],
  today: DateKey,
  days = 30,
): WeightTrend | null {
  const sorted = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!sorted.length) return null;
  const from = addDays(today, -days);
  const inWindow = sorted.filter((w) => w.date >= from && w.date <= today);
  const points = inWindow.length ? inWindow : [sorted[sorted.length - 1]];
  const first = points[0];
  const last = points[points.length - 1];
  return {
    current: last.weightKg,
    deltaKg: Math.round((last.weightKg - first.weightKg) * 10) / 10,
    spanDays: daysBetween(first.date, last.date),
    points,
  };
}
