import type { DayLog, FoodItem, Macros } from '@/types';

export const ZERO_MACROS: Macros = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };

export function sumMacros(items: readonly FoodItem[]): Macros {
  return items.reduce<Macros>(
    (acc, it) => ({
      kcal: acc.kcal + it.kcal,
      proteinG: acc.proteinG + it.proteinG,
      carbsG: acc.carbsG + it.carbsG,
      fatG: acc.fatG + it.fatG,
    }),
    ZERO_MACROS,
  );
}

/** Soma de todas as refeições do dia. */
export function dayTotals(day: DayLog): Macros {
  return sumMacros(Object.values(day.meals).flat());
}

/** Quanto ainda cabe no dia (pode ficar negativo se passou da meta). */
export function remaining(goal: Macros, eaten: Macros): Macros {
  return {
    kcal: goal.kcal - eaten.kcal,
    proteinG: goal.proteinG - eaten.proteinG,
    carbsG: goal.carbsG - eaten.carbsG,
    fatG: goal.fatG - eaten.fatG,
  };
}

/** Fatias do anel de calorias, de 0 a 1 (somam 1). */
export type KcalSplit = { carbsG: number; proteinG: number; fatG: number; rest: number };

/**
 * Divide o anel de calorias da tela de Refeições: o anel inteiro é a meta do dia;
 * as calorias comidas viram uma fatia por macro (4 kcal/g de carbo e proteína,
 * 9 de gordura, na proporção de cada um) e o resto é o que ainda falta.
 * Passou da meta: o anel fecha só com os macros.
 */
export function kcalSplit(eaten: Macros, goalKcal: number): KcalSplit {
  const parts = { carbsG: eaten.carbsG * 4, proteinG: eaten.proteinG * 4, fatG: eaten.fatG * 9 };
  const partsSum = parts.carbsG + parts.proteinG + parts.fatG;
  const filled = partsSum > 0 ? Math.max(eaten.kcal, 0) || partsSum : 0;
  const whole = Math.max(filled, goalKcal);
  if (whole <= 0) return { carbsG: 0, proteinG: 0, fatG: 0, rest: 1 };

  const share = (kcal: number) => (partsSum > 0 ? (kcal / partsSum) * (filled / whole) : 0);
  return {
    carbsG: share(parts.carbsG),
    proteinG: share(parts.proteinG),
    fatG: share(parts.fatG),
    rest: Math.max(0, goalKcal - filled) / whole,
  };
}
