/**
 * Contas do plano e das sessões de treino: duração e kcal estimadas, volume,
 * recordes, números da semana e as kcal queimadas de cada dia.
 */

import { addDays } from '@/lib/dates';
import type { DateKey } from '@/types';
import type { ExercicioNoTreino, PlanoDeTreino, SerieFeita, SessaoDeTreino, SessaoEmAndamento, TreinoDoDia } from '@/types/treino';

import { kcalAtividade, MET_CARDIO, MET_MUSCULACAO } from './met';
import { datasDaSemana, diaDaData, DIAS, estadoDoDia, treinoDoDia } from './semana';

/** Duração estimada: séries × (40 s de execução + descanso) + cardio, arredondada a 5 min. */
export function minutosEstimados(treino: TreinoDoDia): number {
  const seg = treino.exercicios.reduce((sum, e) => sum + e.series * (40 + e.descansoSeg), 0);
  const total = seg / 60 + (treino.cardio?.minutos ?? 0);
  return Math.max(5, Math.round(total / 5) * 5);
}

/** kcal estimadas do treino do dia, pela mesma conta das sessões. */
export function kcalEstimadas(treino: TreinoDoDia, pesoKg: number): number {
  const cardio = treino.cardio;
  const minCardio = cardio?.minutos ?? 0;
  const minMusc = minutosEstimados(treino) - minCardio;
  const metCardio = cardio ? MET_CARDIO[cardio.atividade][cardio.intensidade] : 0;
  return Math.round(kcalAtividade(MET_MUSCULACAO, pesoKg, minMusc) + (cardio ? kcalAtividade(metCardio, pesoKg, minCardio) : 0));
}

/** Kcal queimadas em treinos numa data (conta no dia em que o treino foi FEITO). */
export function kcalQueimadas(sessoes: readonly SessaoDeTreino[], data: DateKey): number {
  return sessoes.filter((s) => s.data === data).reduce((sum, s) => sum + s.kcal, 0);
}

/** "8-12" ou "10". */
export function repsLabel(e: Pick<ExercicioNoTreino, 'repsMin' | 'repsMax'>): string {
  return e.repsMax > e.repsMin ? `${e.repsMin}–${e.repsMax}` : String(e.repsMin);
}

export function volume(series: readonly SerieFeita[]): number {
  return series.reduce((sum, s) => sum + s.cargaKg * s.reps, 0);
}

function melhor(a: SerieFeita, b: SerieFeita | null): boolean {
  return !b || a.cargaKg > b.cargaKg || (a.cargaKg === b.cargaKg && a.reps > b.reps);
}

/** Maior carga já feita num exercício da biblioteca (desempate: mais repetições). */
export function recorde(sessoes: readonly Pick<SessaoDeTreino, 'series'>[], exercicioId: string): SerieFeita | null {
  let best: SerieFeita | null = null;
  for (const s of sessoes) for (const x of s.series) if (x.exercicioId === exercicioId && melhor(x, best)) best = x;
  return best;
}

/** Séries do exercício na última sessão em que ele apareceu. */
export function ultimasSeries(sessoes: readonly SessaoDeTreino[], exercicioId: string): { data: DateKey; series: SerieFeita[] } | null {
  const ordenadas = [...sessoes].sort((a, b) => b.inicio.localeCompare(a.inicio));
  for (const s of ordenadas) {
    const series = s.series.filter((x) => x.exercicioId === exercicioId);
    if (series.length) return { data: s.data, series };
  }
  return null;
}

/** Uma série nova bate o recorde? Só vale se já existia recorde antes. */
export function bateRecorde(sessoes: readonly Pick<SessaoDeTreino, 'series'>[], exercicioId: string, cargaKg: number, reps: number): boolean {
  const pr = recorde(sessoes, exercicioId);
  return !!pr && (cargaKg > pr.cargaKg || (cargaKg === pr.cargaKg && reps > pr.reps));
}

/** Séries já feitas de um exercício do treino, na sessão em andamento. */
export function seriesFeitas(sessao: Pick<SessaoEmAndamento, 'series'>, exercicioNoTreinoId: string): number {
  return sessao.series.filter((s) => s.exercicioNoTreinoId === exercicioNoTreinoId).length;
}

/** Primeiro exercício do treino que ainda tem séries a fazer (ou o último). */
export function proximoExercicio(treino: TreinoDoDia, sessao: Pick<SessaoEmAndamento, 'series' | 'pulados'>): number {
  const i = treino.exercicios.findIndex((e) => !exercicioResolvido(sessao, e));
  return i === -1 ? treino.exercicios.length - 1 : i;
}

/** Exercício já resolvido na sessão: todas as séries feitas ou pulado. */
export function exercicioResolvido(sessao: Pick<SessaoEmAndamento, 'series' | 'pulados'>, e: Pick<ExercicioNoTreino, 'id' | 'series'>): boolean {
  return seriesFeitas(sessao, e.id) >= e.series || !!sessao.pulados?.includes(e.id);
}

