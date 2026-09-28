import { fromDateKey } from '@/lib/dates';
import type { DateKey, SetLog, WorkoutPlan, WorkoutSession } from '@/types';

/** Treino da divisão que cai no dia (ou null se é dia de descanso). */
export function planForDate(plans: readonly WorkoutPlan[], date: DateKey): WorkoutPlan | null {
  const weekday = fromDateKey(date).getDay();
  return plans.find((p) => p.weekdays.includes(weekday)) ?? null;
}

/** Maior carga já feita num exercício (desempate: mais repetições). */
export function personalRecord(
  sessions: readonly WorkoutSession[],
  exerciseId: string,
): SetLog | null {
  let best: SetLog | null = null;
  for (const s of sessions) {
    for (const set of s.sets) {
      if (set.exerciseId !== exerciseId) continue;
      if (
        !best ||
        set.weightKg > best.weightKg ||
        (set.weightKg === best.weightKg && set.reps > best.reps)
      ) {
        best = set;
      }
    }
  }
  return best;
}

/** Volume total (carga × repetições) de uma sessão. */
export function sessionVolume(session: WorkoutSession): number {
  return session.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
}
