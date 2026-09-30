/**
 * Progressão de carga (SPEC-TREINOS, etapa 4). Olha a última sessão em que o
 * exercício foi feito e sugere a carga do próximo treino, com o motivo:
 *
 * - bateu o topo da faixa em todas as séries, com a mesma carga → subir
 *   (barra, smith, máquina e polia +2 kg; compostos de pernas e glúteos
 *   +5 kg; halteres +2 kg; peso do corpo: +1 repetição por série). As cargas
 *   sugeridas são sempre inteiras: na academia a gente arredonda (nada de 42,5);
 * - ficou abaixo do mínimo em alguma série → manter; se aconteceu nas 2
 *   últimas sessões, reduzir cerca de 10%;
 * - entre uma coisa e outra → manter e buscar mais repetições.
 *
 * Sessões da semana de alívio (plano da IA, etapa 5) não contam.
 * Base: ACSM, Progression models in resistance training for healthy adults
 * (2009) — aumentar a carga em 2 a 10% ao passar das repetições alvo.
 */

import { daysBetween } from '@/lib/dates';
import { exercicioPorId } from '@/lib/exercicios';
import { formatDecimal } from '@/lib/format';
import type { DateKey } from '@/types';
import type { Exercicio, ExercicioNoTreino, PlanoDeTreino, SerieFeita, SessaoDeTreino, SessaoEmAndamento } from '@/types/treino';

/** Quantas sessões seguidas batendo o topo da faixa são exigidas para subir. */
export const SESSOES_PARA_SUBIR = 1;
/** Sessões seguidas abaixo do mínimo para sugerir reduzir. */
export const SESSOES_PARA_REDUZIR = 2;
/** Quanto reduzir quando a carga ficou pesada demais. */
export const FRACAO_REDUCAO = 0.1;

const PERNAS_E_GLUTEOS = new Set<Exercicio['musculoPrincipal']>(['quadriceps', 'gluteal', 'hamstring']);
const COM_ANILHAS = new Set<Exercicio['equipamentos'][number]>(['barra', 'smith', 'maquina', 'polia', 'anilha']);

export type Sugestao = {
  tipo: 'subir' | 'mais-reps' | 'manter' | 'reduzir';
  /** Carga sugerida (0 = peso do corpo). */
  cargaKg: number;
  /** Repetições para buscar em cada série. */
  repsAlvo: number;
  /** Frase para mostrar embaixo do campo Carga. */
  motivo: string;
};

type ExercicioInfo = Pick<Exercicio, 'equipamentos' | 'tipo' | 'musculoPrincipal'>;

/** Ajuste de carga na tela (− / +): de 1 em 1 kg. */
export const AJUSTE_KG = 1;

/** Passo em que a carga anda (e com que a redução arredonda): 2 kg. */
export const PASSO_KG = 2;

/** Incremento de carga do exercício (kg, sempre inteiro). */
export function incremento(ex: ExercicioInfo): number {
  if (ex.equipamentos.some((q) => COM_ANILHAS.has(q)) && ex.tipo === 'composto' && PERNAS_E_GLUTEOS.has(ex.musculoPrincipal)) return 5;
  return PASSO_KG;
}

/** A sessão é da semana de alívio do bloco (só planos da IA têm bloco). */
export function ehSemanaDeAlivio(plano: Pick<PlanoDeTreino, 'ia'> | undefined, data: DateKey): boolean {
  const ia = plano?.ia;
  if (!ia || ia.semanasNoBloco < 2) return false;
  const semana = Math.floor(daysBetween(ia.inicioBloco, data) / 7);
  return semana >= 0 && semana % ia.semanasNoBloco === ia.semanasNoBloco - 1;
}

/** Séries do exercício na semana de `data`: na de alívio, cerca de 40% menos (× 0,6, mínimo 1). */
export function seriesNaSemana(series: number, plano: Pick<PlanoDeTreino, 'ia'> | undefined, data: DateKey): number {
  return ehSemanaDeAlivio(plano, data) ? Math.max(1, Math.round(series * 0.6)) : series;
}

/** Semana do bloco em que `data` está (1 a semanasNoBloco); null se o plano não tem bloco ou já acabou. */
export function semanaDoBloco(plano: Pick<PlanoDeTreino, 'ia'> | undefined, data: DateKey): number | null {
  const ia = plano?.ia;
  if (!ia) return null;
  const semana = Math.floor(daysBetween(ia.inicioBloco, data) / 7) + 1;
  return semana >= 1 && semana <= ia.semanasNoBloco ? semana : null;
}

/** O bloco já está na última semana (alívio) ou terminou: hora de montar a próxima fase. */
export function horaDaProximaFase(plano: Pick<PlanoDeTreino, 'ia'> | undefined, data: DateKey): boolean {
  const ia = plano?.ia;
  return !!ia && Math.floor(daysBetween(ia.inicioBloco, data) / 7) + 1 >= ia.semanasNoBloco;
}

/** Séries do exercício em cada sessão que conta, da mais recente para a mais antiga. */
export function historicoQueConta(
  sessoes: readonly SessaoDeTreino[],
  planos: readonly Pick<PlanoDeTreino, 'id' | 'ia'>[],
  exercicioId: string,
): SerieFeita[][] {
  return [...sessoes]
    .sort((a, b) => b.inicio.localeCompare(a.inicio))
    .filter((s) => !ehSemanaDeAlivio(planos.find((p) => p.id === s.planoId), s.data))
    .map((s) => s.series.filter((x) => x.exercicioId === exercicioId).sort((a, b) => a.numero - b.numero))
    .filter((series) => series.length > 0);
}

