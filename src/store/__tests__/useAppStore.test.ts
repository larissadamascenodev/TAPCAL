import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

import { exercicioPorId } from '@/lib/exercicios';
import { historicoQueConta, sugerirCarga } from '@/lib/treino/progressao';
import { SAMPLE_PROFILE, SAMPLE_WORKOUT_PLANS, sampleSessions } from '@/data/sample';
import { burnedOn, goalPlan, remainingToday, workoutToday } from '@/store/selectors';
import { migrarStore, useAppStore } from '@/store/useAppStore';
import type { Profile } from '@/types';
import type { PlanoDeTreino } from '@/types/treino';

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
  const planoTeste = (): PlanoDeTreino => ({
    id: 'p',
    nome: 'Meu treino',
    origem: 'personalizado',
    ativo: true,
    criadoEm: '2026-09-01T10:00:00.000Z',
    treinos: [
      {
        id: 't-seg',
        dia: 'seg',
        nome: 'Pernas e glúteos',
        exercicios: [{ id: 'e1', exercicioId: 'agachamento-livre-barra', series: 3, repsMin: 10, repsMax: 12, descansoSeg: 90 }],
      },
    ],
  });

  it('só guarda treino com pelo menos uma série, numera as séries e calcula as kcal', () => {
    store().salvarPlano(planoTeste());
    store().comecarTreino('t-seg');
    store().finalizarTreino();
    expect(store().sessoes).toHaveLength(0);

    store().comecarTreino('t-seg');
    store().registrarSerie('e1', 60, 12);
    store().registrarSerie('e1', 60, 12);
    jest.advanceTimersByTime(60 * 60_000);
    store().finalizarTreino();

    expect(store().sessaoAtiva).toBeNull();
    const [s] = store().sessoes;
    expect(s.series.map((x) => [x.numero, x.exercicioId])).toEqual([
      [1, 'agachamento-livre-barra'],
      [2, 'agachamento-livre-barra'],
    ]);
    // sem peso registrado: usa 70 kg → (3,5 − 1) × 70 × 1 h
    expect(s.kcal).toBe(175);
  });

  it('PRONTO QUANDO: treino de segunda feito na terça conta nas queimadas de terça', () => {
    store().salvarPlano(planoTeste());
    jest.setSystemTime(at(2026, 9, 29, 18)); // terça
    store().comecarTreino('t-seg');
    store().registrarSerie('e1', 60, 10);
    jest.advanceTimersByTime(45 * 60_000);
    store().finalizarTreino();
    const [s] = store().sessoes;
    expect(s).toMatchObject({ diaPlanejado: 'seg', data: '2026-09-29' });
    expect(burnedOn(store(), '2026-09-29')).toBe(s.kcal);
    expect(burnedOn(store(), '2026-09-28')).toBe(0);
  });

  it('um plano ativo por vez: salvar outro desativa o anterior; duplicar e apagar', () => {
    store().salvarPlano(planoTeste());
    store().salvarPlano({ ...planoTeste(), id: 'q', nome: 'Outro' });
    expect(store().planos.map((p) => [p.id, p.ativo])).toEqual([
      ['p', false],
      ['q', true],
    ]);
    store().ativarPlano('p');
    store().duplicarPlano('p');
    expect(store().planos).toHaveLength(3);
    expect(store().planos[2]).toMatchObject({ nome: 'Meu treino (cópia)', ativo: false });
    expect(store().planos[2].treinos[0].id).not.toBe('t-seg');
    store().apagarPlano('q');
    expect(store().planos.map((p) => p.id)).not.toContain('q');
  });

  it('editar um plano troca ele no lugar, sem mexer em qual está ativo', () => {
    store().salvarPlano(planoTeste());
    store().salvarPlano({ ...planoTeste(), id: 'q', nome: 'Outro' });
    store().atualizarPlano({ ...planoTeste(), ativo: false, nome: 'Pernas' });
    expect(store().planos.map((p) => [p.id, p.nome, p.ativo])).toEqual([
      ['p', 'Pernas', false],
      ['q', 'Outro', true],
    ]);
  });

  it('exercício criado pela pessoa fica guardado e aparece na biblioteca', () => {
    const ex = store().criarExercicio({ nome: 'Remada no TRX', musculo: 'upper-back', equipamento: 'elastico' });
    expect(store().exerciciosUsuario).toEqual([ex]);
    expect(exercicioPorId(ex.id)?.origem).toBe('usuario');
    store().clearAll();
    expect(exercicioPorId(ex.id)).toBeUndefined();
  });

  it('PRONTO QUANDO (etapa 4): depois de 12, 12, 12 no agachamento, o próximo treino sugere subir', () => {
    store().salvarPlano(planoTeste());
    store().comecarTreino('t-seg');
    for (let i = 0; i < 3; i++) store().registrarSerie('e1', 60, 12);
    jest.advanceTimersByTime(40 * 60_000);
    store().finalizarTreino();

    jest.setSystemTime(at(2026, 10, 5)); // segunda seguinte
    const { sessoes, planos } = store();
    const alvo = planos[0].treinos[0].exercicios[0];
    const sug = sugerirCarga(alvo, exercicioPorId(alvo.exercicioId)!, historicoQueConta(sessoes, planos, alvo.exercicioId));
    expect(sug).toMatchObject({ tipo: 'subir', cargaKg: 65, motivo: 'Suba para 65 kg: você fez 12, 12, 12 na última vez' });
  });

  it('pausar: o tempo parado fica fora da duração e das kcal', () => {
    store().salvarPlano(planoTeste());
    store().comecarTreino('t-seg');
    store().registrarSerie('e1', 60, 12);
    jest.advanceTimersByTime(30 * 60_000);
    store().pausarTreino();
    jest.advanceTimersByTime(20 * 60_000); // pausado
    store().retomarTreino();
    jest.advanceTimersByTime(20 * 60_000);
    store().pausarTreino();
    jest.advanceTimersByTime(10 * 60_000); // termina pausado
    store().finalizarTreino();
    const [s] = store().sessoes;
    expect(s.pausaMs).toBe(30 * 60_000);
    expect('pausadoEm' in s).toBe(false);
    // 50 min de treino: (3,5 − 1) × 70 × 50/60
    expect(s.kcal).toBe(146);
  });

  it('descanso fica no treino: começa, ajusta, pula e não vai para o histórico', () => {
    store().salvarPlano(planoTeste());
    store().comecarTreino('t-seg');
    store().registrarSerie('e1', 60, 12);
    store().iniciarDescanso(90);
    const inicio = Date.now();
    expect(Date.parse(store().sessaoAtiva!.descansoAte!)).toBe(inicio + 90_000);
    expect(store().sessaoAtiva!.descansoSeg).toBe(90);
    store().ajustarDescanso(15);
    expect(Date.parse(store().sessaoAtiva!.descansoAte!)).toBe(inicio + 105_000);
    expect(store().sessaoAtiva!.descansoSeg).toBe(105);
    store().ajustarDescanso(-500); // nunca termina antes de 1 s a partir de agora
    expect(Date.parse(store().sessaoAtiva!.descansoAte!)).toBe(inicio + 1000);
    store().pularDescanso();
    expect('descansoAte' in store().sessaoAtiva!).toBe(false);
    store().iniciarDescanso(60);
    store().finalizarTreino();
    const [s] = store().sessoes;
    expect('descansoAte' in s).toBe(false);
    expect('descansoSeg' in s).toBe(false);
  });

  it('pular exercício: sai do descanso, o treino segue e o pulo não vai para o histórico', () => {
    store().salvarPlano(planoTeste());
    store().comecarTreino('t-seg');
    store().registrarSerie('e1', 60, 12);
    store().iniciarDescanso(90);
    store().pularExercicio('e1');
    store().pularExercicio('e1'); // não duplica
    expect(store().sessaoAtiva!.pulados).toEqual(['e1']);
    expect('descansoAte' in store().sessaoAtiva!).toBe(false);
    store().finalizarTreino();
    const [s] = store().sessoes;
    expect('pulados' in s).toBe(false);
    expect(s.series).toHaveLength(1);
  });

  it('cada série guarda quanto durou e o descanso de verdade antes dela', () => {
    store().salvarPlano(planoTeste());
    store().comecarTreino('t-seg');
    jest.advanceTimersByTime(60_000);
    store().registrarSerie('e1', 60, 12);
    store().iniciarDescanso(90);
    jest.advanceTimersByTime(100_000); // descanso acabou aos 90 s; 10 s de série
    store().registrarSerie('e1', 60, 12);
    store().iniciarDescanso(90);
    jest.advanceTimersByTime(30_000);
    store().pularDescanso(); // pulou com 30 s
    jest.advanceTimersByTime(40_000);
    store().registrarSerie('e1', 60, 12);
    const [a, b, c] = store().sessaoAtiva!.series;
    expect(a).toMatchObject({ duracaoSeg: 60 });
    expect('descansoSeg' in a).toBe(false);
    expect(b).toMatchObject({ duracaoSeg: 10, descansoSeg: 90 });
    expect(c).toMatchObject({ duracaoSeg: 40, descansoSeg: 30 });
    store().finalizarTreino();
    expect('proximaDesde' in store().sessoes[0]).toBe(false);
  });

  it('apagar série renumera as seguintes', () => {
    store().salvarPlano(planoTeste());
    store().comecarTreino('t-seg');
    store().registrarSerie('e1', 60, 12);
    store().registrarSerie('e1', 62.5, 10);
    store().registrarSerie('e1', 65, 8);
    store().apagarSerie('e1', 2);
    expect(store().sessaoAtiva?.series.map((x) => [x.numero, x.cargaKg])).toEqual([
      [1, 60],
      [2, 65],
    ]);
  });
});

