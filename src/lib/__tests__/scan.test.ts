import { describe, expect, it } from '@jest/globals';

import { adjustGrams, combineScan, editScanItem, MAX_GRAMS, normalizeScan, removeScanItem, sampleScan, scanTotals, toFoodItems } from '@/lib/scan';

const raw = {
  dish: 'Arroz, feijão e frango',
  confidence: 0.82,
  items: [
    { name: 'arroz branco', grams: 118, kcal_per_100g: 128, protein_per_100g: 2.5, carbs_per_100g: 28.1, fat_per_100g: 0.2 },
    { name: 'Feijão carioca', grams: '100', kcal_per_100g: '76', protein_per_100g: 4.8, carbs_per_100g: 13.6, fat_per_100g: 0.5 },
    { name: 'Frango grelhado', grams: 120, kcal_per_100g: 159, protein_per_100g: 32, carbs_per_100g: 0, fat_per_100g: 2.5 },
  ],
};

describe('resposta do scanner', () => {
  it('limpa e valida a resposta da IA', () => {
    const r = normalizeScan(raw)!;
    expect(r.dish).toBe('Arroz, feijão e frango');
    expect(r.confidence).toBe(0.82);
    expect(r.items.map((i) => [i.name, i.grams])).toEqual([
      ['Arroz branco', 120], // arredonda para múltiplo de 5 e põe maiúscula
      ['Feijão carioca', 100],
      ['Frango grelhado', 120],
    ]);
    expect(r.items[1].per100.kcal).toBe(76);
  });

  it('descarta itens quebrados e corta valores impossíveis', () => {
    const r = normalizeScan({
      items: [
        { name: '', grams: 100, kcal_per_100g: 100 },
        { name: 'Sem calorias', grams: 100 },
        { name: 'Porção gigante', grams: 99999, kcal_per_100g: 5000, protein_per_100g: -3 },
      ],
    })!;
    expect(r.items).toHaveLength(1);
    expect(r.items[0].grams).toBe(MAX_GRAMS);
    expect(r.items[0].per100.kcal).toBe(900);
    expect(r.items[0].per100.proteinG).toBe(0);
    expect(r.dish).toBe('Porção gigante');
    expect(r.confidence).toBe(0.5);
  });

  it('sem alimentos reconhecidos, não há resultado', () => {
    expect(normalizeScan({ items: [] })).toBeNull();
    expect(normalizeScan(null)).toBeNull();
    expect(normalizeScan({ dish: 'x' })).toBeNull();
  });
});

describe('porções', () => {
  it('soma o prato e recalcula ao ajustar a porção', () => {
    const r = normalizeScan(raw)!;
    // 128×1,2 + 76×1 + 159×1,2
    expect(scanTotals(r.items).kcal).toBe(154 + 76 + 191);

    const lessRice = adjustGrams(r.items, r.items[0].id, -20);
    expect(lessRice[0].grams).toBe(100);
    expect(scanTotals(lessRice).kcal).toBe(128 + 76 + 191);
  });

  it('porção não fica negativa e item com 0 g não é salvo', () => {
    const r = normalizeScan(raw)!;
    const noRice = adjustGrams(r.items, r.items[0].id, -500);
    expect(noRice[0].grams).toBe(0);
    const foods = toFoodItems(noRice);
    expect(foods.map((f) => f.name)).toEqual(['Feijão carioca', 'Frango grelhado']);
    expect(foods[0]).toMatchObject({ grams: 100, kcal: 76, source: 'scanner' });
  });

  it('exemplo usa valores da TACO', () => {
    // arroz 120 g (154) + feijão 100 g (76) + alcatra 130 g (313) + salada 60 g (7)
    expect(scanTotals(sampleScan().items).kcal).toBe(550);
  });
});

describe('corrigir um alimento do scanner', () => {
  const base = sampleScan().items;
  const id = base[0].id;

  it('troca o nome e a porção, arredondando de 5 em 5 g', () => {
    const [first] = editScanItem(base, id, { name: '  arroz integral ', grams: 183 });
    expect(first.name).toBe('Arroz integral');
    expect(first.grams).toBe(185);
    expect(first.per100).toEqual(base[0].per100);
  });

  it('ignora nome vazio e porção inválida, e limita a porção', () => {
    expect(editScanItem(base, id, { name: '   ', grams: Number.NaN })[0]).toEqual(base[0]);
    expect(editScanItem(base, id, { grams: 99999 })[0].grams).toBe(MAX_GRAMS);
    expect(editScanItem(base, id, { grams: -20 })[0].grams).toBe(0);
  });

  it('remove um alimento', () => {
    expect(removeScanItem(base, id).map((i) => i.id)).not.toContain(id);
  });
});

describe('juntar a estimativa da IA num alimento', () => {
  const per100 = { kcal: 200, proteinG: 10, carbsG: 20, fatG: 8 };
  it('um alimento só: mesmo nome, porção e valores por 100 g', () => {
    const r = combineScan({ dish: 'Coxinha', confidence: 0.8, items: [{ id: 'a', name: 'Coxinha de frango', grams: 80, per100 }] });
    expect(r).toEqual({ name: 'Coxinha de frango', grams: 80, per100 });
  });
  it('várias partes viram o prato, com a média por 100 g', () => {
    const r = combineScan({
      dish: 'Pão com ovo',
      confidence: 0.8,
      items: [
        { id: 'a', name: 'Pão', grams: 50, per100: { kcal: 300, proteinG: 8, carbsG: 58, fatG: 3 } },
        { id: 'b', name: 'Ovo', grams: 50, per100: { kcal: 140, proteinG: 13, carbsG: 1, fatG: 10 } },
      ],
    });
    expect(r).toEqual({ name: 'Pão com ovo', grams: 100, per100: { kcal: 220, proteinG: 10.5, carbsG: 29.5, fatG: 6.5 } });
  });
  it('sem gramas não dá para usar', () => {
    expect(combineScan({ dish: 'x', confidence: 0.5, items: [] })).toBeNull();
  });
});

