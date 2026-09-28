import { describe, expect, it } from '@jest/globals';

import { SAMPLE_WORKOUT_PLANS } from '@/data/sample';
import {
  beatsRecord,
  estimatedMinutes,
  finishedSessions,
  isFreshRecord,
  lastWeightFor,
  nextExerciseIndex,
  personalRecord,
  planForDate,
  sessionMinutes,
  sessionVolume,
  shortFocus,
  startOfWeek,
  upcomingPlans,
  weekStats,
  recentVolumeByDay,
} from '@/lib/workout';
import type { WorkoutPlan, WorkoutSession } from '@/types';

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

describe('tela de treino', () => {
  const plans: WorkoutPlan[] = [
    { id: 'a', name: 'Treino A', focus: 'Peito', weekdays: [1, 4], exercises: [] },
    { id: 'b', name: 'Treino B', focus: 'Costas', weekdays: [2], exercises: [] },
  ];
  const set = (w: number, r: number) => ({ id: `${w}${r}`, exerciseId: 'x', weightKg: w, reps: r, completedAt: '2026-09-28T10:00:00.000Z' });

  it('próximos treinos a partir de amanhã', () => {
    // 2026-09-28 é segunda
    const next = upcomingPlans(plans, '2026-09-28', 3);
    expect(next.map((n) => [n.date, n.plan.id])).toEqual([
      ['2026-09-29', 'b'],
      ['2026-10-01', 'a'],
      ['2026-10-05', 'a'],
    ]);
  });

  it('concluídos do mais recente, com duração', () => {
    const s1 = { id: '1', planId: 'a', date: '2026-09-21', startedAt: '2026-09-21T10:00:00.000Z', finishedAt: '2026-09-21T10:52:00.000Z', sets: [] };
    const s2 = { id: '2', planId: 'b', date: '2026-09-22', startedAt: '2026-09-22T10:00:00.000Z', finishedAt: '2026-09-22T11:05:00.000Z', sets: [] };
    const open = { id: '3', planId: 'a', date: '2026-09-28', startedAt: '2026-09-28T10:00:00.000Z', finishedAt: null, sets: [] };
    expect(finishedSessions([s1, open, s2]).map((s) => s.id)).toEqual(['2', '1']);
    expect(sessionMinutes(s1)).toBe(52);
    expect(sessionMinutes(open)).toBe(0);
  });

  it('volume dos últimos 7 dias, terminando hoje', () => {
    const s = { id: '1', planId: 'a', date: '2026-09-28', startedAt: '', finishedAt: null, sets: [set(50, 10), set(50, 8)] };
    const days = recentVolumeByDay([s], '2026-09-30');
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe('2026-09-24');
    expect(days[6].date).toBe('2026-09-30');
    expect(days.find((d) => d.date === '2026-09-28')?.volumeKg).toBe(900);
    expect(days.reduce((sum, d) => sum + d.volumeKg, 0)).toBe(900);
  });
});
