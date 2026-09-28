import { addDays, fromDateKey } from '@/lib/dates';
import type { DateKey, Exercise, SetLog, WorkoutPlan, WorkoutSession } from '@/types';

/** Treino da divisão que cai no dia (ou null se é dia de descanso). */
export function planForDate(plans: readonly WorkoutPlan[], date: DateKey): WorkoutPlan | null {
  const weekday = fromDateKey(date).getDay();
  return plans.find((p) => p.weekdays.includes(weekday)) ?? null;
}

/** Rótulo curto do treino para a divisão da semana: "Peito, ombro e tríceps" → "Peito". */
export function shortFocus(plan: WorkoutPlan): string {
  return plan.focus.split(/[ ,]/)[0];
}

/** Segunda-feira da semana de `date`. */
export function startOfWeek(date: DateKey): DateKey {
  const weekday = fromDateKey(date).getDay(); // 0 = domingo
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
}

/** Os 7 dias da semana de `date`, de segunda a domingo. */
export function weekOf(date: DateKey): DateKey[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function better(a: SetLog, b: SetLog | null): boolean {
  return !b || a.weightKg > b.weightKg || (a.weightKg === b.weightKg && a.reps > b.reps);
}

/** Maior carga já feita num exercício (desempate: mais repetições). */
export function personalRecord(
  sessions: readonly WorkoutSession[],
  exerciseId: string,
): SetLog | null {
  let best: SetLog | null = null;
  for (const s of sessions) {
    for (const set of s.sets) {
      if (set.exerciseId === exerciseId && better(set, best)) best = set;
    }
  }
  return best;
}

/** Volume total (carga × repetições) de uma sessão. */
export function sessionVolume(session: WorkoutSession): number {
  return session.sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
}

/** Sessões ordenadas da mais nova para a mais antiga. */
function newestFirst(sessions: readonly WorkoutSession[]): WorkoutSession[] {
  return [...sessions].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

/** Séries do exercício na última sessão em que ele apareceu. */
export function lastSetsFor(sessions: readonly WorkoutSession[], exerciseId: string): SetLog[] {
  for (const s of newestFirst(sessions)) {
    const sets = s.sets.filter((x) => x.exerciseId === exerciseId);
    if (sets.length) return sets;
  }
  return [];
}

/** Maior carga da última vez que o exercício foi feito. */
export function lastWeightFor(sessions: readonly WorkoutSession[], exerciseId: string): number | null {
  const sets = lastSetsFor(sessions, exerciseId);
  return sets.length ? Math.max(...sets.map((s) => s.weightKg)) : null;
}

/**
 * O recorde do exercício foi batido na última vez que ele foi feito?
 * Precisa existir uma vez anterior para comparar: a primeira vez não é recorde.
 */
export function isFreshRecord(sessions: readonly WorkoutSession[], exerciseId: string): boolean {
  const withExercise = newestFirst(sessions).filter((s) => s.sets.some((x) => x.exerciseId === exerciseId));
  if (withExercise.length < 2) return false;
  const [latest, ...earlier] = withExercise;
  const before = personalRecord(earlier, exerciseId);
  const now = personalRecord([latest], exerciseId);
  return !!before && !!now && better(now, before);
}

/**
 * Uma série nova bate o recorde? Só conta se já existia recorde antes
 * (a primeira vez num exercício não é "recorde", é o ponto de partida).
 */
export function beatsRecord(
  sessions: readonly WorkoutSession[],
  exerciseId: string,
  weightKg: number,
  reps: number,
): boolean {
  const pr = personalRecord(sessions, exerciseId);
  if (!pr) return false;
  return weightKg > pr.weightKg || (weightKg === pr.weightKg && reps > pr.reps);
}

export type WeekStats = {
  done: number;
  planned: number;
  volumeKg: number;
  records: number;
};

/**
 * Resumo da semana (segunda a domingo) de `today`: treinos feitos, previstos,
 * volume e quantos exercícios tiveram recorde batido.
 */
export function weekStats(
  sessions: readonly WorkoutSession[],
  plans: readonly WorkoutPlan[],
  today: DateKey,
): WeekStats {
  const days = weekOf(today);
  const inWeek = sessions.filter((s) => s.date >= days[0] && s.date <= days[6]);
  const before = sessions.filter((s) => s.date < days[0]);

  let records = 0;
  const exerciseIds = new Set(inWeek.flatMap((s) => s.sets.map((x) => x.exerciseId)));
  for (const id of exerciseIds) {
    const prev = personalRecord(before, id);
    const now = personalRecord(inWeek, id);
    if (prev && now && better(now, prev)) records++;
  }

  return {
    done: new Set(inWeek.map((s) => s.date)).size,
    planned: new Set(plans.flatMap((p) => p.weekdays)).size,
    volumeKg: inWeek.reduce((sum, s) => sum + sessionVolume(s), 0),
    records,
  };
}

/** Quantas séries do exercício já foram feitas na sessão. */
export function setsDone(session: WorkoutSession, exerciseId: string): number {
  return session.sets.filter((s) => s.exerciseId === exerciseId).length;
}

/** Primeiro exercício do treino que ainda tem séries a fazer (ou o último). */
export function nextExerciseIndex(plan: WorkoutPlan, session: WorkoutSession): number {
  const i = plan.exercises.findIndex((e: Exercise) => setsDone(session, e.id) < e.targetSets);
  return i === -1 ? plan.exercises.length - 1 : i;
}

/** Duração estimada: séries × (40 s de execução + descanso), arredondada a 5 min. */
export function estimatedMinutes(plan: WorkoutPlan): number {
  const seconds = plan.exercises.reduce((sum, e) => sum + e.targetSets * (40 + e.restSeconds), 0);
  return Math.max(5, Math.round(seconds / 60 / 5) * 5);
}

/** Treinos concluídos no mesmo mês de `today`. */
export function sessionsThisMonth(sessions: readonly WorkoutSession[], today: DateKey): number {
  const month = today.slice(0, 7);
  return sessions.filter((s) => s.date.startsWith(month) && s.finishedAt).length;
}
