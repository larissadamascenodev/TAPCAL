import { describe, expect, it } from '@jest/globals';

import { kcalSplit } from '@/lib/totals';

describe('anel de calorias', () => {
  it('sem nada comido, o anel é todo "falta"', () => {
    expect(kcalSplit({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }, 2000)).toEqual({ carbsG: 0, proteinG: 0, fatG: 0, rest: 1 });
  });

  it('divide o que foi comido pelos macros e deixa o resto da meta', () => {
    // 100 g de carbo (400 kcal), 50 g de proteína (200), 400/9 g de gordura (400)
    const r = kcalSplit({ kcal: 1000, proteinG: 50, carbsG: 100, fatG: 400 / 9 }, 2000);
    expect(r.carbsG).toBeCloseTo(0.2);
    expect(r.proteinG).toBeCloseTo(0.1);
    expect(r.fatG).toBeCloseTo(0.2);
    expect(r.rest).toBeCloseTo(0.5);
  });

  it('usa as calorias registradas como total, mesmo que os macros não batam exato', () => {
    const r = kcalSplit({ kcal: 500, proteinG: 25, carbsG: 25, fatG: 0 }, 1000);
    expect(r.carbsG + r.proteinG + r.fatG).toBeCloseTo(0.5);
    expect(r.carbsG).toBeCloseTo(r.proteinG);
  });

  it('passou da meta: o anel fecha só com os macros', () => {
    const r = kcalSplit({ kcal: 2500, proteinG: 100, carbsG: 300, fatG: 80 }, 2000);
    expect(r.rest).toBe(0);
    expect(r.carbsG + r.proteinG + r.fatG).toBeCloseTo(1);
  });
});
