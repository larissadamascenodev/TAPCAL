import { describe, expect, it } from '@jest/globals';

import { kcalAtividade, kcalDaSessao, minutosDaSessao, tempoDeTreinoMs } from '@/lib/treino/met';
import { kcalEstimadas, kcalQueimadas, minutosEstimados, numerosDaSemana, proximosTreinos, repsLabel, resumoDoExercicio } from '@/lib/treino/plano';
import { datasDaSemana, diaDaData, estadoDoDia, notaFeitoEm } from '@/lib/treino/semana';
import type { PlanoDeTreino, SessaoDeTreino, TreinoDoDia } from '@/types/treino';

// 2026-09-28 é segunda-feira.
const SEG = '2026-09-28';
const TER = '2026-09-29';

const treino = (dia: TreinoDoDia['dia'], nome: string): TreinoDoDia => ({
  id: `t-${dia}`,
  dia,
  nome,
  exercicios: [{ id: `${dia}-1`, exercicioId: 'agachamento-livre-barra', series: 3, repsMin: 10, repsMax: 12, descansoSeg: 90 }],
});

const plano: PlanoDeTreino = {
  id: 'p1',
  nome: 'Meu treino',
  origem: 'personalizado',
  ativo: true,
  treinos: [treino('seg', 'Pernas e glúteos'), treino('qua', 'Superiores'), treino('sex', 'Corpo todo')],
  criadoEm: '2026-09-01T10:00:00.000Z',
};

const sessao = (treinoId: string, dia: TreinoDoDia['dia'], data: string, kcal = 200): SessaoDeTreino => ({
  id: `s-${treinoId}-${data}`,
  planoId: 'p1',
  treinoDoDiaId: treinoId,
  diaPlanejado: dia,
  data,
  inicio: `${data}T18:00:00.000Z`,
  fim: `${data}T19:00:00.000Z`,
  series: [],
  kcal,
});

describe('semana de segunda a domingo', () => {
  it('datas e dia da semana', () => {
    expect(datasDaSemana('2026-10-01')).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(datasDaSemana('2026-10-04')[0]).toBe(SEG); // domingo fecha a semana
    expect(diaDaData(SEG)).toBe('seg');
  });

  it('estados: feito, descanso, pendente e hoje', () => {
    expect(estadoDoDia(plano, [], 'seg', SEG)).toMatchObject({ tipo: 'pendente', hoje: true });
    expect(estadoDoDia(plano, [], 'ter', SEG)).toMatchObject({ tipo: 'descanso', hoje: false });
    expect(estadoDoDia(plano, [sessao('t-seg', 'seg', SEG)], 'seg', SEG)).toMatchObject({ tipo: 'feito' });
    expect(estadoDoDia(null, [], 'seg', SEG).tipo).toBe('descanso');
  });

  it('PRONTO QUANDO: o treino de segunda feito na terça marca a segunda como feita "na terça" e as kcal contam na terça', () => {
    const feita = sessao('t-seg', 'seg', TER, 260);
    const seg = estadoDoDia(plano, [feita], 'seg', TER);
    expect(seg).toMatchObject({ tipo: 'feito', feitoEm: TER });
    expect(notaFeitoEm(TER)).toBe('feito na terça');
    expect(notaFeitoEm('2026-10-03')).toBe('feito no sábado');
    // terça continua descanso: o calendário não muda sozinho
    expect(estadoDoDia(plano, [feita], 'ter', TER).tipo).toBe('descanso');
    expect(kcalQueimadas([feita], TER)).toBe(260);
    expect(kcalQueimadas([feita], SEG)).toBe(0);
  });

  it('adiantar o treino de sexta na quarta: sexta fica feita e sai dos próximos', () => {
    const adiantada = sessao('t-sex', 'sex', '2026-09-30');
    expect(estadoDoDia(plano, [adiantada], 'sex', '2026-09-30')).toMatchObject({ tipo: 'feito', feitoEm: '2026-09-30' });
    const prox = proximosTreinos(plano, [adiantada], '2026-09-30', 2);
    expect(prox.map((p) => p.data)).toEqual(['2026-10-05', '2026-10-07']);
  });

  it('sessão da semana passada não conta nesta semana', () => {
    expect(estadoDoDia(plano, [sessao('t-seg', 'seg', '2026-09-21')], 'seg', SEG).tipo).toBe('pendente');
  });

  it('números da semana', () => {
    const n = numerosDaSemana(plano, [sessao('t-seg', 'seg', TER, 250), sessao('t-qua', 'qua', '2026-09-21', 300)], TER);
    expect(n).toMatchObject({ feitos: 1, planejados: 3, kcal: 250 });
  });
});

