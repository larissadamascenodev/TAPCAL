import { describe, expect, it } from '@jest/globals';

import { exercicioPorId } from '@/lib/exercicios';
import { ehSemanaDeAlivio, historicoQueConta, incremento, sugerirCarga } from '@/lib/treino/progressao';
import type { Exercicio, PlanoDeTreino, SerieFeita, SessaoDeTreino } from '@/types/treino';

const faixa = { repsMin: 10, repsMax: 12 };
const series = (carga: number, reps: number[]): SerieFeita[] =>
  reps.map((r, i) => ({ exercicioNoTreinoId: 'x', exercicioId: 'e', numero: i + 1, cargaKg: carga, reps: r, concluidaEm: '' }));

const ex = (id: string) => exercicioPorId(id) as Exercicio;
const agachamento = ex('agachamento-livre-barra');
const supinoBarra = ex('supino-reto-barra');
const supinoHalteres = ex('supino-reto-halteres');

describe('incremento de carga', () => {
  it('barra, máquina e polia +2 kg; compostos de pernas e glúteos +5 kg; halteres +2 kg (sempre inteiro)', () => {
    expect(incremento(supinoBarra)).toBe(2);
    expect(incremento(agachamento)).toBe(5);
    expect(incremento(supinoHalteres)).toBe(2);
    expect(incremento({ equipamentos: ['maquina'], tipo: 'isolado', musculoPrincipal: 'quadriceps' })).toBe(2);
    expect(incremento({ equipamentos: ['polia'], tipo: 'isolado', musculoPrincipal: 'triceps' })).toBe(2);
  });
});

describe('sugestão de carga', () => {
  it('sem histórico, não sugere (vale a carga inicial do plano)', () => {
    expect(sugerirCarga(faixa, supinoBarra, [])).toBeNull();
  });

  it('PRONTO QUANDO: 12, 12, 12 no agachamento → sobe a carga, com a explicação', () => {
    expect(sugerirCarga(faixa, agachamento, [series(60, [12, 12, 12])])).toEqual({
      tipo: 'subir',
      cargaKg: 65,
      repsAlvo: 10,
      motivo: 'Suba para 65 kg: você fez 12, 12, 12 na última vez',
    });
    expect(sugerirCarga(faixa, supinoBarra, [series(60, [12, 12, 12])])?.motivo).toBe('Suba para 62 kg: você fez 12, 12, 12 na última vez');
    expect(sugerirCarga(faixa, supinoHalteres, [series(20, [12, 13, 12])])?.cargaKg).toBe(22);
  });

  it('carga antiga quebrada (62,5) sobe para um número inteiro', () => {
    expect(sugerirCarga(faixa, supinoBarra, [series(62.5, [12, 12, 12])])?.cargaKg).toBe(65);
  });

  it('topo da faixa com cargas diferentes não sobe', () => {
    const misto = [...series(60, [12, 12]), ...series(62.5, [12]).map((s) => ({ ...s, numero: 3 }))];
    expect(sugerirCarga(faixa, supinoBarra, [misto])).toMatchObject({ tipo: 'manter', cargaKg: 62.5 });
  });

  it('entre o mínimo e o topo → mantém e busca mais repetições', () => {
    expect(sugerirCarga(faixa, supinoBarra, [series(60, [12, 11, 10])])).toEqual({
      tipo: 'manter',
      cargaKg: 60,
      repsAlvo: 12,
      motivo: 'Mantenha 60 kg e busque 12 repetições',
    });
  });

  it('abaixo do mínimo uma vez → mantém; duas seguidas → reduz cerca de 10%', () => {
    expect(sugerirCarga(faixa, supinoBarra, [series(60, [10, 9, 8]), series(60, [12, 11, 10])])).toMatchObject({
      tipo: 'manter',
      cargaKg: 60,
      motivo: 'Mantenha 60 kg e busque 10 repetições em todas as séries',
    });
    expect(sugerirCarga(faixa, supinoBarra, [series(60, [10, 9, 8]), series(60, [9, 8, 8])])).toEqual({
      tipo: 'reduzir',
      cargaKg: 54,
      repsAlvo: 10,
      motivo: 'Reduza para 54 kg: ficou abaixo de 10 repetições nas 2 últimas vezes',
    });
    // halteres andam de 2 em 2 kg; a redução sempre baixa pelo menos um passo
    expect(sugerirCarga(faixa, supinoHalteres, [series(12, [8, 7, 7]), series(12, [9, 8, 7])])?.cargaKg).toBe(10);
    expect(sugerirCarga(faixa, supinoHalteres, [series(4, [8]), series(4, [8])])?.cargaKg).toBe(2);
  });

  it('número fixo de repetições: o topo é o próprio número', () => {
    const fixo = { repsMin: 8, repsMax: 8 };
    expect(sugerirCarga(fixo, supinoBarra, [series(70, [8, 8, 8])])?.tipo).toBe('subir');
    expect(sugerirCarga(fixo, supinoBarra, [series(70, [8, 8, 7])])?.motivo).toBe('Mantenha 70 kg e busque 8 repetições em todas as séries');
  });

  it('peso do corpo: sem carga, sugere +1 repetição por série', () => {
    const flexao = { equipamentos: ['peso-corporal' as const], tipo: 'composto' as const, musculoPrincipal: 'chest' as const };
    expect(sugerirCarga(faixa, flexao, [series(0, [12, 12, 12])])).toEqual({
      tipo: 'mais-reps',
      cargaKg: 0,
      repsAlvo: 13,
      motivo: 'Faça 13 repetições por série: você fez 12, 12, 12 na última vez',
    });
    expect(sugerirCarga(faixa, flexao, [series(0, [8, 7]), series(0, [8, 8])])?.motivo).toBe('Busque 10 repetições em todas as séries');
  });
});

