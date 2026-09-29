import { describe, expect, it } from '@jest/globals';

import { inicioDoPeriodo, niveisDoMapa, seriesPorMusculo, sessoesNoPeriodo, totaisDoPeriodo, treinosMaisFeitos } from '@/lib/treino/relatorio';
import type { PlanoDeTreino, SessaoDeTreino } from '@/types/treino';

const serie = (exercicioId: string, numero: number) => ({ exercicioNoTreinoId: 'x', exercicioId, numero, cargaKg: 20, reps: 10, concluidaEm: '' });
const sessao = (id: string, data: string, treinoDoDiaId: string, exs: string[], min = 60, pausaMs = 0): SessaoDeTreino => ({
  id,
  planoId: 'p',
  treinoDoDiaId,
  diaPlanejado: 'seg',
  data,
  inicio: `${data}T10:00:00.000Z`,
  fim: new Date(Date.parse(`${data}T10:00:00.000Z`) + min * 60_000).toISOString(),
  pausaMs,
  kcal: 150,
  series: exs.map((e, i) => serie(e, i + 1)),
});
const plano = {
  id: 'p',
  treinos: [
    { id: 'a', nome: 'Costas e bíceps' },
    { id: 'b', nome: 'Pernas e glúteos' },
  ],
} as unknown as PlanoDeTreino;

describe('relatórios do treino', () => {
  const lista = [
    sessao('1', '2026-09-28', 'a', ['puxada-frontal-aberta', 'puxada-frontal-aberta', 'rosca-direta-barra']),
    sessao('2', '2026-09-29', 'b', ['agachamento-livre-barra', 'agachamento-livre-barra', 'agachamento-livre-barra', 'stiff-barra'], 45, 5 * 60_000),
    sessao('3', '2026-09-10', 'a', ['puxada-frontal-aberta']),
    sessao('4', '2026-08-01', 'a', ['puxada-frontal-aberta']),
  ];

  it('período: esta semana (desde segunda) ou os últimos 30 dias', () => {
    expect(inicioDoPeriodo('semana', '2026-09-30')).toBe('2026-09-28');
    expect(inicioDoPeriodo('30dias', '2026-09-30')).toBe('2026-09-01');
    expect(sessoesNoPeriodo(lista, 'semana', '2026-09-30').map((s) => s.id)).toEqual(['1', '2']);
    expect(sessoesNoPeriodo(lista, '30dias', '2026-09-30').map((s) => s.id)).toEqual(['1', '2', '3']);
  });

  it('séries por músculo e níveis do mapa de calor', () => {
    const m = seriesPorMusculo(lista.slice(0, 2));
    expect(m).toEqual([
      { musculo: 'quadriceps', series: 3 },
      { musculo: 'upper-back', series: 2 },
      { musculo: 'biceps', series: 1 },
      { musculo: 'hamstring', series: 1 },
    ]);
    expect(niveisDoMapa(m).map((x) => x.nivel)).toEqual([3, 3, 2, 2]);
    expect(niveisDoMapa([])).toEqual([]);
  });

  it('treinos mais feitos e totais (sem as pausas)', () => {
    expect(treinosMaisFeitos(lista.slice(0, 3), [plano])).toEqual([
      { nome: 'Costas e bíceps', vezes: 2 },
      { nome: 'Pernas e glúteos', vezes: 1 },
    ]);
    expect(totaisDoPeriodo(lista.slice(0, 2))).toEqual({ treinos: 2, minutos: 100, kcal: 300 });
  });
});
