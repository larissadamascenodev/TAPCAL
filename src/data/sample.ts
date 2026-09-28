/**
 * Dados de exemplo para o app abrir preenchido enquanto não existe onboarding.
 * Tudo é gerado relativo a "hoje", então o exemplo nunca fica velho.
 *
 * SAMPLE_PROFILE: troque pelos seus dados reais (os marcados com ⚠️ são palpites).
 */

import { addDays } from '@/lib/dates';
import { emptyMeals } from '@/lib/day';
import type {
  DateKey,
  DayLog,
  FoodItem,
  Profile,
  WeightEntry,
  WorkoutPlan,
  WorkoutSession,
} from '@/types';

export const SAMPLE_PROFILE: Profile = {
  name: 'Larissa',
  sex: 'feminino',
  birthDate: '1995-06-15', // ⚠️ palpite
  heightCm: 165, // ⚠️ palpite
  startWeightKg: 71,
  targetWeightKg: 65,
  activityLevel: 'moderado', // ⚠️ palpite
  goal: 'emagrecer',
  pace: 'moderado',
  usesGlp1: false,
  createdAt: '2026-08-31T12:00:00.000Z',
};

// Valores por porção, arredondados a partir da tabela TACO.
function food(
  id: string,
  name: string,
  grams: number,
  kcal: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  date: DateKey,
  time: string,
): FoodItem {
  return { id, name, grams, kcal, proteinG, carbsG, fatG, source: 'manual', createdAt: `${date}T${time}` };
}

export function sampleDay(date: DateKey): DayLog {
  const meals = emptyMeals();
  meals.cafe_da_manha = [
    food('s-pao', 'Pão francês', 50, 150, 4.7, 29.3, 1.6, date, '07:30:00'),
    food('s-ovo', 'Ovo cozido (2 unidades)', 100, 146, 13.3, 0.6, 9.5, date, '07:30:00'),
    food('s-cafe', 'Café com leite', 200, 100, 5, 8, 5, date, '07:30:00'),
  ];
  meals.almoco = [
    food('s-arroz', 'Arroz branco', 150, 192, 3.8, 42.2, 0.3, date, '12:30:00'),
    food('s-feijao', 'Feijão carioca', 100, 76, 4.8, 13.6, 0.5, date, '12:30:00'),
    food('s-frango', 'Peito de frango grelhado', 120, 191, 38.4, 0, 3, date, '12:30:00'),
    food('s-salada', 'Salada de folhas e tomate', 80, 12, 0.8, 2, 0.2, date, '12:30:00'),
  ];
  meals.lanche = [
    food('s-iogurte', 'Iogurte natural', 170, 88, 6.5, 9, 3, date, '16:00:00'),
    food('s-banana', 'Banana prata', 80, 78, 1, 21, 0.1, date, '16:00:00'),
  ];
  return { date, meals, waterMl: 1250 };
}

/** Jantares que variam nos dias passados do exemplo. */
const DINNERS: [string, number, number, number, number, number][] = [
  ['Omelete de 2 ovos com queijo', 150, 290, 20, 2, 22],
  ['Sopa de legumes com frango', 350, 280, 22, 28, 8],
  ['Tapioca com queijo e tomate', 160, 330, 12, 48, 10],
  ['Salada com atum', 250, 260, 26, 10, 12],
  ['Arroz, feijão e carne moída', 300, 480, 30, 52, 14],
];

/**
 * Últimos 6 dias com registro, menos um (dia 3), para a semana e a sequência
 * de dias aparecerem como nos mockups.
 */
export function sampleHistory(today: DateKey): DayLog[] {
  const days: DayLog[] = [];
  for (let back = 1; back <= 6; back++) {
    if (back === 3) continue;
    const date = addDays(today, -back);
    const day = sampleDay(date);
    const [name, grams, kcal, p, c, f] = DINNERS[back % DINNERS.length];
    day.meals.jantar = [food(`s-jantar-${back}`, name, grams, kcal, p, c, f, date, '20:00:00')];
    day.waterMl = 1750 + back * 150;
    days.push(day);
  }
  return days;
}