/** Todos os exercícios do treino feitos ou pulados. */
export function treinoResolvido(treino: TreinoDoDia, sessao: Pick<SessaoEmAndamento, 'series' | 'pulados'>): boolean {
  return treino.exercicios.every((e) => exercicioResolvido(sessao, e));
}

export type NumerosDaSemana = { feitos: number; planejados: number; volumeKg: number; recordes: number; kcal: number };

/** Números da semana (segunda a domingo) de `hoje`. */
export function numerosDaSemana(plano: PlanoDeTreino | null, sessoes: readonly SessaoDeTreino[], hoje: DateKey): NumerosDaSemana {
  const semana = datasDaSemana(hoje);
  const naSemana = sessoes.filter((s) => s.data >= semana[0] && s.data <= semana[6]);
  const antes = sessoes.filter((s) => s.data < semana[0]);
  let recordes = 0;
  for (const id of new Set(naSemana.flatMap((s) => s.series.map((x) => x.exercicioId)))) {
    const prev = recorde(antes, id);
    const agora = recorde(naSemana, id);
    if (prev && agora && melhor(agora, prev)) recordes++;
  }
  return {
    feitos: DIAS.filter((d) => estadoDoDia(plano, sessoes, d, hoje).tipo === 'feito').length,
    planejados: plano?.treinos.length ?? 0,
    volumeKg: naSemana.reduce((sum, s) => sum + volume(s.series), 0),
    recordes,
    kcal: naSemana.reduce((sum, s) => sum + s.kcal, 0),
  };
}

/** Próximos treinos a partir de amanhã (olhando até 2 semanas), sem os já feitos nesta semana. */
export function proximosTreinos(
  plano: PlanoDeTreino | null,
  sessoes: readonly SessaoDeTreino[],
  hoje: DateKey,
  quantos = 3,
): { data: DateKey; treino: TreinoDoDia }[] {
  const out: { data: DateKey; treino: TreinoDoDia }[] = [];
  for (let i = 1; i <= 14 && out.length < quantos; i++) {
    const data = addDays(hoje, i);
    const treino = treinoDoDia(plano, diaDaData(data));
    if (!treino) continue;
    // Nesta semana, pula o que já foi adiantado.
    if (i < 7 && datasDaSemana(hoje).includes(data) && estadoDoDia(plano, sessoes, diaDaData(data), hoje).tipo === 'feito') continue;
    out.push({ data, treino });
  }
  return out;
}

/** Sessões terminadas, da mais recente para a mais antiga. */
export function concluidas(sessoes: readonly SessaoDeTreino[], quantas = 5): SessaoDeTreino[] {
  return [...sessoes].sort((a, b) => b.fim.localeCompare(a.fim)).slice(0, quantas);
}

/** Volume de cada um dos últimos `dias` dias, terminando hoje. */
export function volumePorDia(sessoes: readonly SessaoDeTreino[], hoje: DateKey, dias = 7): { data: DateKey; volumeKg: number }[] {
  return Array.from({ length: dias }, (_, i) => addDays(hoje, i - dias + 1)).map((data) => ({
    data,
    volumeKg: sessoes.filter((s) => s.data === data).reduce((sum, s) => sum + volume(s.series), 0),
  }));
}

/** Treinos feitos no mesmo mês de `hoje`. */
export function treinosNoMes(sessoes: readonly SessaoDeTreino[], hoje: DateKey): number {
  return sessoes.filter((s) => s.data.startsWith(hoje.slice(0, 7))).length;
}

export type ResumoDoExercicio = {
  /** Séries feitas do exercício, em ordem. */
  series: SerieFeita[];
  /** Tempo gasto no exercício (ms): do fim do que veio antes (ou do início do treino) até a última série. */
  tempoMs: number;
  /** Descanso antes de cada série, em segundos (a primeira não tem). */
  descansosSeg: (number | null)[];
  volumeKg: number;
};

const ms = (iso: string) => new Date(iso).getTime();

/** Resumo de um exercício numa sessão (em andamento ou concluída): tempo, descansos e volume. */
export function resumoDoExercicio(sessao: Pick<SessaoDeTreino, 'inicio' | 'series'>, exercicioNoTreinoId: string): ResumoDoExercicio {
  const series = sessao.series.filter((s) => s.exercicioNoTreinoId === exercicioNoTreinoId).sort((a, b) => ms(a.concluidaEm) - ms(b.concluidaEm));
  if (!series.length) return { series, tempoMs: 0, descansosSeg: [], volumeKg: 0 };
  const primeira = ms(series[0].concluidaEm);
  const antes = sessao.series.map((s) => ms(s.concluidaEm)).filter((t) => t < primeira);
  const comeco = antes.length ? Math.max(...antes) : ms(sessao.inicio);
  const fim = ms(series[series.length - 1].concluidaEm);
  return {
    series,
    tempoMs: Math.max(0, fim - comeco),
    descansosSeg: series.map((s, i) => (i === 0 ? null : Math.round((ms(s.concluidaEm) - ms(series[i - 1].concluidaEm)) / 1000))),
    volumeKg: volume(series),
  };
}
