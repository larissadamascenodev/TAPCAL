/**
 * Regras científicas do treino com IA (SPEC-TREINOS, 5.2). Tudo aqui é
 * decidido por código; a IA só escolhe exercícios dentro destas regras.
 *
 * Fontes (conferir antes de exibir): Schoenfeld, Ogborn e Krieger 2016
 * (frequência) e 2017 (volume); ACSM 2009 (progressão); OMS 2020 (atividade
 * física); Compendium 2024 (METs, em lib/treino/met.ts).
 */

import type { Goal } from '@/types';
import type { Cardio, Exercicio, Musculo, RespostasTreinoIA } from '@/types/treino';

export type Nivel = RespostasTreinoIA['experiencia'];
export type Foco = RespostasTreinoIA['foco'][number];

export type ChaveSessao =
  | 'corpo-a'
  | 'corpo-b'
  | 'corpo-c'
  | 'superiores-a'
  | 'superiores-b'
  | 'inferiores-a'
  | 'inferiores-b'
  | 'empurrar'
  | 'puxar'
  | 'pernas-a'
  | 'pernas-b';

export type Molde = {
  chave: ChaveSessao;
  /** Músculos da sessão, do mais importante para o menos. */
  musculos: Musculo[];
  /** Sessão de pernas (para não cair em dias seguidos). */
  inferior: boolean;
  /** Só estes exercícios servem para o músculo nesta sessão (ex.: ombro no dia de puxar = posterior). */
  somente?: Partial<Record<Musculo, readonly string[]>>;
};

const DELTOIDE_POSTERIOR = ['crucifixo-invertido-halteres', 'crucifixo-invertido-maquina', 'face-pull'];

export const MOLDES: Record<ChaveSessao, Molde> = {
  'corpo-a': { chave: 'corpo-a', inferior: false, musculos: ['quadriceps', 'chest', 'upper-back', 'deltoids', 'hamstring', 'abs', 'triceps', 'biceps', 'calves'] },
  'corpo-b': { chave: 'corpo-b', inferior: false, musculos: ['gluteal', 'upper-back', 'chest', 'quadriceps', 'deltoids', 'biceps', 'triceps', 'abs', 'calves'] },
  'corpo-c': { chave: 'corpo-c', inferior: false, musculos: ['hamstring', 'chest', 'upper-back', 'quadriceps', 'deltoids', 'gluteal', 'abs', 'biceps', 'triceps'] },
  'superiores-a': { chave: 'superiores-a', inferior: false, musculos: ['chest', 'upper-back', 'deltoids', 'triceps', 'biceps', 'trapezius'] },
  'superiores-b': { chave: 'superiores-b', inferior: false, musculos: ['upper-back', 'chest', 'deltoids', 'biceps', 'triceps', 'trapezius'] },
  'inferiores-a': { chave: 'inferiores-a', inferior: true, musculos: ['quadriceps', 'hamstring', 'gluteal', 'calves', 'abs'] },
  'inferiores-b': { chave: 'inferiores-b', inferior: true, musculos: ['gluteal', 'hamstring', 'quadriceps', 'abs', 'calves'] },
  empurrar: { chave: 'empurrar', inferior: false, musculos: ['chest', 'deltoids', 'triceps', 'abs'] },
  puxar: { chave: 'puxar', inferior: false, musculos: ['upper-back', 'biceps', 'deltoids', 'trapezius', 'lower-back'], somente: { deltoids: DELTOIDE_POSTERIOR } },
  'pernas-a': { chave: 'pernas-a', inferior: true, musculos: ['quadriceps', 'gluteal', 'hamstring', 'calves', 'abs'] },
  'pernas-b': { chave: 'pernas-b', inferior: true, musculos: ['gluteal', 'hamstring', 'quadriceps', 'calves', 'abs'] },
};

