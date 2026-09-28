/**
 * Tipos do domínio do TapCal. Tudo que o app guarda ou calcula passa por aqui.
 * Datas de calendário são sempre strings 'AAAA-MM-DD' no fuso do aparelho
 * (ver src/lib/dates.ts); instantes são ISO completos.
 */

/** 'AAAA-MM-DD' no fuso local. */
export type DateKey = string;

// ─── Perfil ─────────────────────────────────────────────────────────────────

export type Sex = 'feminino' | 'masculino';

export type ActivityLevel = 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso';

export type Goal = 'emagrecer' | 'manter' | 'ganhar_massa';

/** Ritmo escolhido para chegar na meta de peso. */
export type Pace = 'leve' | 'moderado' | 'acelerado';

export type Profile = {
  name: string;
  sex: Sex;
  /** Data de nascimento; a idade é calculada a partir dela. */
  birthDate: DateKey;
  heightCm: number;
  /** Peso no momento em que o plano foi criado. O peso atual vem do histórico. */
  startWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  pace: Pace;
  /** Usa caneta GLP-1 (Mounjaro, Ozempic…). O módulo completo chega na fase 8. */
  usesGlp1: boolean;
  createdAt: string;
};

// ─── Alimentação ────────────────────────────────────────────────────────────

export type MealType = 'cafe_da_manha' | 'almoco' | 'lanche' | 'jantar';

export const MEAL_TYPES: readonly MealType[] = ['cafe_da_manha', 'almoco', 'lanche', 'jantar'];

export const MEAL_LABELS: Record<MealType, string> = {
  cafe_da_manha: 'Café da manhã',
  almoco: 'Almoço',
  lanche: 'Lanche',
  jantar: 'Jantar',
};

/** De onde veio o alimento: digitado, foto (fase 4) ou tabela TACO (fase 4). */
export type FoodSource = 'manual' | 'scanner' | 'taco';

export type Macros = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

/** Um alimento registrado numa refeição, já com os valores da porção comida. */
export type FoodItem = Macros & {
  id: string;
  name: string;
  grams: number;
  source: FoodSource;
  createdAt: string;
};

export type Meals = Record<MealType, FoodItem[]>;

/** Tudo que zera a cada novo dia: refeições e água. */
export type DayLog = {
  date: DateKey;
  meals: Meals;
  waterMl: number;
};

// ─── Treino ─────────────────────────────────────────────────────────────────

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  targetSets: number;
  /** Faixa de repetições, ex.: '8-12'. */
  targetReps: string;
  restSeconds: number;
};

/** Um treino da divisão da semana (ex.: "Treino A — Peito e tríceps"). */
export type WorkoutPlan = {
  id: string;
  name: string;
  focus: string;
  /** Dias da semana em que ele cai: 0 = domingo … 6 = sábado. */
  weekdays: number[];
  exercises: Exercise[];
};

/** Uma série feita durante o treino. */
export type SetLog = {
  id: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  completedAt: string;
};

export type WorkoutSession = {
  id: string;
  planId: string;
  date: DateKey;
  startedAt: string;
  finishedAt: string | null;
  sets: SetLog[];
};

// ─── Peso ───────────────────────────────────────────────────────────────────

export type WeightEntry = {
  id: string;
  date: DateKey;
  weightKg: number;
};
