/**
 * Converte os treinos do formato antigo (WorkoutPlan com dias da semana e
 * WorkoutSession com séries por exercício do plano) para o formato do SPEC
 * (PlanoDeTreino com um TreinoDoDia por dia e SessaoDeTreino).
 */

import { EXERCICIOS } from '@/data/exercicios';
import { newId } from '@/lib/id';
import { normalize } from '@/lib/taco';
import type { WorkoutPlan, WorkoutSession } from '@/types';
import type { DiaSemana, ExercicioNoTreino, PlanoDeTreino, SerieFeita, SessaoDeTreino, TreinoDoDia } from '@/types/treino';

import { kcalDaSessao } from './met';
import { diaDaData } from './semana';

/** getDay() (0 = domingo) → dia do app. */
const POR_GETDAY: readonly DiaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

/** Ids dos exercícios dos treinos de exemplo antigos. */
const IDS_ANTIGOS: Record<string, string> = {
  'ex-supino': 'supino-reto-halteres',
  'ex-crucifixo': 'crucifixo-inclinado-halteres',
  'ex-desenvolvimento': 'desenvolvimento-halteres',
  'ex-lateral': 'elevacao-lateral-halteres',
  'ex-triceps': 'triceps-polia-barra',
  'ex-puxada': 'puxada-frontal-aberta',
  'ex-remada': 'remada-baixa-triangulo',
  'ex-pulldown': 'pulldown-bracos-estendidos',
  'ex-rosca': 'rosca-direta-barra',
  'ex-agachamento': 'agachamento-livre-barra',
  'ex-leg': 'leg-press-45',
  'ex-stiff': 'stiff-barra',
  'ex-elevacao': 'elevacao-pelvica-barra',
  'ex-panturrilha': 'panturrilha-em-pe-maquina',
};

const POR_ID = new Set(EXERCICIOS.map((e) => e.id));

/** Acha o exercício da biblioteca: pelo id, pelos ids antigos ou pelo nome. */
export function exercicioDaBiblioteca(ex: { id: string; catalogId?: string; name: string }): string | null {
  if (ex.catalogId && POR_ID.has(ex.catalogId)) return ex.catalogId;
  const sufixo = Object.keys(IDS_ANTIGOS).find((k) => ex.id === k || ex.id.endsWith(`-${k}`));
  if (sufixo) return IDS_ANTIGOS[sufixo];
  const nome = normalize(ex.name);
  const achado =
    EXERCICIOS.find((e) => normalize(e.nome) === nome || e.nomesAlternativos.some((a) => normalize(a) === nome)) ??
    EXERCICIOS.find((e) => normalize(e.nome).startsWith(nome));
  return achado?.id ?? null;
}

/** "8-12" → 8 e 12; "10" → 10 e 10; ilegível → 10 e 12. */
function faixa(texto: string): { repsMin: number; repsMax: number } {
  const n = texto.match(/\d+/g)?.map(Number) ?? [];
  if (!n.length) return { repsMin: 10, repsMax: 12 };
  return { repsMin: n[0], repsMax: n[1] ?? n[0] };
}

export function converterPlanos(
  antigos: readonly WorkoutPlan[],
  sessoesAntigas: readonly WorkoutSession[],
  pesoKg: number,
  criadoEm = new Date().toISOString(),
): { plano: PlanoDeTreino | null; sessoes: SessaoDeTreino[] } {
  if (!antigos.length) return { plano: null, sessoes: [] };
  const planoId = 'plano-migrado';

  // Um TreinoDoDia por dia da semana de cada treino antigo.
  const treinos: TreinoDoDia[] = [];
  const exMap = new Map<string, { noTreinoId: string; exercicioId: string }>(); // `${treinoId}|${oldExId}`
  for (const p of antigos) {
    for (const wd of [...p.weekdays].sort()) {
      const dia = POR_GETDAY[wd];
      if (treinos.some((t) => t.dia === dia)) continue;
      const treinoId = `${p.id}-${dia}`;
      const exercicios: ExercicioNoTreino[] = [];
      for (const e of p.exercises) {
        const exercicioId = exercicioDaBiblioteca(e);
        if (!exercicioId) continue;
        const id = `${treinoId}-${e.id}`;
        exMap.set(`${treinoId}|${e.id}`, { noTreinoId: id, exercicioId });
        exercicios.push({ id, exercicioId, series: e.targetSets, ...faixa(e.targetReps), descansoSeg: e.restSeconds });
      }
      treinos.push({ id: treinoId, dia, nome: p.focus || p.name, exercicios });
    }
  }
  const ordem: DiaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  treinos.sort((a, b) => ordem.indexOf(a.dia) - ordem.indexOf(b.dia));

  const plano: PlanoDeTreino = { id: planoId, nome: 'Meu treino', origem: 'personalizado', ativo: true, treinos, criadoEm };

  const sessoes: SessaoDeTreino[] = sessoesAntigas
    .filter((s) => s.finishedAt && s.sets.length)
    .map((s) => {
      const antigo = antigos.find((p) => p.id === s.planId);
      const dia = diaDaData(s.date);
      // Treino daquele plano no dia em que foi feito; se não houver, o primeiro dele.
      const treino =
        treinos.find((t) => t.id === `${s.planId}-${dia}`) ?? treinos.find((t) => antigo && t.id.startsWith(`${antigo.id}-`)) ?? treinos[0];
      const contagem = new Map<string, number>();
      const series: SerieFeita[] = [];
      for (const x of s.sets) {
        const m = exMap.get(`${treino.id}|${x.exerciseId}`);
        if (!m) continue;
        const numero = (contagem.get(m.noTreinoId) ?? 0) + 1;
        contagem.set(m.noTreinoId, numero);
        series.push({ exercicioNoTreinoId: m.noTreinoId, exercicioId: m.exercicioId, numero, cargaKg: x.weightKg, reps: x.reps, concluidaEm: x.completedAt });
      }
      const fim = s.finishedAt as string;
      return {
        id: s.id,
        planoId,
        treinoDoDiaId: treino.id,
        diaPlanejado: treino.dia,
        data: s.date,
        inicio: s.startedAt,
        fim,
        series,
        kcal: kcalDaSessao({ inicio: s.startedAt }, fim, pesoKg),
      };
    });

  return { plano, sessoes };
}

/**
 * Plano novo a partir do montador "do meu jeito" (que ainda gera os treinos no
 * formato antigo): ids novos para não se misturar com planos guardados.
 */
export function planoDoMontador(treinos: readonly WorkoutPlan[], nome: string, criadoEm = new Date().toISOString()): PlanoDeTreino | null {
  const { plano } = converterPlanos(treinos, [], 70, criadoEm);
  if (!plano) return null;
  const id = newId();
  return {
    ...plano,
    id,
    nome,
    treinos: plano.treinos.map((t) => ({ ...t, id: `${id}-${t.dia}`, exercicios: t.exercicios.map((e) => ({ ...e, id: newId() })) })),
  };
}