export const NOME_SESSAO: Record<ChaveSessao, string> = {
  'corpo-a': 'Corpo todo A',
  'corpo-b': 'Corpo todo B',
  'corpo-c': 'Corpo todo C',
  'superiores-a': 'Superiores A',
  'superiores-b': 'Superiores B',
  'inferiores-a': 'Inferiores A',
  'inferiores-b': 'Inferiores B',
  empurrar: 'Empurrar',
  puxar: 'Puxar',
  'pernas-a': 'Pernas e glúteos',
  'pernas-b': 'Pernas e glúteos B',
};

/** Divisão pelo número de dias (tabela do SPEC). Iniciante só difere com 3 dias. */
export function divisao(dias: number, nivel: Nivel): ChaveSessao[] {
  switch (Math.min(6, Math.max(2, dias))) {
    case 2:
      return ['corpo-a', 'corpo-b'];
    case 3:
      return nivel === 'iniciante' ? ['corpo-a', 'corpo-b', 'corpo-c'] : ['superiores-a', 'inferiores-a', 'corpo-a'];
    case 4:
      return ['superiores-a', 'inferiores-a', 'superiores-b', 'inferiores-b'];
    case 5:
      return ['superiores-a', 'inferiores-a', 'empurrar', 'puxar', 'pernas-a'];
    default:
      return ['empurrar', 'puxar', 'pernas-a', 'empurrar', 'puxar', 'pernas-b'];
  }
}

/** Nome da divisão para a explicação ("corpo todo", "superiores e inferiores"…). */
export function nomeDaDivisao(dias: number, nivel: Nivel): string {
  const n = Math.min(6, Math.max(2, dias));
  if (n === 2 || (n === 3 && nivel === 'iniciante')) return 'corpo todo';
  if (n === 3) return 'superiores, inferiores e corpo todo';
  if (n === 4) return 'superiores e inferiores';
  if (n === 5) return 'superiores, inferiores, empurrar, puxar e pernas';
  return 'empurrar, puxar e pernas, duas vezes';
}

/** Séries por músculo na semana (Schoenfeld, Ogborn e Krieger, 2017). */
export const VOLUME_SEMANAL: Record<Nivel, readonly [number, number]> = {
  iniciante: [8, 10],
  intermediario: [10, 14],
  avancado: [14, 18],
};
export const VOLUME_MAX_FOCO = 20;
export const MAX_SERIES_MUSCULO_SESSAO = 10;
export const SERIES_POR_EXERCICIO = [2, 4] as const;

/** Alvo semanal de séries: meio da faixa; músculos de foco no topo, com até 30% a mais (máx. 20). */
export function volumeAlvo(nivel: Nivel, foco: boolean): number {
  const [min, max] = VOLUME_SEMANAL[nivel];
  return foco ? Math.min(VOLUME_MAX_FOCO, Math.round(max * 1.3)) : Math.round((min + max) / 2);
}

/** Exercícios por sessão pelo tempo: iniciante no mínimo, avançado no máximo. */
export const EXERCICIOS_POR_TEMPO: Record<RespostasTreinoIA['tempo'], readonly [number, number]> = {
  '30-45': [4, 5],
  '45-60': [5, 6],
  '60-90': [6, 8],
  '90+': [8, 9],
};

export function exerciciosPorSessao(tempo: RespostasTreinoIA['tempo'], nivel: Nivel): number {
  const [min, max] = EXERCICIOS_POR_TEMPO[tempo];
  if (nivel === 'iniciante') return min;
  if (nivel === 'avancado') return max;
  return Math.min(max, min + 1);
}

type Prescricao = { reps: readonly [number, number]; descansoSeg: number };

/** Repetições e descanso pelo objetivo do perfil e o tipo do exercício. */
export const PRESCRICAO: Record<Goal, Record<Exercicio['tipo'], Prescricao>> = {
  ganhar_massa: { composto: { reps: [6, 10], descansoSeg: 120 }, isolado: { reps: [10, 15], descansoSeg: 75 } },
  emagrecer: { composto: { reps: [8, 12], descansoSeg: 90 }, isolado: { reps: [12, 15], descansoSeg: 60 } },
  manter: { composto: { reps: [8, 12], descansoSeg: 90 }, isolado: { reps: [10, 15], descansoSeg: 60 } },
};

