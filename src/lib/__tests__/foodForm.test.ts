import { describe, expect, it } from '@jest/globals';

import { validateFoodForm } from '@/lib/foodForm';

const base = { name: 'Pão de queijo', grams: '50', kcal: '180', proteinG: '', carbsG: '', fatG: '' };

describe('cadastro manual de alimento', () => {
  it('aceita só nome, gramas e kcal (macros viram 0)', () => {
    expect(validateFoodForm(base)).toEqual({
      ok: true,
      food: { name: 'Pão de queijo', grams: 50, kcal: 180, proteinG: 0, carbsG: 0, fatG: 0, source: 'manual' },
    });
  });

  it('lê vírgula como decimal', () => {
    const r = validateFoodForm({ ...base, grams: '12,5', proteinG: '4,25' });
    expect(r.ok && r.food.grams).toBe(12.5);
    expect(r.ok && r.food.proteinG).toBe(4.3);
  });

  it('aponta os campos obrigatórios', () => {
    const r = validateFoodForm({ ...base, name: '  ', grams: '', kcal: '' });
    expect(r.ok).toBe(false);
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(['grams', 'kcal', 'name']);
  });

  it('recusa valores impossíveis', () => {
    const r = validateFoodForm({ ...base, grams: '0', kcal: '-5', fatG: 'abc' });
    expect(!r.ok && r.errors).toEqual({
      grams: 'Porção precisa ser maior que zero',
      kcal: 'Calorias inválidas',
      fatG: 'Valor inválido',
    });
  });
});