describe('semana de alívio e histórico', () => {
  const ia: PlanoDeTreino = {
    id: 'ia',
    nome: 'IA',
    origem: 'ia',
    ativo: true,
    criadoEm: '',
    treinos: [],
    ia: { respostas: {} as never, inicioBloco: '2026-09-07', semanasNoBloco: 5, explicacao: '' },
  };

  it('a 5ª semana de cada bloco é de alívio; planos sem bloco nunca', () => {
    expect(ehSemanaDeAlivio(ia, '2026-09-07')).toBe(false);
    expect(ehSemanaDeAlivio(ia, '2026-10-04')).toBe(false); // domingo da 4ª semana
    expect(ehSemanaDeAlivio(ia, '2026-10-05')).toBe(true); // segunda da 5ª
    expect(ehSemanaDeAlivio(ia, '2026-10-11')).toBe(true);
    expect(ehSemanaDeAlivio(ia, '2026-10-12')).toBe(false); // novo bloco
    expect(ehSemanaDeAlivio(ia, '2026-09-01')).toBe(false); // antes do bloco
    expect(ehSemanaDeAlivio({}, '2026-10-05')).toBe(false);
  });

  it('histórico ignora a semana de alívio e sessões sem o exercício', () => {
    const sessao = (id: string, data: string, planoId: string, carga: number, exercicioId = 'e'): SessaoDeTreino => ({
      id,
      planoId,
      treinoDoDiaId: 't',
      diaPlanejado: 'seg',
      data,
      inicio: `${data}T10:00:00`,
      fim: `${data}T11:00:00`,
      kcal: 0,
      series: series(carga, [12, 12]).map((s) => ({ ...s, exercicioId })),
    });
    const lista = [
      sessao('a', '2026-09-28', 'ia', 60),
      sessao('b', '2026-10-05', 'ia', 40), // alívio
      sessao('c', '2026-10-06', 'outro', 50, 'outro-exercicio'),
      sessao('d', '2026-09-21', 'ia', 57.5),
    ];
    const h = historicoQueConta(lista, [ia], 'e');
    expect(h.map((s) => s[0].cargaKg)).toEqual([60, 57.5]);
  });
});
