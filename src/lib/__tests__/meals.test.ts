import { describe, expect, it } from '@jest/globals';

import { mealByHour, mealShort, parseMeal } from '@/lib/meals';

describe('refeições', () => {
  it('sugere a refeição pela hora', () => {
    expect(mealByHour(new Date(2026, 8, 28, 7))).toBe('cafe_da_manha');
    expect(mealByHour(new Date(2026, 8, 28, 12, 30))).toBe('almoco');
    expect(mealByHour(new Date(2026, 8, 28, 16))).toBe('lanche');
    expect(mealByHour(new Date(2026, 8, 28, 20))).toBe('jantar');
  });

  it('nome curto e leitura de parâmetro', () => {
    expect(mealShort('cafe_da_manha')).toBe('Café');
    expect(mealShort('jantar')).toBe('Jantar');
    expect(parseMeal('almoco')).toBe('almoco');
    expect(parseMeal('ceia')).toBeNull();
    expect(parseMeal(undefined)).toBeNull();
  });
});
