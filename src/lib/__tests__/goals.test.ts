import { describe, expect, it } from '@jest/globals';

import { computePlan } from '@/lib/goals';
import type { Profile } from '@/types';

const TODAY = '2026-09-28';

const base: Omit<Profile, 'sex' | 'birthDate' | 'heightCm' | 'startWeightKg' | 'targetWeightKg'> = {
  name: 'Teste',
  workRoutine: 'pesado',
  goal: 'emagrecer',
  pace: 'moderado',
  usesGlp1: false,
  createdAt: '2026-09-01T12:00:00.000Z',
};

const codes = (p: ReturnType<typeof computePlan>) => p.warnings.map((w) => w.code);

describe('perfil 1 — mulher emagrecendo', () => {
  const profile: Profile = {
    ...base,
    sex: 'feminino',
    birthDate: '1994-03-10',
    heightCm: 165,
    startWeightKg: 78,
    targetWeightKg: 68,
    workRoutine: 'dinamico',
    goal: 'emagrecer',
    pace: 'moderado',
  };
  const plan = computePlan(profile, 78, TODAY);

  it('calcula idade, IMC, TMB e gasto diário', () => {
    expect(plan.age).toBe(32);
    expect(plan.bmi).toBeCloseTo(28.65, 2);
    expect(plan.bmiCategory).toBe('sobrepeso');
    // 10×78 + 6,25×165 − 5×32 − 161
    expect(plan.bmrKcal).toBe(1490);
    // 1490,25 × 1,375
    expect(plan.tdeeKcal).toBe(2049);
  });

  it('aplica déficit de 550 kcal (0,5 kg/semana) sem acionar a trava', () => {
    expect(plan.targetKcal).toBe(1499);
    expect(plan.dailyAdjustmentKcal).toBe(-550);
    expect(plan.kgPerWeek).toBeCloseTo(0.5, 5);
    expect(codes(plan)).toEqual([]);
  });

  it('divide os macros: 1,8 g/kg de proteína, 25% de gordura, resto carboidrato', () => {
    expect(plan.macros).toEqual({ kcal: 1499, proteinG: 140, fatG: 42, carbsG: 140 });
  });

  it('calcula água e previsão da meta (10 kg em 20 semanas)', () => {
    expect(plan.waterMl).toBe(2750);
    expect(plan.weeksToGoal).toBeCloseTo(20, 5);
    expect(plan.goalDate).toBe('2027-02-15');
  });
});

describe('perfil 2 — homem ganhando massa', () => {
  const profile: Profile = {
    ...base,
    sex: 'masculino',
    birthDate: '2001-01-20',
    heightCm: 180,
    startWeightKg: 72,
    targetWeightKg: 78,
    workRoutine: 'pesado',
    goal: 'ganhar_massa',
    pace: 'moderado',
  };
  const plan = computePlan(profile, 72, TODAY);

  it('calcula TMB e gasto diário masculinos', () => {
    expect(plan.age).toBe(25);
    expect(plan.bmiCategory).toBe('normal');
    // 10×72 + 6,25×180 − 5×25 + 5
    expect(plan.bmrKcal).toBe(1725);
    expect(plan.tdeeKcal).toBe(2674);
  });

  it('aplica superávit de 275 kcal (0,25 kg/semana)', () => {
    expect(plan.targetKcal).toBe(2949);
    expect(plan.dailyAdjustmentKcal).toBe(275);
    expect(plan.kgPerWeek).toBeCloseTo(0.25, 5);
  });

  it('usa 2 g/kg de proteína para ganho de massa', () => {
    expect(plan.macros).toEqual({ kcal: 2949, proteinG: 144, fatG: 82, carbsG: 409 });
  });

  it('prevê 6 kg em 24 semanas', () => {
    expect(plan.waterMl).toBe(2500);
    expect(plan.weeksToGoal).toBeCloseTo(24, 5);
    expect(plan.goalDate).toBe('2027-03-15');
    expect(codes(plan)).toEqual([]);
  });
});

