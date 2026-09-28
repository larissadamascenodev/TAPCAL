import type { DateKey } from '@/types';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Data 'AAAA-MM-DD' no fuso do aparelho.
 * Não usar toISOString(): ele é UTC e, no Brasil, viraria o dia às 21h.
 */
export function toDateKey(date: Date = new Date()): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Converte 'AAAA-MM-DD' em Date ao meio-dia local (evita escorregar de dia com horário de verão). */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Dias inteiros de `from` até `to` (positivo se `to` é depois). */
export function daysBetween(from: DateKey, to: DateKey): number {
  const ms = fromDateKey(to).getTime() - fromDateKey(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** Idade em anos completos na data `on`. */
export function ageOn(birthDate: DateKey, on: DateKey): number {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [y, m, d] = on.split('-').map(Number);
  const hadBirthday = m > bm || (m === bm && d >= bd);
  return y - by - (hadBirthday ? 0 : 1);
}
