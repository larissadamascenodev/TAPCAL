/**
 * Leituras derivadas do store. As telas usam estas funções em vez de recalcular.
 * Recebem o estado inteiro e são puras, então dá para testar sem React.
 */

import { toDateKey } from '@/lib/dates';
import { computePlan, type GoalPlan } from '@/lib/goals';
import { loggedDates, streak } from '@/lib/progress';
import { dayTotals, remaining } from '@/lib/totals';
import { planForDate } from '@/lib/workout';
import type { DateKey, DayLog, Macros, WorkoutPlan } from '@/types';

import type { AppState } from './useAppStore';

/** Peso mais recente registrado; se não houver, o peso inicial do perfil. */
export function currentWeightKg(s: AppState): number | null {
  const last = s.weights.at(-1);
  return last?.weightKg ?? s.profile?.startWeightKg ?? null;
}

/** Plano de metas de hoje (null enquanto não há perfil). */
export function goalPlan(s: AppState, today = toDateKey()): GoalPlan | null {
  const weight = currentWeightKg(s);
  if (!s.profile || weight == null) return null;
  return computePlan(s.profile, weight, today);
}

export function eatenToday(s: AppState): Macros {
  return dayTotals(s.today);
}

/** Quanto ainda pode comer hoje. */
export function remainingToday(s: AppState, today = toDateKey()): Macros | null {
  const plan = goalPlan(s, today);
  return plan ? remaining(plan.macros, eatenToday(s)) : null;
}

export function workoutToday(s: AppState, today = toDateKey()): WorkoutPlan | null {
  return planForDate(s.workoutPlans, today);
}

/** Registro de um dia qualquer: hoje, um dia do histórico ou vazio. */
export function dayLogFor(s: AppState, date: DateKey): DayLog | null {
  if (date === s.today.date) return s.today;
  return s.history.find((d) => d.date === date) ?? null;
}

/** Dias seguidos com comida registrada. */
export function currentStreak(s: AppState, today = toDateKey()): number {
  return streak(loggedDates(s.today, s.history), today);
}