describe('perfil 3 — pessoa com GLP-1', () => {
  const profile: Profile = {
    ...base,
    sex: 'feminino',
    birthDate: '1981-05-02',
    heightCm: 160,
    startWeightKg: 95,
    targetWeightKg: 75,
    workRoutine: 'sentado',
    goal: 'emagrecer',
    pace: 'acelerado',
    usesGlp1: true,
  };
  const plan = computePlan(profile, 95, TODAY);

  it('identifica obesidade e calcula TMB', () => {
    expect(plan.age).toBe(45);
    expect(plan.bmi).toBeCloseTo(37.11, 2);
    expect(plan.bmiCategory).toBe('obesidade');
    expect(plan.bmrKcal).toBe(1564);
    expect(plan.tdeeKcal).toBe(1877);
  });

  it('trava as calorias na TMB em vez de descer para 1052 kcal', () => {
    expect(plan.minKcal).toBe(1564);
    expect(plan.targetKcal).toBe(1564);
    expect(codes(plan)).toContain('piso_calorias');
  });

  it('avisa sobre apetite reduzido pela caneta', () => {
    expect(codes(plan)).toContain('caneta_apetite');
  });

  it('calcula proteína pelo peso de IMC 25 (64 kg), não pelos 95 kg', () => {
    expect(plan.macros).toEqual({ kcal: 1564, proteinG: 115, fatG: 43, carbsG: 179 });
  });

  it('refaz a previsão com o ritmo real depois da trava', () => {
    expect(plan.dailyAdjustmentKcal).toBe(-313);
    expect(plan.kgPerWeek).toBeCloseTo(0.2845, 3);
    expect(plan.goalDate).toBe('2028-02-03');
    expect(plan.waterMl).toBe(3350);
  });
});

describe('travas e casos de borda', () => {
  const woman: Profile = {
    ...base,
    sex: 'feminino',
    birthDate: '1990-01-01',
    heightCm: 158,
    startWeightKg: 55,
    targetWeightKg: 50,
    workRoutine: 'sentado',
    goal: 'emagrecer',
    pace: 'acelerado',
  };

  it('nunca fica abaixo de 1200 kcal para mulheres', () => {
    const plan = computePlan(woman, 55, TODAY);
    expect(plan.targetKcal).toBeGreaterThanOrEqual(1200);
    expect(plan.targetKcal).toBe(plan.minKcal);
    expect(codes(plan)).toContain('piso_calorias');
  });

  it('nunca fica abaixo de 1500 kcal para homens', () => {
    const plan = computePlan({ ...woman, sex: 'masculino', heightCm: 160 }, 55, TODAY);
    expect(plan.minKcal).toBe(1500);
    expect(plan.targetKcal).toBe(1500);
  });

  it('avisa quando a meta deixa o IMC abaixo de 18,5', () => {
    const plan = computePlan({ ...woman, targetWeightKg: 44 }, 55, TODAY);
    expect(codes(plan)).toContain('meta_imc_baixo');
  });

  it('trata meta incoerente como manutenção', () => {
    const plan = computePlan({ ...woman, targetWeightKg: 60 }, 55, TODAY);
    expect(codes(plan)).toContain('meta_incoerente');
    expect(plan.targetKcal).toBe(plan.tdeeKcal);
    expect(plan.goalDate).toBeNull();
  });

  it('trata meta já atingida como manutenção', () => {
    const plan = computePlan(woman, 50, TODAY);
    expect(codes(plan)).toContain('meta_ja_atingida');
    expect(plan.weeksToGoal).toBeNull();
  });

  it('manter peso não tem ajuste nem previsão', () => {
    const plan = computePlan({ ...woman, goal: 'manter', workRoutine: 'pesado' }, 55, TODAY);
    expect(plan.dailyAdjustmentKcal).toBe(0);
    expect(plan.kgPerWeek).toBe(0);
    expect(plan.goalDate).toBeNull();
  });
});
