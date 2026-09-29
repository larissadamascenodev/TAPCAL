/**
 * Motor de metas do TapCal: IMC, TMB, gasto diário, calorias da meta, macros,
 * água e previsão de quando a meta de peso é atingida.
 *
 * Funções puras, sem tela e sem store: o onboarding (fase 6) e a Início (fase 3)
 * chamam as mesmas funções. Fontes:
 * - TMB: equação de Mifflin-St Jeor (1990).
 * - Fatores de atividade: os usados com Mifflin-St Jeor (1,2 a 1,9).
 * - 1 kg de gordura ≈ 7.700 kcal.
 */

import { addDays, ageOn } from '@/lib/dates';
import type { DateKey, Goal, Macros, MealType, Pace, Profile, Sex, WorkRoutine } from '@/types';

export const KCAL_PER_KG = 7700;

/**
 * Fator de atividade só pela rotina de trabalho. O treino não entra aqui: as
 * kcal de cada sessão somam nas queimadas do dia em que ela foi feita.
 */
export const ROUTINE_FACTORS: Record<WorkRoutine, number> = {
  sentado: 1.2,
  dinamico: 1.375,
  pesado: 1.55,
};

export const ROUTINE_LABELS: Record<WorkRoutine, string> = {
  sentado: 'Sentada (escritório, estudo)',
  dinamico: 'Dinâmica (em pé, andando bastante)',
  pesado: 'Trabalho físico pesado',
};

/** Quantos kg por semana cada ritmo representa. */
export const PACE_KG_PER_WEEK: Record<Exclude<Goal, 'manter'>, Record<Pace, number>> = {
  emagrecer: { leve: 0.25, moderado: 0.5, acelerado: 0.75 },
  ganhar_massa: { leve: 0.15, moderado: 0.25, acelerado: 0.35 },
};

/** Piso absoluto de calorias por sexo, mesmo que a TMB dê menos. */
export const MIN_KCAL_BY_SEX: Record<Sex, number> = {
  feminino: 1200,
  masculino: 1500,
};

/** Proteína em g por kg de peso de referência, por objetivo. */
export const PROTEIN_G_PER_KG: Record<Goal, number> = {
  emagrecer: 1.8,
  manter: 1.6,
  ganhar_massa: 2.0,
};

/** Parte das calorias que vem de gordura. */
export const FAT_SHARE = 0.25;

/** Água: ml por kg de peso. */
export const WATER_ML_PER_KG = 35;

// ─── Peças ──────────────────────────────────────────────────────────────────

export type BmiCategory = 'abaixo' | 'normal' | 'sobrepeso' | 'obesidade';

export const BMI_LABELS: Record<BmiCategory, string> = {
  abaixo: 'Abaixo do peso',
  normal: 'Peso saudável',
  sobrepeso: 'Sobrepeso',
  obesidade: 'Obesidade',
};

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'abaixo';
  if (value < 25) return 'normal';
  if (value < 30) return 'sobrepeso';
  return 'obesidade';
}

/** Taxa metabólica basal (Mifflin-St Jeor), em kcal/dia. */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'masculino' ? base + 5 : base - 161;
}

/** Gasto diário total = TMB × fator de atividade. */
export function tdee(bmrKcal: number, routine: WorkRoutine): number {
  return bmrKcal * ROUTINE_FACTORS[routine];
}

/** Peso com IMC 25 na altura dada — referência de proteína para quem tem IMC ≥ 30. */
export function weightAtBmi(targetBmi: number, heightCm: number): number {
  const m = heightCm / 100;
  return targetBmi * m * m;
}

/** Peso usado para calcular proteína: o atual, ou o de IMC 25 se houver obesidade. */
export function proteinReferenceWeight(weightKg: number, heightCm: number): number {
  return bmi(weightKg, heightCm) >= 30 ? weightAtBmi(25, heightCm) : weightKg;
}

export function waterGoalMl(weightKg: number): number {
  return Math.round((weightKg * WATER_ML_PER_KG) / 50) * 50;
}

