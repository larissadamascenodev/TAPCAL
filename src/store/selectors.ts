/**
 * Leituras derivadas do store. As telas usam estas funções em vez de recalcular.
 * Recebem o estado inteiro e são puras, então dá para testar sem React.
 */

import { toDateKey } from '@/lib/dates';
import { computePlan, type GoalPlan } from '@/lib/goals';
import { loggedDates, streak } from '@/lib/progress';
import { dayTotals, remaining } from '@/lib/totals';
import { kcalQueimadas } from '@/lib/treino/plano';
import { diaDaData, planoAtivo, treinoDoDia } from '@/lib/treino/semana';
import type { DateKey, DayLog, Macros } from '@/types';
import type { TreinoDoDia } from '@/types/treino';

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

/** Treino do plano ativo que cai no dia (null = descanso ou sem plano). */
export function workoutToday(s: AppState, today = toDateKey()): TreinoDoDia | null {
  return treinoDoDia(planoAtivo(s.planos), diaDaData(today));
}

/** Kcal gastas em treinos no dia (entram no orçamento do dia em que o treino foi feito). */
export function burnedOn(s: AppState, date = toDateKey()): number {
  return kcalQueimadas(s.sessoes, date);
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