/** Músculos de cada foco. Abdutores e oblíquos só entram quando são foco. */
export const FOCO_MUSCULOS: Record<Foco, readonly Musculo[]> = {
  'corpo-todo': [],
  gluteos: ['gluteal', 'abductors'],
  pernas: ['quadriceps', 'hamstring'],
  abdomen: ['abs', 'obliques'],
  costas: ['upper-back'],
  peito: ['chest'],
  ombros: ['deltoids'],
  bracos: ['biceps', 'triceps'],
};

export const FOCO_LABELS: Record<Foco, string> = {
  'corpo-todo': 'Corpo todo',
  gluteos: 'Glúteos',
  pernas: 'Pernas',
  abdomen: 'Abdômen',
  costas: 'Costas',
  peito: 'Peito',
  ombros: 'Ombros',
  bracos: 'Braços',
};

/** Do maior grupo para o menor (ordem dentro da sessão). */
export const TAMANHO: readonly Musculo[] = [
  'quadriceps',
  'gluteal',
  'hamstring',
  'upper-back',
  'chest',
  'deltoids',
  'lower-back',
  'trapezius',
  'triceps',
  'biceps',
  'calves',
  'abs',
  'obliques',
  'adductors',
  'abductors',
  'forearm',
];

/** Grupos grandes: podem ter mais de um exercício na sessão e começam por composto. */
export const GRANDES: readonly Musculo[] = TAMANHO.slice(0, 6);

/** Plano da IA: 4 semanas normais e 1 de alívio. */
export const SEMANAS_NO_BLOCO = 5;
/** Na semana de alívio: séries × 0,6 (cerca de 40% menos), mínimo 1. */
export const FATOR_ALIVIO = 0.6;

/**
 * Cardio (OMS 2020: 150 a 300 min de atividade moderada por semana; o plano
 * começa abaixo disso e sobe 5 min a cada bloco). Iniciante: 15–20 min de
 * caminhada em 2 ou 3 dias; quem quer emagrecer: 20–30 min em 3 dias.
 */
export function cardioDoPlano(r: RespostasTreinoIA, objetivo: Goal, bloco = 1): { cardio: Cardio; dias: number } | null {
  if (r.cardio === 'agora-nao') return null;
  const atividade = r.cardio === 'ja-faco' ? (r.cardioAtividade ?? 'caminhada') : 'caminhada';
  const [base, teto] = objetivo === 'emagrecer' ? [20, 30] : r.experiencia === 'iniciante' || r.cardio === 'quero-comecar' ? [15, 20] : [20, 30];
  const minutos = Math.min(teto, base + 5 * Math.max(0, bloco - 1));
  const dias = objetivo === 'emagrecer' ? 3 : 2;
  return { cardio: { atividade, minutos, intensidade: 'moderada' }, dias };
}

/** Fontes para "De onde vêm os números". */
export const FONTES: readonly { titulo: string; uso: string }[] = [
  {
    titulo: 'Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass. Journal of Sports Sciences, 2017.',
    uso: 'Séries por músculo na semana',
  },
  {
    titulo: 'Schoenfeld BJ, Ogborn D, Krieger JW. Effects of resistance training frequency on measures of muscle hypertrophy. Sports Medicine, 2016.',
    uso: 'Cada músculo pelo menos 2 vezes por semana',
  },
  {
    titulo: 'American College of Sports Medicine. Progression models in resistance training for healthy adults. Medicine & Science in Sports & Exercise, 2009.',
    uso: 'Repetições, descanso e progressão de carga',
  },
  {
    titulo: 'Herrmann SD e colegas. 2024 Adult Compendium of Physical Activities. Journal of Sport and Health Science, 2024.',
    uso: 'Calorias de cada atividade (METs)',
  },
  {
    titulo: 'Organização Mundial da Saúde. Diretrizes sobre atividade física e comportamento sedentário, 2020.',
    uso: 'Minutos de cardio por semana',
  },
];
