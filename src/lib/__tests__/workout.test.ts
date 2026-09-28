import { describe, expect, it } from '@jest/globals';

import { SAMPLE_WORKOUT_PLANS } from '@/data/sample';
import {
  beatsRecord,
  estimatedMinutes,
  isFreshRecord,
  lastWeightFor,
  nextExerciseIndex,
  personalRecord,
  planForDate,
  sessionVolume,
  shortFocus,
  startOfWeek,
  weekStats,
} from '@/lib/workout';
import type { WorkoutSession } from '@/types';

type Spec = [exerciseId: string, weightKg: number, reps: number];

function session(id: string, date: string, specs: Spec[]): WorkoutSession {
  return {
    id,
    planId: 'plano-a',
    date,
    startedAt: `${date}T18:00:00`,
    finishedAt: `${date}T19:00:00`,
    sets: specs.map(([exerciseId, weightKg, reps], i) => ({
      id: `${id}-${i}`,
      exerciseId,
      weightKg,
      reps,
      completedAt: `${date}T18:${String(10 + i).padStart(2, '0')}:00`,
    })),
  };
}

// Semana de 21/09 (segunda) a 27/09; a semana de "hoje" (28/09) começa na segunda 28.
const old = session('old', '2026-09-22', [
  ['ex-supino', 12, 10],
  ['ex-supino', 14, 8],
  ['ex-triceps', 20, 12],
]);
const recent = session('recent', '2026-09-29', [
  ['ex-supino', 14, 10], // mesma carga, mais repetições → recorde
  ['ex-triceps', 18, 12],
]);

describe('divisão da semana', () => {
  it('acha o treino do dia', () => {
    expect(planForDate(SAMPLE_WORKOUT_PLANS, '2026-09-28')?.name).toBe('Treino A'); // segunda
    expect(planForDate(SAMPLE_WORKOUT_PLANS, '2026-09-30')?.name).toBe('Treino C'); // quarta
    expect(planForDate(SAMPLE_WORKOUT_PLANS, '2026-09-27')).toBeNull(); // domingo
  });

  it('gera rótulo curto', () => {
    expect(shortFocus(SAMPLE_WORKOUT_PLANS[0])).toBe('Peito');
    expect(shortFocus(SAMPLE_WORKOUT_PLANS[2])).toBe('Pernas');
  });

  it('semana começa na segunda', () => {
    expect(startOfWeek('2026-09-28')).toBe('2026-09-28'); // segunda
    expect(startOfWeek('2026-10-04')).toBe('2026-09-28'); // domingo
    expect(startOfWeek('2026-10-01')).toBe('2026-09-28'); // quinta
  });
});

describe('recordes e última carga', () => {
  it('recorde é a maior carga; empate desempata por repetições', () => {
    expect(personalRecord([old], 'ex-supino')).toMatchObject({ weightKg: 14, reps: 8 });
    expect(personalRecord([old, recent], 'ex-supino')).toMatchObject({ weightKg: 14, reps: 10 });
    expect(personalRecord([old], 'ex-agachamento')).toBeNull();
  });

  it('última carga vem da sessão mais recente', () => {
    expect(lastWeightFor([old, recent], 'ex-triceps')).toBe(18);
    expect(lastWeightFor([old], 'ex-agachamento')).toBeNull();
  });

  it('sabe se o recorde foi batido na última vez', () => {
    expect(isFreshRecord([old, recent], 'ex-supino')).toBe(true);
    expect(isFreshRecord([old, recent], 'ex-triceps')).toBe(false);
  });

  it('primeira vez num exercício não conta como recorde', () => {
    expect(isFreshRecord([old], 'ex-supino')).toBe(false);
  });

  it('série nova só é recorde se já existia um antes', () => {
    expect(beatsRecord([old], 'ex-supino', 16, 6)).toBe(true);
    expect(beatsRecord([old], 'ex-supino', 14, 8)).toBe(false);
    expect(beatsRecord([old], 'ex-supino', 14, 9)).toBe(true);
    expect(beatsRecord([old], 'ex-agachamento', 40, 10)).toBe(false);
  });
});

describe('estatísticas', () => {
  it('calcula volume da sessão', () => {
    // 12×10 + 14×8 + 20×12
    expect(sessionVolume(old)).toBe(472);
  });

  it('resume a semana: treinos, volume e recordes', () => {
    const stats = weekStats([old, recent], SAMPLE_WORKOUT_PLANS, '2026-09-30');
    expect(stats).toEqual({ done: 1, planned: 6, volumeKg: 14 * 10 + 18 * 12, records: 1 });
  });

  it('semana sem treino', () => {
    expect(weekStats([old], SAMPLE_WORKOUT_PLANS, '2026-09-30')).toEqual({
      done: 0,
      planned: 6,
      volumeKg: 0,
      records: 0,
    });
  });
});

describe('treino em andamento', () => {
  const plan = SAMPLE_WORKOUT_PLANS[0]; // supino 4 séries, crucifixo 3…

  it('vai para o próximo exercício quando as séries acabam', () => {
    const s = session('live', '2026-09-28', [
      ['ex-supino', 12, 10],
      ['ex-supino', 12, 10],
    ]);
    expect(nextExerciseIndex(plan, s)).toBe(0);
    s.sets.push(...session('x', '2026-09-28', [['ex-supino', 12, 10], ['ex-supino', 12, 10]]).sets);
    expect(nextExerciseIndex(plan, s)).toBe(1);
  });

  it('estima a duração em múltiplos de 5 min', () => {
    expect(estimatedMinutes(plan) % 5).toBe(0);
    expect(estimatedMinutes(plan)).toBeGreaterThan(20);
  });
});
