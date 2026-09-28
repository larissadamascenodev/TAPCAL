/**
 * Montagem do treino personalizado: dias da semana, divisão (full body, AB,
 * ABC…) e foco viram os treinos da semana com exercícios sugeridos.
 */

import { EXERCISES, type MuscleKey } from '@/data/exercises';
import { MUSCLE_LABELS } from '@/lib/exercises';
import type { Exercise, WorkoutPlan } from '@/types';

export type SplitKey = 'fullbody' | 'ab' | 'abc' | 'ppl' | 'abcd' | 'abcde';

type DayTemplate = { muscles: MuscleKey[] };

export type SplitDef = {
  key: SplitKey;
  name: string;
  description: string;
  /** Quantos dias por semana essa divisão aceita. */
  days: readonly number[];
  templates: DayTemplate[];
};

export const SPLITS: readonly SplitDef[] = [
  {
    key: 'fullbody',
    name: 'Full body',
    description: 'Corpo todo em cada treino. Ótimo para começar ou para quem treina pouco.',
    days: [2, 3],
    templates: [
      { muscles: ['quadriceps', 'peito', 'costas', 'ombros', 'abdomen'] },
      { muscles: ['posterior', 'gluteos', 'costas', 'peito', 'biceps', 'triceps'] },
    ],
  },
  {
    key: 'ab',
    name: 'Superior e inferior',
    description: 'Um dia de parte de cima, outro de pernas e glúteos.',
    days: [2, 4],
    templates: [
      { muscles: ['peito', 'costas', 'ombros', 'biceps', 'triceps'] },
      { muscles: ['quadriceps', 'posterior', 'gluteos', 'panturrilha', 'abdomen'] },
    ],
  },
  {
    key: 'abc',
    name: 'ABC',
    description: 'Empurrar, puxar e pernas: cada grupo uma ou duas vezes por semana.',
    days: [3, 6],
    templates: [
      { muscles: ['peito', 'ombros', 'triceps'] },
      { muscles: ['costas', 'biceps', 'trapezio', 'abdomen'] },
      { muscles: ['quadriceps', 'posterior', 'gluteos', 'panturrilha'] },
    ],
  },
  {
    key: 'ppl',
    name: 'Push / Pull / Legs',
    description: 'Clássico de 6 dias: cada grupo duas vezes por semana.',
    days: [6],
    templates: [
      { muscles: ['peito', 'ombros', 'triceps'] },
      { muscles: ['costas', 'biceps', 'trapezio'] },
      { muscles: ['quadriceps', 'posterior', 'gluteos', 'panturrilha'] },
    ],
  },
  {
    key: 'abcd',
    name: 'ABCD',
    description: 'Quatro treinos: peito e tríceps, costas e bíceps, pernas, ombros e abdômen.',
    days: [4],
    templates: [
      { muscles: ['peito', 'triceps'] },
      { muscles: ['costas', 'biceps'] },
      { muscles: ['quadriceps', 'posterior', 'gluteos', 'panturrilha'] },
      { muscles: ['ombros', 'trapezio', 'abdomen'] },
    ],
  },
  {
    key: 'abcde',
    name: 'ABCDE',
    description: 'Um grupo grande por dia, para quem treina 5 vezes.',
    days: [5],
    templates: [
      { muscles: ['peito', 'abdomen'] },
      { muscles: ['costas', 'trapezio'] },
      { muscles: ['quadriceps', 'posterior', 'panturrilha'] },
      { muscles: ['ombros', 'gluteos'] },
      { muscles: ['biceps', 'triceps', 'antebraco'] },
    ],
  },
];

/** Divisões que combinam com a quantidade de dias escolhida. */
export function splitsFor(days: number): SplitDef[] {
  return SPLITS.filter((s) => s.days.includes(days));
}

/** Dias sugeridos (0 = domingo): espalhados na semana, sem o domingo. */
export function suggestedWeekdays(days: number): number[] {
  const table: Record<number, number[]> = {
    1: [1],
    2: [1, 4],
    3: [1, 3, 5],
    4: [1, 2, 4, 5],
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5, 6],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return table[Math.min(7, Math.max(1, days))];
}

