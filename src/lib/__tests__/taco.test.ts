import { describe, expect, it } from '@jest/globals';

import { displayName, normalize, portion, searchTaco, TACO } from '@/lib/taco';

describe('tabela TACO', () => {
  it('tem os ~600 alimentos com valores por 100 g', () => {
    expect(TACO.length).toBeGreaterThan(590);
    const arroz = TACO.find((f) => f.name === 'Arroz, tipo 1, cozido');
    expect(arroz).toMatchObject({ kcal: 128, proteinG: 2.5, carbsG: 28.1, fatG: 0.2 });
  });

  it('busca sem acento e sem maiúscula', () => {
    expect(normalize('Feijão Carioca')).toBe('feijao carioca');
    const r = searchTaco('feijao carioca');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((f) => normalize(f.name).includes('carioca'))).toBe(true);
  });

  it('todos os termos precisam aparecer, em qualquer ordem', () => {
    const r = searchTaco('peito frango');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((f) => /frango/i.test(f.name) && /peito/i.test(f.name))).toBe(true);
  });

  it('nomes que começam com o termo vêm primeiro', () => {
    const r = searchTaco('banana');
    expect(normalize(r[0].name).startsWith('banana')).toBe(true);
  });

  it('busca vazia não retorna nada', () => {
    expect(searchTaco('   ')).toEqual([]);
    expect(searchTaco('xyzxyz')).toEqual([]);
  });

  it('calcula a porção a partir dos valores por 100 g', () => {
    const per100 = { kcal: 128, proteinG: 2.5, carbsG: 28.1, fatG: 0.2 };
    expect(portion(per100, 150)).toEqual({ kcal: 192, proteinG: 3.8, carbsG: 42.2, fatG: 0.3 });
    expect(portion(per100, 0).kcal).toBe(0);
    expect(portion(per100, -10).kcal).toBe(0);
  });

  it('deixa o nome mais natural', () => {
    expect(displayName('Arroz, tipo 1, cozido')).toBe('Arroz tipo 1 cozido');
  });
});
