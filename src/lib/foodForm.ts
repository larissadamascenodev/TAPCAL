/**
 * Validação do cadastro manual de alimento (enquanto o scanner não existe).
 * Recebe o texto dos campos e devolve o alimento pronto ou os erros por campo.
 */

import type { FoodSource } from '@/types';

export type FoodFormInput = {
  name: string;
  grams: string;
  kcal: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
};

export type FoodFormField = keyof FoodFormInput;

export type ParsedFood = {
  name: string;
  grams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: FoodSource;
};

export type FoodFormResult =
  | { ok: true; food: ParsedFood }
  | { ok: false; errors: Partial<Record<FoodFormField, string>> };

function num(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export function validateFoodForm(input: FoodFormInput): FoodFormResult {
  const errors: Partial<Record<FoodFormField, string>> = {};

  const name = input.name.trim();
  if (!name) errors.name = 'Dê um nome ao alimento';

  const grams = num(input.grams);
  if (grams == null) errors.grams = 'Informe a porção';
  else if (Number.isNaN(grams) || grams <= 0) errors.grams = 'Porção precisa ser maior que zero';
  else if (grams > 5000) errors.grams = 'Porção grande demais';

  const kcal = num(input.kcal);
  if (kcal == null) errors.kcal = 'Informe as calorias';
  else if (Number.isNaN(kcal) || kcal < 0) errors.kcal = 'Calorias inválidas';
  else if (kcal > 10000) errors.kcal = 'Calorias altas demais';

  // Macros são opcionais: vazio vira 0.
  const macros = { proteinG: 0, carbsG: 0, fatG: 0 };
  for (const key of ['proteinG', 'carbsG', 'fatG'] as const) {
    const v = num(input[key]);
    if (v == null) continue;
    if (Number.isNaN(v) || v < 0) errors[key] = 'Valor inválido';
    else macros[key] = v;
  }

  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    food: {
      name,
      grams: grams as number,
      kcal: Math.round(kcal as number),
      proteinG: Math.round(macros.proteinG * 10) / 10,
      carbsG: Math.round(macros.carbsG * 10) / 10,
      fatG: Math.round(macros.fatG * 10) / 10,
      source: 'manual',
    },
  };
}
