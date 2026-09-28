import { describe, expect, it } from '@jest/globals';

import { exercicioPorId } from '@/lib/exercicios';
import { buildPlans, focusLabel, splitsFor, suggestedWeekdays, suggestExercises, toggleExercise } from '@/lib/split';

describe('montar o treino personalizado', () => {
  it('divisões por quantidade de dias', () => {
    expect(splitsFor(3).map((s) => s.key)).toEqual(['fullbody', 'abc']);
    expect(splitsFor(4).map((s) => s.key)).toEqual(['ab', 'abcd']);
    expect(suggestedWeekdays(3)).toEqual([1, 3, 5]);
  });

  it('nome do foco', () => {
    expect(focusLabel(['chest', 'deltoids', 'triceps'])).toBe('Peito, ombros e tríceps');
  });

  it('ABC em 6 dias: três treinos, cada um em dois dias, exercícios da biblioteca', () => {
    const plans = buildPlans({ weekdays: [1, 2, 3, 4, 5, 6], split: 'abc' });
    expect(plans.map((p) => p.weekdays)).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    for (const p of plans) for (const e of p.exercises) expect(exercicioPorId(e.catalogId)).toBeDefined();
  });

  it('pelo menos 5 exercícios, no máximo 8, compostos com 4 séries', () => {
    const plans = buildPlans({ weekdays: [1, 2, 4, 5], split: 'abcd' });
    expect(plans.every((p) => p.exercises.length >= 5 && p.exercises.length <= 8)).toBe(true);
    const peito = suggestExercises('p', ['chest']);
    expect(peito[0].targetSets).toBe(4);
  });

  it('põe e tira exercício do treino', () => {
    const [plan] = buildPlans({ weekdays: [1, 3, 5], split: 'abc' });
    const added = toggleExercise(plan, 'crossover-polia');
    expect(added.exercises.at(-1)).toMatchObject({ catalogId: 'crossover-polia', name: 'Crossover na polia', targetSets: 3 });
    expect(toggleExercise(added, 'crossover-polia').exercises).toEqual(plan.exercises);
  });
});
