import { describe, expect, it } from '@jest/globals';

import { dayFraction } from '@/lib/dates';
import { foodEmoji } from '@/lib/foodEmoji';
import { mealTargets } from '@/lib/goals';
import { DEFAULT_MEAL_TIMES, mealTime } from '@/lib/meals';
import { streakMilestoneFraction, weightProgress } from '@/lib/progress';
import { proteinTip } from '@/lib/tips';
import { sessionsThisMonth } from '@/lib/workout';
import type { FoodItem, WorkoutSession } from '@/types';

describe('calorias por refeição', () => {
  it('divide a meta em 25/35/15/25 e fecha a soma no jantar', () => {
    const t = mealTargets(1634);
    expect(t).toEqual({ cafe_da_manha: 410, almoco: 570, lanche: 250, jantar: 404 });
    expect(t.cafe_da_manha + t.almoco + t.lanche + t.jantar).toBe(1634);
  });

  it('meta zero dá zero em tudo', () => {
    expect(mealTargets(0)).toEqual({ cafe_da_manha: 0, almoco: 0, lanche: 0, jantar: 0 });
  });
});

describe('dica de proteína', () => {
  it('sugere frango grelhado suficiente para o que falta', () => {
    expect(proteinTip(125, 78)).toEqual({ missingG: 47, chickenG: 150 });
  });

  it('some quando falta pouco ou já bateu a meta', () => {
    expect(proteinTip(125, 118)).toBeNull();
    expect(proteinTip(125, 140)).toBeNull();
  });
});

describe('fração do dia', () => {
  it('vai de 0 à meia-noite a quase 1 no fim do dia', () => {
    expect(dayFraction(new Date(2026, 8, 28, 0, 0))).toBe(0);
    expect(dayFraction(new Date(2026, 8, 28, 12, 0))).toBe(0.5);
    expect(dayFraction(new Date(2026, 8, 28, 18, 0))).toBe(0.75);
  });
});

describe('emoji do alimento', () => {
  it('reconhece pelo nome, sem ligar para acento', () => {
    expect(foodEmoji('Feijão carioca')).toBe('🫘');
    expect(foodEmoji('Peito de frango grelhado')).toBe('🍗');
    expect(foodEmoji('Café com leite')).toBe('☕');
    expect(foodEmoji('Pão francês')).toBe('🥖');
    expect(foodEmoji('Iogurte natural')).toBe('🥛');
    expect(foodEmoji('Macarrão integral')).toBe('🍝');
    expect(foodEmoji('Maçã')).toBe('🍎');
  });

  it('usa um prato quando não reconhece', () => {
    expect(foodEmoji('Coisa desconhecida')).toBe('🍽️');
  });
});

describe('horário da refeição', () => {
  const item = (createdAt: string): FoodItem => ({
    id: '1', name: 'Pão', grams: 50, kcal: 150, proteinG: 5, carbsG: 29, fatG: 2, source: 'manual', createdAt,
  });

  it('usa o horário do primeiro alimento', () => {
    expect(mealTime('almoco', [item('2026-09-28T12:47:00')])).toBe('12:47');
  });

  it('sem registro, usa o horário de referência', () => {
    expect(mealTime('jantar', [])).toBe(DEFAULT_MEAL_TIMES.jantar);
  });
});

describe('sequência e progresso do peso', () => {
  it('mostra quanto falta para fechar a semana de sequência', () => {
    expect(streakMilestoneFraction(0)).toBe(0);
    expect(streakMilestoneFraction(3)).toBeCloseTo(3 / 7);
    expect(streakMilestoneFraction(7)).toBe(1);
    expect(streakMilestoneFraction(8)).toBeCloseTo(1 / 7);
  });

  it('calcula o caminho do peso inicial até a meta ao emagrecer', () => {
    expect(weightProgress(71, 69.4, 65)).toEqual({ doneKg: 1.6, totalKg: 6, leftKg: 4.4, fraction: 1.6 / 6 });
  });

  it('também funciona para ganhar peso e não passa de 100%', () => {
    expect(weightProgress(60, 62, 64).fraction).toBe(0.5);
    expect(weightProgress(71, 64, 65)).toEqual({ doneKg: 7, totalKg: 6, leftKg: 0, fraction: 1 });
  });

  it('ir para o lado contrário não conta como progresso', () => {
    expect(weightProgress(71, 72, 65).doneKg).toBe(0);
  });
});

describe('treinos do mês', () => {
  const s = (date: string, finished = true): WorkoutSession => ({
    id: date, planId: 'a', date, startedAt: `${date}T10:00:00`, finishedAt: finished ? `${date}T11:00:00` : null, sets: [],
  });

  it('conta só os concluídos no mês de hoje', () => {
    const list = [s('2026-09-02'), s('2026-09-20'), s('2026-09-28', false), s('2026-08-30')];
    expect(sessionsThisMonth(list, '2026-09-28')).toBe(2);
  });
});