describe('kcal do treino por MET', () => {
  it('(MET − 1) × peso × horas', () => {
    // musculação 3,5 · 70 kg · 1 h = 175
    expect(kcalAtividade(3.5, 70, 60)).toBeCloseTo(175);
    expect(kcalDaSessao({ inicio: '2026-09-28T18:00:00.000Z' }, '2026-09-28T19:00:00.000Z', 70)).toBe(175);
  });

  it('limita a 3 horas quando a pessoa esquece de finalizar', () => {
    expect(minutosDaSessao('2026-09-28T08:00:00.000Z', '2026-09-28T20:00:00.000Z')).toBe(180);
    expect(kcalDaSessao({ inicio: '2026-09-28T08:00:00.000Z' }, '2026-09-28T20:00:00.000Z', 70)).toBe(525);
  });

  it('minutos de cardio usam o MET do cardio', () => {
    // 60 min: 40 de musculação (3,5) + 20 de corrida moderada (8,3), 70 kg
    const k = kcalDaSessao(
      { inicio: '2026-09-28T18:00:00.000Z', cardioMinutos: 20 },
      '2026-09-28T19:00:00.000Z',
      70,
      { atividade: 'corrida', minutos: 20, intensidade: 'moderada' },
    );
    expect(k).toBe(Math.round(2.5 * 70 * (40 / 60) + 7.3 * 70 * (20 / 60)));
  });

  it('estimativa do card do dia', () => {
    const t = treino('seg', 'Pernas');
    // 3 × (40 + 90) s = 6,5 min → 5 min
    expect(minutosEstimados(t)).toBe(5);
    expect(kcalEstimadas(t, 70)).toBe(Math.round(2.5 * 70 * (5 / 60)));
    expect(repsLabel({ repsMin: 10, repsMax: 12 })).toBe('10–12');
    expect(repsLabel({ repsMin: 10, repsMax: 10 })).toBe('10');
  });
});

describe('cronômetro com pausa', () => {
  it('desconta as pausas e congela enquanto pausado', () => {
    const inicio = '2026-09-29T10:00:00.000Z';
    const agora = Date.parse('2026-09-29T11:00:00.000Z');
    expect(tempoDeTreinoMs({ inicio }, agora)).toBe(60 * 60_000);
    expect(tempoDeTreinoMs({ inicio, pausaMs: 15 * 60_000 }, agora)).toBe(45 * 60_000);
    expect(tempoDeTreinoMs({ inicio, pausaMs: 5 * 60_000, pausadoEm: '2026-09-29T10:40:00.000Z' }, agora)).toBe(35 * 60_000);
    expect(minutosDaSessao(inicio, '2026-09-29T11:00:00.000Z', 20 * 60_000)).toBe(40);
  });
});

describe('resumo do exercício', () => {
  const serie = (ex: string, numero: number, hora: string, carga = 40, reps = 10) => ({
    exercicioNoTreinoId: ex,
    exercicioId: ex,
    numero,
    cargaKg: carga,
    reps,
    concluidaEm: `2026-09-29T${hora}:00.000Z`,
  });
  const sessao = {
    inicio: '2026-09-29T18:00:00.000Z',
    series: [serie('a', 1, '18:04'), serie('a', 2, '18:06'), serie('b', 1, '18:10', 20, 12), serie('b', 2, '18:12', 20, 12)],
  };

  it('primeiro exercício conta desde o início do treino; o seguinte, desde a última série do anterior', () => {
    const a = resumoDoExercicio(sessao, 'a');
    expect(a.tempoMs).toBe(6 * 60 * 1000);
    expect(a.descansosSeg).toEqual([null, 120]);
    expect(a.volumeKg).toBe(800);
    const b = resumoDoExercicio(sessao, 'b');
    expect(b.tempoMs).toBe(6 * 60 * 1000);
    expect(b.series.map((s) => s.numero)).toEqual([1, 2]);
  });

  it('exercício sem séries: tudo zerado', () => {
    expect(resumoDoExercicio(sessao, 'c')).toEqual({ series: [], tempoMs: 0, descansosSeg: [], volumeKg: 0 });
  });
});