// ─── Avisos ─────────────────────────────────────────────────────────────────

export type WarningCode =
  | 'piso_calorias'
  | 'meta_imc_baixo'
  | 'meta_incoerente'
  | 'meta_ja_atingida'
  | 'caneta_apetite';

export type GoalWarning = {
  code: WarningCode;
  message: string;
};

// ─── Plano completo ─────────────────────────────────────────────────────────

export type GoalPlan = {
  age: number;
  weightKg: number;
  bmi: number;
  bmiCategory: BmiCategory;
  bmrKcal: number;
  tdeeKcal: number;
  /** Negativo = déficit, positivo = superávit, já depois das travas. */
  dailyAdjustmentKcal: number;
  /** Calorias por dia da meta, depois das travas. */
  targetKcal: number;
  /** Piso aplicado para esta pessoa (maior entre o mínimo do sexo e a TMB). */
  minKcal: number;
  macros: Macros;
  waterMl: number;
  /** Ritmo real em kg por semana, depois das travas (0 se manter). */
  kgPerWeek: number;
  /** Semanas até a meta de peso; null se manter, já atingida ou incoerente. */
  weeksToGoal: number | null;
  /** Data prevista para atingir a meta; null nos mesmos casos. */
  goalDate: DateKey | null;
  warnings: GoalWarning[];
};

type PlanInput = Pick<
  Profile,
  | 'sex'
  | 'birthDate'
  | 'heightCm'
  | 'targetWeightKg'
  | 'workRoutine'
  | 'goal'
  | 'pace'
  | 'usesGlp1'
>;

/**
 * Calcula o plano do dia a partir do perfil e do peso atual.
 * `today` entra como parâmetro para os testes serem determinísticos.
 */
export function computePlan(profile: PlanInput, weightKg: number, today: DateKey): GoalPlan {
  const warnings: GoalWarning[] = [];
  const { sex, heightCm, goal, targetWeightKg } = profile;

  const age = ageOn(profile.birthDate, today);
  const bmiValue = bmi(weightKg, heightCm);
  const bmrKcal = bmr(sex, weightKg, heightCm, age);
  const tdeeKcal = tdee(bmrKcal, profile.workRoutine);

  // Objetivo coerente com o peso? Ex.: "emagrecer" com meta acima do peso atual.
  const diffKg = targetWeightKg - weightKg;
  let effectiveGoal: Goal = goal;
  if (goal !== 'manter') {
    const wrongWay = (goal === 'emagrecer' && diffKg > 0) || (goal === 'ganhar_massa' && diffKg < 0);
    if (Math.abs(diffKg) < 0.1) {
      warnings.push({
        code: 'meta_ja_atingida',
        message: 'Você já está no peso da meta. O plano passa a ser de manutenção.',
      });
      effectiveGoal = 'manter';
    } else if (wrongWay) {
      warnings.push({
        code: 'meta_incoerente',
        message:
          goal === 'emagrecer'
            ? 'A meta de peso está acima do peso atual. Revise a meta ou o objetivo.'
            : 'A meta de peso está abaixo do peso atual. Revise a meta ou o objetivo.',
      });
      effectiveGoal = 'manter';
    }
  }

  const targetBmi = bmi(targetWeightKg, heightCm);
  if (targetBmi < 18.5) {
    warnings.push({
      code: 'meta_imc_baixo',
      message: `Com essa meta, seu IMC ficaria em ${targetBmi.toFixed(1)}, abaixo do saudável (18,5). Converse com um profissional antes de seguir.`,
    });
  }

  // Ajuste diário pedido pelo ritmo.
  const requestedKgPerWeek =
    effectiveGoal === 'manter' ? 0 : PACE_KG_PER_WEEK[effectiveGoal][profile.pace];
  const sign = effectiveGoal === 'emagrecer' ? -1 : 1;
  const requestedAdjustment = (sign * requestedKgPerWeek * KCAL_PER_KG) / 7;

  // Trava de segurança: nunca abaixo do piso do sexo nem da própria TMB.
  const minKcal = Math.round(Math.max(MIN_KCAL_BY_SEX[sex], bmrKcal));
  let targetKcal = Math.round(tdeeKcal + requestedAdjustment);
  if (targetKcal < minKcal) {
    targetKcal = minKcal;
    warnings.push({
      code: 'piso_calorias',
      message: `Para sua segurança, a meta ficou em ${minKcal} kcal, o mínimo para o seu corpo. O ritmo de perda vai ser um pouco mais lento que o escolhido.`,
    });
  }

  if (profile.usesGlp1) {
    warnings.push({
      code: 'caneta_apetite',
      message:
        'Com a caneta, o apetite costuma cair. Tente não ficar muito abaixo da meta de calorias e priorize a proteína. O app não substitui orientação médica.',
    });
  }

  const dailyAdjustmentKcal = Math.round(targetKcal - tdeeKcal);
  const kgPerWeek =
    effectiveGoal === 'manter' ? 0 : Math.abs((dailyAdjustmentKcal * 7) / KCAL_PER_KG);

  let weeksToGoal: number | null = null;
  let goalDate: DateKey | null = null;
  if (effectiveGoal !== 'manter' && kgPerWeek > 0) {
    weeksToGoal = Math.abs(diffKg) / kgPerWeek;
    goalDate = addDays(today, Math.ceil(weeksToGoal * 7));
  }

  return {
    age,
    weightKg,
    bmi: bmiValue,
    bmiCategory: bmiCategory(bmiValue),
    bmrKcal: Math.round(bmrKcal),
    tdeeKcal: Math.round(tdeeKcal),
    dailyAdjustmentKcal,
    targetKcal,
    minKcal,
    macros: computeMacros(targetKcal, effectiveGoal, weightKg, heightCm),
    waterMl: waterGoalMl(weightKg),
    kgPerWeek,
    weeksToGoal,
    goalDate,
    warnings,
  };
}