describe('migração dos dados salvos (v1 → v2)', () => {
  it('treinos antigos viram um plano novo, com as sessões e a rotina de trabalho', () => {
    const antigo = {
      profile: { ...SAMPLE_PROFILE, workRoutine: undefined, activityLevel: 'moderado' },
      weights: [{ id: 'w', date: '2026-09-20', weightKg: 70 }],
      workoutPlans: SAMPLE_WORKOUT_PLANS,
      sessions: sampleSessions('2026-09-28'),
      activeSession: null,
    };
    const novo = migrarStore(antigo, 1) as { profile: Profile; planos: PlanoDeTreino[]; sessoes: unknown[] };
    expect(novo.profile.workRoutine).toBe('sentado');
    expect('activityLevel' in novo.profile).toBe(false);
    expect(novo.planos).toHaveLength(1);
    const [plano] = novo.planos;
    expect(plano.ativo).toBe(true);
    // A seg/qui, B ter/sex, C qua/sáb
    expect(plano.treinos.map((t) => t.dia)).toEqual(['seg', 'ter', 'qua', 'qui', 'sex', 'sab']);
    expect(plano.treinos[0].exercicios[0]).toMatchObject({ exercicioId: 'supino-reto-halteres', series: 4, repsMin: 8, repsMax: 12 });
    expect(novo.sessoes).toHaveLength(3);
    expect(migrarStore({ planos: [] }, 2)).toEqual({ planos: [] });
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

    // 28/09/2026 é segunda-feira → treino de peito, ombro e tríceps
    expect(workoutToday(s, '2026-09-28')?.nome).toBe('Peito, ombro e tríceps');
    expect(s.sessoes.every((x) => x.kcal > 0)).toBe(true);

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