const kg = (n: number) => `${formatDecimal(n)} kg`;
const listaReps = (series: readonly SerieFeita[]) => series.map((s) => s.reps).join(', ');
const cargaDe = (series: readonly SerieFeita[]) => Math.max(...series.map((s) => s.cargaKg));
const mesmaCarga = (series: readonly SerieFeita[]) => series.every((s) => s.cargaKg === series[0].cargaKg);
const bateuTopo = (series: readonly SerieFeita[], alvo: Pick<ExercicioNoTreino, 'repsMax'>) =>
  mesmaCarga(series) && series.every((s) => s.reps >= alvo.repsMax);
const abaixoDoMinimo = (series: readonly SerieFeita[], alvo: Pick<ExercicioNoTreino, 'repsMin'>) => series.some((s) => s.reps < alvo.repsMin);

/**
 * Sugestão para o exercício do treino, a partir do histórico (a sessão mais
 * recente primeiro). Sem histórico, devolve null (vale a carga inicial do plano).
 */
export function sugerirCarga(
  alvo: Pick<ExercicioNoTreino, 'repsMin' | 'repsMax'>,
  ex: ExercicioInfo,
  historico: readonly SerieFeita[][],
): Sugestao | null {
  const ultima = historico[0];
  if (!ultima?.length) return null;
  const carga = cargaDe(ultima);
  const semCarga = carga === 0;

  const subir = historico.length >= SESSOES_PARA_SUBIR && historico.slice(0, SESSOES_PARA_SUBIR).every((s) => bateuTopo(s, alvo) && cargaDe(s) === carga);
  if (subir) {
    if (semCarga) {
      const reps = Math.max(...ultima.map((s) => s.reps)) + 1;
      return { tipo: 'mais-reps', cargaKg: 0, repsAlvo: reps, motivo: `Faça ${reps} repetições por série: você fez ${listaReps(ultima)} na última vez` };
    }
    const nova = Math.round(carga + incremento(ex));
    return { tipo: 'subir', cargaKg: nova, repsAlvo: alvo.repsMin, motivo: `Suba para ${kg(nova)}: você fez ${listaReps(ultima)} na última vez` };
  }

  if (abaixoDoMinimo(ultima, alvo)) {
    const seguidas = historico.length >= SESSOES_PARA_REDUZIR && historico.slice(0, SESSOES_PARA_REDUZIR).every((s) => abaixoDoMinimo(s, alvo));
    if (seguidas && !semCarga) {
      const p = PASSO_KG;
      const nova = Math.max(0, Math.min(carga - p, Math.round((carga * (1 - FRACAO_REDUCAO)) / p) * p));
      return {
        tipo: 'reduzir',
        cargaKg: nova,
        repsAlvo: alvo.repsMin,
        motivo: `Reduza para ${kg(nova)}: ficou abaixo de ${alvo.repsMin} repetições nas ${SESSOES_PARA_REDUZIR} últimas vezes`,
      };
    }
    return {
      tipo: 'manter',
      cargaKg: carga,
      repsAlvo: alvo.repsMin,
      motivo: semCarga
        ? `Busque ${alvo.repsMin} repetições em todas as séries`
        : `Mantenha ${kg(carga)} e busque ${alvo.repsMin} repetições em todas as séries`,
    };
  }

  return {
    tipo: 'manter',
    cargaKg: carga,
    repsAlvo: alvo.repsMax,
    motivo: semCarga ? `Busque ${alvo.repsMax} repetições em todas as séries` : `Mantenha ${kg(carga)} e busque ${alvo.repsMax} repetições`,
  };
}

/** Sugestão da progressão para um exercício do treino (null = sem histórico). */
export function sugestaoDoExercicio(
  ex: ExercicioNoTreino,
  sessoes: readonly SessaoDeTreino[],
  planos: readonly Pick<PlanoDeTreino, 'id' | 'ia'>[],
): Sugestao | null {
  const info = exercicioPorId(ex.exercicioId);
  return info ? sugerirCarga(ex, info, historicoQueConta(sessoes, planos, ex.exercicioId)) : null;
}

/**
 * Carga e repetições para a próxima série: as da última série feita hoje;
 * senão, a sugestão da progressão; senão, a carga inicial do plano.
 */
export function valoresDaProximaSerie(
  ex: ExercicioNoTreino,
  sessao: Pick<SessaoEmAndamento, 'series'>,
  sessoes: readonly SessaoDeTreino[],
  planos: readonly Pick<PlanoDeTreino, 'id' | 'ia'>[],
): { kg: number; reps: number } {
  const aqui = sessao.series.filter((s) => s.exercicioNoTreinoId === ex.id).at(-1);
  if (aqui) return { kg: aqui.cargaKg, reps: aqui.reps };
  const sug = sugestaoDoExercicio(ex, sessoes, planos);
  if (sug) return { kg: sug.cargaKg, reps: sug.repsAlvo };
  return { kg: ex.cargaInicialKg ?? 10, reps: ex.repsMin };
}
