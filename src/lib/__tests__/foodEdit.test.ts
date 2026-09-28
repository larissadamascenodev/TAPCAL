import { describe, expect, it } from '@jest/globals';

import { emptyMeals } from '@/lib/day';
import { editFood, parseGrams, updateFoodInMeals } from '@/lib/foodEdit';
import type { FoodItem } from '@/types';

const frango: FoodItem = {
  id: 'f1',
  name: 'Frango grelhado',
  grams: 100,
  kcal: 159,
  proteinG: 32,
  carbsG: 0,
  fatG: 2.5,
  source: 'taco',
  createdAt: '2026-09-28T12:30:00.000Z',
};

describe('porção', () => {
  it('aceita inteiros de 1 a 2000 g, com vírgula ou ponto', () => {
    expect(parseGrams('150')).toBe(150);
    expect(parseGrams('120,6')).toBe(121);
    expect(parseGrams(' 80 ')).toBe(80);
    expect(parseGrams('0')).toBeNull();
    expect(parseGrams('2500')).toBeNull();
    expect(parseGrams('abc')).toBeNull();
  });
});

describe('editar alimento', () => {
  it('mudar a porção muda kcal e macros na mesma proporção', () => {
    const r = editFood(frango, { grams: 150 });
    expect(r).toMatchObject({ grams: 150, kcal: 239, proteinG: 48, carbsG: 0, fatG: 3.8 });
    expect(r.id).toBe('f1');
    expect(r.createdAt).toBe(frango.createdAt);
  });

  it('troca o nome (com inicial maiúscula) sem mexer nos valores', () => {
    const r = editFood(frango, { name: '  peito de frango ' });
    expect(r.name).toBe('Peito de frango');
    expect(r.kcal).toBe(159);
  });

  it('nome vazio ou porção inválida mantêm o que estava', () => {
    const r = editFood(frango, { name: '   ', grams: 0 });
    expect(r).toEqual(frango);
  });
});

describe('editar dentro das refeições', () => {
  const meals = { ...emptyMeals(), almoco: [frango] };

  it('edita no mesmo lugar', () => {
    const r = updateFoodInMeals(meals, 'almoco', 'f1', { grams: 200 });
    expect(r.almoco).toHaveLength(1);
    expect(r.almoco[0].kcal).toBe(318);
  });

  it('muda de refeição levando a edição junto', () => {
    const r = updateFoodInMeals(meals, 'almoco', 'f1', { grams: 50 }, 'jantar');
    expect(r.almoco).toHaveLength(0);
    expect(r.jantar).toHaveLength(1);
    expect(r.jantar[0]).toMatchObject({ id: 'f1', grams: 50, kcal: 80 });
  });

  it('alimento que não existe não muda nada', () => {
    expect(updateFoodInMeals(meals, 'jantar', 'f1', { grams: 50 })).toBe(meals);
  });
});
