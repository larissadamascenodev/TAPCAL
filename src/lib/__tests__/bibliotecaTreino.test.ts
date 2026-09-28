import { describe, expect, it } from '@jest/globals';

import { EXERCICIOS } from '@/data/exercicios';
import {
  buscarExercicios,
  exercicioPorId,
  historicoDoExercicio,
  ladoDoMusculo,
  midiaDoExercicio,
  slugDoDesenho,
} from '@/lib/exercicios';
import type { WorkoutPlan, WorkoutSession } from '@/types';

describe('busca na biblioteca', () => {
  it('acha por nome alternativo, sem acento, em qualquer ordem', () => {
    expect(buscarExercicios({ busca: 'back squat' }).map((e) => e.id)).toEqual(['agachamento-livre-barra']);
    expect(buscarExercicios({ busca: 'triceps corda' }).map((e) => e.id)).toContain('triceps-corda');
    expect(buscarExercicios({ busca: 'hip thrust' }).map((e) => e.id)).toContain('elevacao-pelvica-barra');
  });

  it('filtra por músculo principal e por equipamento', () => {
    const costasPolia = buscarExercicios({ musculo: 'upper-back', equipamento: 'polia' });
    expect(costasPolia.length).toBeGreaterThan(2);
    expect(costasPolia.every((e) => e.musculoPrincipal === 'upper-back' && e.equipamentos.includes('polia'))).toBe(true);
    expect(buscarExercicios({}).length).toBe(EXERCICIOS.length);
  });
});

describe('mapa muscular e mídia', () => {
  it('abre de costas para músculos de trás', () => {
    expect(ladoDoMusculo('gluteal')).toBe('costas');
    expect(ladoDoMusculo('chest')).toBe('frente');
    expect(slugDoDesenho('abductors')).toBe('gluteal');
  });

  it('GIF quando existe (feminino para perfil feminino), senão mapa', () => {
    const e = exercicioPorId('prancha')!;
    expect(midiaDoExercicio(e, 'feminino')).toEqual({ tipo: 'mapa' });
    const comGif = { ...e, midia: { gifUrl: 'm.gif', gifUrlFeminino: 'f.gif' } };
    expect(midiaDoExercicio(comGif, 'feminino')).toEqual({ tipo: 'gif', url: 'f.gif' });
    expect(midiaDoExercicio(comGif, 'masculino')).toEqual({ tipo: 'gif', url: 'm.gif' });
  });
});

describe('histórico do exercício', () => {
  const plans: WorkoutPlan[] = [
    { id: 'a', name: 'A', focus: 'Pernas', weekdays: [1], exercises: [{ id: 'a-agacha', catalogId: 'agachamento-livre-barra', name: 'Agachamento', muscleGroup: 'Quadríceps', targetSets: 3, targetReps: '8-12', restSeconds: 90 }] },
  ];
  const s = (id: string, date: string, sets: [number, number][]): WorkoutSession => ({
    id,
    planId: 'a',
    date,
    startedAt: '',
    finishedAt: '',
    sets: sets.map(([w, r], i) => ({ id: `${id}${i}`, exerciseId: 'a-agacha', weightKg: w, reps: r, completedAt: '' })),
  });

  it('última sessão e recorde', () => {
    const h = historicoDoExercicio('agachamento-livre-barra', plans, [s('1', '2026-09-20', [[80, 5]]), s('2', '2026-09-27', [[70, 12], [70, 10]])]);
    expect(h.ultimaData).toBe('2026-09-27');
    expect(h.ultima.map((x) => x.reps)).toEqual([12, 10]);
    expect(h.recorde).toEqual({ weightKg: 80, reps: 5 });
  });

  it('sem registro', () => {
    expect(historicoDoExercicio('prancha', plans, [])).toEqual({ ultima: [], ultimaData: null, recorde: null });
  });
});
