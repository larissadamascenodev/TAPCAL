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