/**
 * Divide as calorias em macros: proteína por kg de referência, 25% de gordura
 * e o restante em carboidrato.
 */
export function computeMacros(kcal: number, goal: Goal, weightKg: number, heightCm: number): Macros {
  const proteinG = Math.round(PROTEIN_G_PER_KG[goal] * proteinReferenceWeight(weightKg, heightCm));
  const fatG = Math.round((kcal * FAT_SHARE) / 9);
  const carbsG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4));
  return { kcal, proteinG, carbsG, fatG };
}

// ─── Calorias por refeição ──────────────────────────────────────────────────

/** Quanto de cada dia cabe em cada refeição (soma 1). */
export const MEAL_SHARES: Record<MealType, number> = {
  cafe_da_manha: 0.25,
  almoco: 0.35,
  lanche: 0.15,
  jantar: 0.25,
};

/**
 * Calorias indicadas para cada refeição, arredondadas de 10 em 10.
 * O jantar fica com a sobra do arredondamento, para a soma bater com a meta.
 */
export function mealTargets(targetKcal: number): Record<MealType, number> {
  const round10 = (n: number) => Math.round(n / 10) * 10;
  const cafe = round10(targetKcal * MEAL_SHARES.cafe_da_manha);
  const almoco = round10(targetKcal * MEAL_SHARES.almoco);
  const lanche = round10(targetKcal * MEAL_SHARES.lanche);
  return {
    cafe_da_manha: cafe,
    almoco,
    lanche,
    jantar: Math.max(0, Math.round(targetKcal) - cafe - almoco - lanche),
  };
}

// ─── Nomes para a tela ──────────────────────────────────────────────────────

export const GOAL_LABELS: Record<Goal, string> = {
  emagrecer: 'Emagrecer',
  manter: 'Manter o peso',
  ganhar_massa: 'Ganhar massa',
};

export const PACE_LABELS: Record<Pace, string> = {
  leve: 'Ritmo leve',
  moderado: 'Ritmo moderado',
  acelerado: 'Ritmo acelerado',
};