export const SAMPLE_WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: 'plano-a',
    name: 'Treino A',
    focus: 'Peito, ombro e tríceps',
    weekdays: [1, 4],
    exercises: [
      { id: 'ex-supino', catalogId: 'Dumbbell_Bench_Press', name: 'Supino reto com halteres', muscleGroup: 'Peito', targetSets: 4, targetReps: '8-12', restSeconds: 90 },
      { id: 'ex-crucifixo', catalogId: 'Incline_Dumbbell_Flyes', name: 'Crucifixo inclinado', muscleGroup: 'Peito', targetSets: 3, targetReps: '10-12', restSeconds: 60 },
      { id: 'ex-desenvolvimento', catalogId: 'Dumbbell_Shoulder_Press', name: 'Desenvolvimento com halteres', muscleGroup: 'Ombro', targetSets: 4, targetReps: '8-12', restSeconds: 90 },
      { id: 'ex-lateral', catalogId: 'Side_Lateral_Raise', name: 'Elevação lateral', muscleGroup: 'Ombro', targetSets: 3, targetReps: '12-15', restSeconds: 60 },
      { id: 'ex-triceps', catalogId: 'Triceps_Pushdown', name: 'Tríceps na polia', muscleGroup: 'Tríceps', targetSets: 3, targetReps: '10-12', restSeconds: 60 },
    ],
  },
  {
    id: 'plano-b',
    name: 'Treino B',
    focus: 'Costas e bíceps',
    weekdays: [2, 5],
    exercises: [
      { id: 'ex-puxada', catalogId: 'Wide-Grip_Lat_Pulldown', name: 'Puxada frontal', muscleGroup: 'Costas', targetSets: 4, targetReps: '8-12', restSeconds: 90 },
      { id: 'ex-remada', catalogId: 'Seated_Cable_Rows', name: 'Remada baixa', muscleGroup: 'Costas', targetSets: 4, targetReps: '8-12', restSeconds: 90 },
      { id: 'ex-pulldown', catalogId: 'Rope_Straight-Arm_Pulldown', name: 'Pulldown com corda', muscleGroup: 'Costas', targetSets: 3, targetReps: '12-15', restSeconds: 60 },
      { id: 'ex-rosca', catalogId: 'Barbell_Curl', name: 'Rosca direta', muscleGroup: 'Bíceps', targetSets: 3, targetReps: '10-12', restSeconds: 60 },
    ],
  },
  {
    id: 'plano-c',
    name: 'Treino C',
    focus: 'Pernas e glúteos',
    weekdays: [3, 6],
    exercises: [
      { id: 'ex-agachamento', catalogId: 'Barbell_Squat', name: 'Agachamento livre', muscleGroup: 'Quadríceps', targetSets: 4, targetReps: '8-10', restSeconds: 120 },
      { id: 'ex-leg', catalogId: 'Leg_Press', name: 'Leg press 45°', muscleGroup: 'Quadríceps', targetSets: 4, targetReps: '10-12', restSeconds: 90 },
      { id: 'ex-stiff', catalogId: 'Stiff-Legged_Barbell_Deadlift', name: 'Stiff', muscleGroup: 'Posterior', targetSets: 3, targetReps: '10-12', restSeconds: 90 },
      { id: 'ex-elevacao', catalogId: 'Barbell_Hip_Thrust', name: 'Elevação pélvica', muscleGroup: 'Glúteos', targetSets: 4, targetReps: '10-12', restSeconds: 90 },
      { id: 'ex-panturrilha', catalogId: 'Standing_Calf_Raises', name: 'Panturrilha em pé', muscleGroup: 'Panturrilha', targetSets: 4, targetReps: '12-15', restSeconds: 45 },
    ],
  },
];

type SetSpec = [exerciseId: string, weightKg: number, reps: number];

function session(id: string, planId: string, date: DateKey, specs: SetSpec[]): WorkoutSession {
  return {
    id,
    planId,
    date,
    startedAt: `${date}T18:00:00`,
    finishedAt: `${date}T18:52:00`,
    sets: specs.map(([exerciseId, weightKg, reps], i) => ({
      id: `${id}-${i + 1}`,
      exerciseId,
      weightKg,
      reps,
      completedAt: `${date}T18:${String(4 + i * 3).padStart(2, '0')}:00`,
    })),
  };
}

/** Três treinos da última semana (A, B e C), para já existir recorde e histórico. */
export function sampleSessions(today: DateKey): WorkoutSession[] {
  return [
    session('sessao-c', 'plano-c', addDays(today, -2), [
      ['ex-agachamento', 50, 10],
      ['ex-agachamento', 55, 8],
      ['ex-leg', 120, 12],
      ['ex-leg', 130, 10],
      ['ex-elevacao', 60, 12],
    ]),
    session('sessao-exemplo', 'plano-b', addDays(today, -4), [
      ['ex-puxada', 35, 12],
      ['ex-puxada', 40, 10],
      ['ex-puxada', 40, 9],
      ['ex-remada', 30, 12],
      ['ex-remada', 35, 10],
      ['ex-rosca', 8, 12],
      ['ex-rosca', 10, 10],
    ]),
    session('sessao-a', 'plano-a', addDays(today, -7), [
      ['ex-supino', 12, 10],
      ['ex-supino', 14, 8],
      ['ex-desenvolvimento', 8, 12],
      ['ex-desenvolvimento', 10, 10],
      ['ex-triceps', 20, 12],
    ]),
  ];
}

/** Uma pesagem por semana nas últimas 4 semanas, descendo devagar. */
export function sampleWeights(today: DateKey): WeightEntry[] {
  return [
    { id: 'p1', date: addDays(today, -28), weightKg: 71 },
    { id: 'p2', date: addDays(today, -21), weightKg: 70.6 },
    { id: 'p3', date: addDays(today, -14), weightKg: 70.1 },
    { id: 'p4', date: addDays(today, -7), weightKg: 69.8 },
    { id: 'p5', date: today, weightKg: 69.4 },
  ];
}