/** Grupos grandes ganham dois exercícios; os pequenos, um. */
const BIG: ReadonlySet<MuscleKey> = new Set(['peito', 'costas', 'quadriceps', 'posterior', 'gluteos', 'ombros']);
/** Limites de exercícios por treino. */
const MAX_PER_DAY = 8;
const MIN_PER_DAY = 5;

/** "Peito, ombros e tríceps". */
export function focusLabel(muscles: readonly MuscleKey[]): string {
  const names = muscles.map((m, i) => (i === 0 ? MUSCLE_LABELS[m] : MUSCLE_LABELS[m].toLowerCase()));
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/** Exercício do plano a partir do catálogo, com séries e descanso padrão. */
export function planExercise(planId: string, catalogId: string, compound: boolean): Exercise {
  const ex = EXERCISES.find((e) => e.id === catalogId);
  return {
    id: `${planId}-${catalogId}`,
    catalogId,
    name: ex?.name ?? catalogId,
    muscleGroup: ex ? MUSCLE_LABELS[ex.muscle] : '',
    targetSets: compound ? 4 : 3,
    targetReps: compound ? '8-12' : '10-15',
    restSeconds: compound ? 90 : 60,
  };
}

/** Sugestões do dia: básicos de cada grupo, um a mais nos grupos em foco, e no
 * mínimo MIN_PER_DAY exercícios (completando pelos grupos do dia, em rodízio). */
export function suggestExercises(planId: string, muscles: readonly MuscleKey[], focus: readonly MuscleKey[] = []): Exercise[] {
  const staples = muscles.map((m) => EXERCISES.filter((e) => e.muscle === m && e.staple));
  const counts = muscles.map((m, i) => Math.min(staples[i].length, (BIG.has(m) ? 2 : 1) + (focus.includes(m) ? 1 : 0)));
  const total = () => counts.reduce((a, b) => a + b, 0);
  for (let round = 0; total() < MIN_PER_DAY && round < 6; round++) {
    for (let i = 0; i < muscles.length && total() < MIN_PER_DAY; i++) {
      if (counts[i] < staples[i].length) counts[i]++;
    }
  }
  const out: Exercise[] = [];
  muscles.forEach((m, i) =>
    staples[i].slice(0, counts[i]).forEach((e, j) => out.push(planExercise(planId, e.id, BIG.has(m) && j === 0))),
  );
  return out.slice(0, MAX_PER_DAY);
}

export type BuildInput = {
  weekdays: readonly number[];
  split: SplitKey;
  focus?: readonly MuscleKey[];
};

/**
 * Monta os treinos da semana: cada dia escolhido recebe o próximo treino da
 * divisão (A, B, C…, voltando ao A). Treinos iguais que se repetem na semana
 * viram um só, com vários dias.
 */
export function buildPlans({ weekdays, split, focus = [] }: BuildInput): WorkoutPlan[] {
  const def = SPLITS.find((s) => s.key === split) ?? SPLITS[0];
  const days = [...weekdays].sort((a, b) => a - b);
  const used = def.templates.slice(0, Math.max(1, Math.min(def.templates.length, days.length)));
  return used.map((t, i) => {
    const letter = String.fromCharCode(65 + i);
    const id = `plano-${letter.toLowerCase()}`;
    return {
      id,
      name: `Treino ${letter}`,
      focus: focusLabel(t.muscles),
      weekdays: days.filter((_, d) => d % used.length === i),
      exercises: suggestExercises(id, t.muscles, focus),
    };
  });
}

/** Põe ou tira um exercício da biblioteca do treino (entra no fim da lista). */
export function toggleExercise(plan: WorkoutPlan, catalogId: string): WorkoutPlan {
  const has = plan.exercises.some((e) => e.catalogId === catalogId);
  if (has) return { ...plan, exercises: plan.exercises.filter((e) => e.catalogId !== catalogId) };
  const ex = EXERCISES.find((e) => e.id === catalogId);
  const compound = !!ex && BIG.has(ex.muscle) && ex.equipment !== 'maquina' && ex.equipment !== 'polia';
  return { ...plan, exercises: [...plan.exercises, planExercise(plan.id, catalogId, compound)] };
}
