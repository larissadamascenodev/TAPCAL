import type { DateKey, DayLog, Meals } from '@/types';

/** Quantos dias passados ficam guardados no aparelho (a nuvem guarda tudo na fase 5). */
export const HISTORY_DAYS = 90;

export function emptyMeals(): Meals {
  return { cafe_da_manha: [], almoco: [], lanche: [], jantar: [] };
}

export function emptyDay(date: DateKey): DayLog {
  return { date, meals: emptyMeals(), waterMl: 0 };
}

function hasData(day: DayLog): boolean {
  return day.waterMl > 0 || Object.values(day.meals).some((m) => m.length > 0);
}

/**
 * Vira o dia: se `today.date` não é mais hoje, o dia antigo vai para o histórico
 * (se tiver algo registrado) e começa um dia novo com refeições e água zeradas.
 * Retorna os mesmos objetos se ainda é o mesmo dia.
 */
export function rolloverDay(
  today: DayLog,
  history: DayLog[],
  todayKey: DateKey,
): { today: DayLog; history: DayLog[] } {
  if (today.date === todayKey) return { today, history };

  const kept = hasData(today) ? [today, ...history.filter((d) => d.date !== today.date)] : history;
  return {
    today: emptyDay(todayKey),
    history: kept.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, HISTORY_DAYS),
  };
}
