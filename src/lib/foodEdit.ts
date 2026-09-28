/**
 * Edição de um alimento já registrado: nome, porção e refeição.
 * Os valores (kcal e macros) acompanham a porção na mesma proporção.
 */

import type { FoodItem, Meals, MealType } from '@/types';

/** Porção máxima aceita na edição, em gramas. */
export const MAX_EDIT_GRAMS = 2000;

export type FoodPatch = { name?: string; grams?: number };

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Porção válida para salvar: número inteiro de 1 a MAX_EDIT_GRAMS; senão, null. */
export function parseGrams(value: number | string): number | null {
  const n = typeof value === 'number' ? value : Number(value.replace(',', '.').trim());
  if (!Number.isFinite(n)) return null;
  const g = Math.round(n);
  return g >= 1 && g <= MAX_EDIT_GRAMS ? g : null;
}

/**
 * Aplica a mudança num alimento. Nome vazio ou porção inválida mantêm o valor
 * anterior. Mudando a porção, kcal e macros mudam na mesma proporção.
 */
export function editFood(item: FoodItem, patch: FoodPatch): FoodItem {
  const name = patch.name?.trim();
  const grams = patch.grams == null ? null : parseGrams(patch.grams);
  const next: FoodItem = { ...item, name: name ? name.charAt(0).toUpperCase() + name.slice(1) : item.name };
  if (grams == null || grams === item.grams || item.grams <= 0) return next;

  const k = grams / item.grams;
  return {
    ...next,
    grams,
    kcal: Math.round(item.kcal * k),
    proteinG: r1(item.proteinG * k),
    carbsG: r1(item.carbsG * k),
    fatG: r1(item.fatG * k),
  };
}

/**
 * Edita um alimento e, se `to` for outra refeição, muda ele de lugar (vai para o
 * fim da nova refeição). Sem o alimento na refeição de origem, nada muda.
 */
export function updateFoodInMeals(meals: Meals, from: MealType, id: string, patch: FoodPatch, to: MealType = from): Meals {
  const item = meals[from].find((f) => f.id === id);
  if (!item) return meals;
  const edited = editFood(item, patch);

  if (to === from) {
    return { ...meals, [from]: meals[from].map((f) => (f.id === id ? edited : f)) };
  }
  return {
    ...meals,
    [from]: meals[from].filter((f) => f.id !== id),
    [to]: [...meals[to], edited],
  };
}
