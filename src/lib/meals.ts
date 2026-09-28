import { MEAL_LABELS, MEAL_TYPES, type FoodItem, type MealType } from '@/types';

/** Refeição mais provável pela hora, quando a pessoa não escolheu uma. */
export function mealByHour(date: Date = new Date()): MealType {
  const h = date.getHours();
  if (h < 11) return 'cafe_da_manha';
  if (h < 15) return 'almoco';
  if (h < 18) return 'lanche';
  return 'jantar';
}

/** Nome curto para botões e pílulas ("Café" em vez de "Café da manhã"). */
export function mealShort(meal: MealType): string {
  return meal === 'cafe_da_manha' ? 'Café' : MEAL_LABELS[meal];
}

/** Lê a refeição de um parâmetro de rota; inválida → null. */
export function parseMeal(value: unknown): MealType | null {
  return MEAL_TYPES.includes(value as MealType) ? (value as MealType) : null;
}

export const MEAL_OPTIONS = MEAL_TYPES.map((m) => ({ value: m, label: mealShort(m) }));

/** Horário de referência de cada refeição, quando ainda não há registro. */
export const DEFAULT_MEAL_TIMES: Record<MealType, string> = {
  cafe_da_manha: '07:30',
  almoco: '12:30',
  lanche: '16:00',
  jantar: '20:00',
};

/** "HH:MM" no horário do aparelho. */
export function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Horário da refeição: o do primeiro alimento registrado ou o de referência. */
export function mealTime(meal: MealType, items: readonly FoodItem[]): string {
  return items.length ? timeOf(items[0].createdAt) : DEFAULT_MEAL_TIMES[meal];
}
