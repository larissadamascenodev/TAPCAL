/**
 * Busca na Tabela Brasileira de Composição de Alimentos (TACO, 4ª ed., NEPA/UNICAMP).
 * Valores por 100 g; a porção comida é calculada em `portion()`.
 */

import TACO_DATA from '@/data/taco.json';
import type { Macros } from '@/types';

export type TacoFood = Macros & {
  id: number;
  name: string;
  category: string;
};

export const TACO: readonly TacoFood[] = TACO_DATA as TacoFood[];

/** Minúsculas e sem acento: "Feijão" → "feijao". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const INDEX = TACO.map((f) => ({ food: f, key: normalize(f.name) }));

/**
 * Todos os termos precisam aparecer no nome ("frango peito" acha
 * "Frango, peito, sem pele, grelhado"). Nomes que começam com o primeiro termo
 * vêm antes; depois, os mais curtos (mais genéricos).
 */
export function searchTaco(query: string, limit = 30, foods = INDEX): TacoFood[] {
  const terms = normalize(query).split(/[\s,]+/).filter(Boolean);
  if (!terms.length) return [];
  return foods
    .filter(({ key }) => terms.every((t) => key.includes(t)))
    .map(({ food, key }) => ({
      food,
      score: (key.startsWith(terms[0]) ? 0 : 1000) + key.length,
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((r) => r.food);
}

/** Valores para uma porção em gramas, a partir dos valores por 100 g. */
export function portion(per100: Macros, grams: number): Macros {
  const f = Math.max(0, grams) / 100;
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    kcal: Math.round(per100.kcal * f),
    proteinG: r1(per100.proteinG * f),
    carbsG: r1(per100.carbsG * f),
    fatG: r1(per100.fatG * f),
  };
}

/** "Arroz, tipo 1, cozido" → "Arroz tipo 1 cozido", mais natural na lista do dia. */
export function displayName(name: string): string {
  return name.replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim();
}
