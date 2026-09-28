import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

import { goalPlan, remainingToday, workoutToday } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

const at = (y: number, m: number, d: number, h = 10, min = 0) => new Date(y, m - 1, d, h, min);
const store = () => useAppStore.getState();

const lanche = { name: 'Maçã', grams: 130, kcal: 72, proteinG: 0.4, carbsG: 19, fatG: 0.2, source: 'manual' as const };

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(at(2026, 9, 28));
  store().clearAll();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('virada do dia', () => {
  it('zera refeições e água num novo dia e guarda o dia anterior no histórico', () => {
    store().addFood('lanche', lanche);
    store().addWater(500);
    expect(store().today.date).toBe('2026-09-28');

    jest.setSystemTime(at(2026, 9, 29, 7));
    store().ensureToday();

    expect(store().today.date).toBe('2026-09-29');
    expect(store().today.waterMl).toBe(0);
    expect(store().today.meals.lanche).toHaveLength(0);
    expect(store().history).toHaveLength(1);
    expect(store().history[0].date).toBe('2026-09-28');
    expect(store().history[0].meals.lanche[0].name).toBe('Maçã');
  });

  it('comida registrada depois da meia-noite cai no dia novo, mesmo sem ensureToday', () => {
    store().addWater(300);
    jest.setSystemTime(at(2026, 9, 29, 0, 15));
    store().addFood('jantar', lanche);

    expect(store().today.date).toBe('2026-09-29');
    expect(store().today.waterMl).toBe(0);
    expect(store().today.meals.jantar).toHaveLength(1);
  });

  it('não guarda dia vazio no histórico', () => {
    jest.setSystemTime(at(2026, 9, 29));
    store().ensureToday();
    expect(store().history).toHaveLength(0);
  });

  it('não mexe em nada se ainda é o mesmo dia', () => {
    store().addWater(250);
    const before = store().today;
    jest.setSystemTime(at(2026, 9, 28, 23, 59));
    store().ensureToday();
    expect(store().today).toBe(before);
  });
});

describe('refeições, água e peso', () => {
  it('adiciona e apaga alimento', () => {
    const id = store().addFood('almoco', lanche);
    expect(store().today.meals.almoco.map((f) => f.id)).toEqual([id]);
    store().removeFood('almoco', id);
    expect(store().today.meals.almoco).toEqual([]);
  });

  it('água nunca fica negativa', () => {
    store().addWater(200);
    store().addWater(-500);
    expect(store().today.waterMl).toBe(0);
  });

  it('um peso por dia: registrar de novo substitui', () => {
    store().logWeight(70);
    store().logWeight(69.5);
    expect(store().weights).toHaveLength(1);
    expect(store().weights[0].weightKg).toBe(69.5);
  });
});

describe('treino', () => {
  it('registra séries e só guarda treino com pelo menos uma série', () => {
    store().startSession('plano-a');
    store().finishSession();
    expect(store().sessions).toHaveLength(0);

    store().startSession('plano-a');
    store().logSet('ex-supino', 12, 10);
    store().logSet('ex-supino', 14, 8);
    store().finishSession();

    expect(store().activeSession).toBeNull();
    expect(store().sessions).toHaveLength(1);
    expect(store().sessions[0].sets).toHaveLength(2);
    expect(store().sessions[0].finishedAt).not.toBeNull();
  });
});

describe('dados de exemplo', () => {
  it('abre com perfil, refeições, pesos e treino do dia', () => {
    store().loadSample();
    const s = store();

    expect(s.profile?.name).toBeTruthy();
    expect(s.today.date).toBe('2026-09-28');
    expect(s.today.meals.almoco.length).toBeGreaterThan(0);
    expect(s.weights.at(-1)?.date).toBe('2026-09-28');

    // 28/09/2026 é segunda-feira → Treino A
    expect(workoutToday(s, '2026-09-28')?.id).toBe('plano-a');

    const plan = goalPlan(s, '2026-09-28');
    expect(plan).not.toBeNull();
    expect(plan!.targetKcal).toBeGreaterThanOrEqual(1200);

    const left = remainingToday(s, '2026-09-28');
    expect(left!.kcal).toBe(plan!.targetKcal - 1033);
  });

  it('sem perfil não há plano', () => {
    expect(goalPlan(store())).toBeNull();
  });
});

describe('editar alimento registrado', () => {
  it('muda a porção e move para outra refeição', () => {
    const id = store().addFood('lanche', lanche);
    store().updateFood('lanche', id, { name: 'Maçã fuji', grams: 260 }, 'cafe_da_manha');
    expect(store().today.meals.lanche).toHaveLength(0);
    expect(store().today.meals.cafe_da_manha[0]).toMatchObject({ id, name: 'Maçã fuji', grams: 260, kcal: 144 });
  });
});

