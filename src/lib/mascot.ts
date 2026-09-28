import { formatInt } from './format';

/** Humores do Tapi, o mascote da Início. */
export type Mood = 'acenando' | 'pensando' | 'feliz' | 'comemorando' | 'apaixonado' | 'preocupado';

export type MoodInput = {
  /** Primeiro nome, usado nas falas. */
  name: string;
  eatenKcal: number;
  goalKcal: number;
  proteinG: number;
  proteinGoalG: number;
  waterMl: number;
  waterGoalMl: number;
  /** Dias seguidos registrando comida (inclui hoje). */
  streakDays: number;
  /** Hora local, de 0 a 23. */
  hour: number;
};

/** A partir desta hora, comer pouco deixa o Tapi pensativo. */
export const LATE_HOUR = 15;
/** Abaixo desta fração da meta, depois de LATE_HOUR, conta como "comeu pouco". */
export const LOW_FRACTION = 0.4;
/** A partir desta fração da meta (sem passar), o dia está fechado. */
export const CLOSED_FRACTION = 0.95;
/** Sequência que deixa o Tapi apaixonado. */
export const LOVE_STREAK = 7;

/** Falas quando alguém toca no Tapi, em rodízio. */
export const POKE_MESSAGES = [
  'Hihi, cócegas!',
  'Opa! Tô aqui!',
  'Bora beber água?',
  'Toque duas vezes no Total de hoje pra fotografar o prato!',
] as const;

/** Porcentagem da meta de calorias já consumida (pode passar de 100). */
export function goalPercent(eatenKcal: number, goalKcal: number): number {
  if (goalKcal <= 0) return 0;
  return Math.round((eatenKcal / goalKcal) * 100);
}

function mealOfHour(hour: number): string {
  if (hour < 11) return 'o café da manhã';
  if (hour < LATE_HOUR) return 'o almoço';
  return 'a primeira refeição';
}

/**
 * Escolhe o humor do Tapi e a fala do balão a partir do dia.
 * Ordem de prioridade: passou da meta > bateu a meta > dia vazio > comeu pouco
 * tarde > sequência ou água batida > no caminho certo.
 */
export function mascotMood(i: MoodInput): { mood: Mood; message: string } {
  const { name, eatenKcal: eaten, goalKcal: goal } = i;

  if (goal > 0 && eaten > goal) {
    return {
      mood: 'preocupado',
      message: `Eita, passamos ${formatInt(eaten - goal)} kcal da meta. Amanhã a gente equilibra!`,
    };
  }
  if (i.proteinGoalG > 0 && i.proteinG >= i.proteinGoalG) {
    return { mood: 'comemorando', message: `Proteína batida! Mandou bem, ${name}!` };
  }
  if (goal > 0 && eaten >= goal * CLOSED_FRACTION) {
    return { mood: 'comemorando', message: 'Dia fechado dentro da meta!' };
  }
  if (eaten <= 0) {
    if (i.hour >= LATE_HOUR) {
      return {
        mood: 'pensando',
        message: `Hmm… já são ${i.hour}h e você ainda não registrou nada. Bora comer?`,
      };
    }
    return { mood: 'acenando', message: `Oi, ${name}! Bora registrar ${mealOfHour(i.hour)}?` };
  }
  if (i.hour >= LATE_HOUR && eaten < goal * LOW_FRACTION) {
    return {
      mood: 'pensando',
      message: `Hmm… já são ${i.hour}h e você comeu pouco. Que tal um lanche?`,
    };
  }
  if (i.streakDays >= LOVE_STREAK) {
    return {
      mood: 'apaixonado',
      message: `${i.streakDays} dias seguidos registrando. Tô orgulhoso de você!`,
    };
  }
  if (i.waterGoalMl > 0 && i.waterMl >= i.waterGoalMl) {
    return { mood: 'apaixonado', message: 'Meta de água batida. Assim que eu gosto!' };
  }
  return {
    mood: 'feliz',
    message: `Tá no caminho certo, ${name}! Faltam ${formatInt(goal - eaten)} kcal.`,
  };
}
