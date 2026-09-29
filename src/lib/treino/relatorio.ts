/**
 * Relatórios da aba Treino › Semana: músculos mais trabalhados (séries do
 * músculo principal), treinos mais feitos, tempo e kcal no período.
 */

import { addDays } from '@/lib/dates';
import { exercicioPorId } from '@/lib/exercicios';
import type { DateKey } from '@/types';
import type { Musculo, PlanoDeTreino, SessaoDeTreino } from '@/types/treino';

import { minutosDaSessao } from './met';
import { datasDaSemana } from './semana';

export type Periodo = 'semana' | '30dias';

/** Primeiro dia do período: a segunda desta semana ou 29 dias atrás. */
export function inicioDoPeriodo(periodo: Periodo, hoje: DateKey): DateKey {
  return periodo === 'semana' ? datasDaSemana(hoje)[0] : addDays(hoje, -29);
}

export function sessoesNoPeriodo(sessoes: readonly SessaoDeTreino[], periodo: Periodo, hoje: DateKey): SessaoDeTreino[] {
  const desde = inicioDoPeriodo(periodo, hoje);
  return sessoes.filter((s) => s.data >= desde && s.data <= hoje);
}

/** Séries por músculo principal, do mais trabalhado para o menos. */
export function seriesPorMusculo(sessoes: readonly SessaoDeTreino[]): { musculo: Musculo; series: number }[] {
  const conta = new Map<Musculo, number>();
  for (const s of sessoes) {
    for (const x of s.series) {
      const m = exercicioPorId(x.exercicioId)?.musculoPrincipal;
      if (m) conta.set(m, (conta.get(m) ?? 0) + 1);
    }
  }
  return [...conta.entries()].map(([musculo, series]) => ({ musculo, series })).sort((a, b) => b.series - a.series);
}

/** Nível do mapa de calor (1 a 3) de cada músculo, relativo ao mais trabalhado. */
export function niveisDoMapa(lista: readonly { musculo: Musculo; series: number }[]): { musculo: Musculo; nivel: 1 | 2 | 3 }[] {
  const max = lista[0]?.series ?? 0;
  return lista.map(({ musculo, series }) => {
    const f = max ? series / max : 0;
    return { musculo, nivel: f > 0.66 ? 3 : f > 0.33 ? 2 : 1 };
  });
}

/** Treinos mais feitos no período (pelo nome do treino do dia). */
export function treinosMaisFeitos(sessoes: readonly SessaoDeTreino[], planos: readonly PlanoDeTreino[]): { nome: string; vezes: number }[] {
  const conta = new Map<string, number>();
  for (const s of sessoes) {
    const nome = planos.find((p) => p.id === s.planoId)?.treinos.find((t) => t.id === s.treinoDoDiaId)?.nome ?? 'Treino';
    conta.set(nome, (conta.get(nome) ?? 0) + 1);
  }
  return [...conta.entries()].map(([nome, vezes]) => ({ nome, vezes })).sort((a, b) => b.vezes - a.vezes || a.nome.localeCompare(b.nome));
}

/** Totais do período: treinos, minutos (sem pausas) e kcal. */
export function totaisDoPeriodo(sessoes: readonly SessaoDeTreino[]): { treinos: number; minutos: number; kcal: number } {
  return {
    treinos: sessoes.length,
    minutos: Math.round(sessoes.reduce((m, s) => m + minutosDaSessao(s.inicio, s.fim, s.pausaMs), 0)),
    kcal: sessoes.reduce((k, s) => k + s.kcal, 0),
  };
}
