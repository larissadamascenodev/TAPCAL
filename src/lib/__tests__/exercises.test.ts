import { describe, expect, it } from '@jest/globals';

import { EXERCISES } from '@/data/exercises';
import { exerciseById, exerciseFrames, searchExercises } from '@/lib/exercises';
import { buildPlans, focusLabel, splitsFor, suggestedWeekdays, suggestExercises, toggleExercise } from '@/lib/split';

describe('biblioteca de exercícios', () => {
  it('ids únicos e todo grupo tem pelo menos um básico', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const m of ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'quadriceps', 'posterior', 'gluteos', 'panturrilha', 'abdomen'] as const) {
      expect(EXERCISES.some((e) => e.muscle === m && e.staple)).toBe(true);
    }
  });

  it('busca sem acento, em qualquer ordem, e filtra por músculo', () => {
    expect(searchExercises({ query: 'triceps corda' }).map((e) => e.name)).toContain('Tríceps corda');
    expect(searchExercises({ query: 'supino halteres' }).every((e) => e.name.includes('upino'))).toBe(true);
    const costas = searchExercises({ muscle: 'costas' });
    expect(costas.length).toBeGreaterThan(5);
    expect(costas.every((e) => e.muscle === 'costas')).toBe(true);
    // básicos primeiro
    expect(costas[0].staple).toBe(true);
  });

  it('as duas fotos do exercício', () => {
    const [a, b] = exerciseFrames('Barbell_Squat');
    expect(a).toMatch(/Barbell_Squat\/0\.jpg$/);
    expect(b).toMatch(/Barbell_Squat\/1\.jpg$/);
    expect(exerciseById('Barbell_Squat')?.name).toBe('Agachamento livre');
  });
});

describe('montar o treino personalizado', () => {
  it('divisões por quantidade de dias', () => {
    expect(splitsFor(3).map((s) => s.key)).toEqual(['fullbody', 'abc']);
    expect(splitsFor(4).map((s) => s.key)).toEqual(['ab', 'abcd']);
    expect(splitsFor(5).map((s) => s.key)).toEqual(['abcde']);
    expect(suggestedWeekdays(3)).toEqual([1, 3, 5]);
  });

  it('nome do foco', () => {
    expect(focusLabel(['peito', 'ombros', 'triceps'])).toBe('Peito, ombros e tríceps');
    expect(focusLabel(['costas'])).toBe('Costas');
  });

  it('ABC em 6 dias: três treinos, cada um em dois dias', () => {
    const plans = buildPlans({ weekdays: [1, 2, 3, 4, 5, 6], split: 'abc' });
    expect(plans.map((p) => p.name)).toEqual(['Treino A', 'Treino B', 'Treino C']);
    expect(plans.map((p) => p.weekdays)).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    expect(plans[0].focus).toBe('Peito, ombros e tríceps');
    expect(plans[0].exercises.every((e) => e.catalogId)).toBe(true);
  });

  it('ABCD em 4 dias: um treino por dia', () => {
    const plans = buildPlans({ weekdays: [5, 1, 2, 4], split: 'abcd' });
    expect(plans.map((p) => p.weekdays)).toEqual([[1], [2], [4], [5]]);
  });

  it('grupo em foco ganha um exercício a mais; composto primeiro com 4 séries', () => {
    const dia = ['peito', 'costas', 'ombros', 'triceps'] as const;
    const normal = suggestExercises('p', dia);
    const foco = suggestExercises('p', dia, ['triceps']);
    expect(foco.length).toBe(normal.length + 1);
    expect(normal[0].targetSets).toBe(4);
    expect(normal[1].targetSets).toBe(3);
  });

  it('dia com poucos grupos ainda tem pelo menos 5 exercícios', () => {
    const plans = buildPlans({ weekdays: [1, 2, 4, 5], split: 'abcd' });
    expect(plans.every((p) => p.exercises.length >= 5)).toBe(true);
    // peito e tríceps: completa pelos dois grupos
    expect(plans[0].exercises.map((e) => e.muscleGroup)).toEqual(['Peito', 'Peito', 'Peito', 'Tríceps', 'Tríceps']);
  });

  it('no máximo 8 exercícios por treino', () => {
    const plans = buildPlans({ weekdays: [1, 3], split: 'fullbody', focus: ['peito', 'costas', 'quadriceps', 'gluteos'] });
    expect(plans.every((p) => p.exercises.length <= 8)).toBe(true);
  });

  it('põe e tira exercício do treino', () => {
    const [plan] = buildPlans({ weekdays: [1, 3, 5], split: 'abc' });
    const added = toggleExercise(plan, 'Cable_Crossover');
    expect(added.exercises.at(-1)).toMatchObject({ catalogId: 'Cable_Crossover', name: 'Crossover na polia alta', targetSets: 3 });
    expect(toggleExercise(added, 'Cable_Crossover').exercises).toEqual(plan.exercises);
  });
});
