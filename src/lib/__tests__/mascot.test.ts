import { describe, expect, it } from '@jest/globals';

import { goalPercent, mascotMood, type MoodInput } from '@/lib/mascot';

const base: MoodInput = {
  name: 'Larissa',
  eatenKcal: 1210,
  goalKcal: 1634,
  proteinG: 92,
  proteinGoalG: 125,
  waterMl: 1250,
  waterGoalMl: 2450,
  streakDays: 3,
  hour: 13,
};

describe('humor do Tapi', () => {
  it('fica feliz no caminho certo e diz quanto falta', () => {
    expect(mascotMood(base)).toEqual({
      mood: 'feliz',
      message: 'Tá no caminho certo, Larissa! Faltam 424 kcal.',
    });
  });

  it('fica preocupado quando passa da meta', () => {
    const r = mascotMood({ ...base, eatenKcal: 1890, proteinG: 130 });
    expect(r.mood).toBe('preocupado');
    expect(r.message).toContain('256 kcal');
  });

  it('comemora a proteína batida', () => {
    expect(mascotMood({ ...base, proteinG: 125 }).mood).toBe('comemorando');
  });

  it('comemora o dia fechado perto da meta, sem passar', () => {
    expect(mascotMood({ ...base, eatenKcal: 1602 }).mood).toBe('comemorando');
    expect(mascotMood({ ...base, eatenKcal: 1634 }).mood).toBe('comemorando');
  });

  it('acena quando ainda não há nada registrado de manhã', () => {
    const r = mascotMood({ ...base, eatenKcal: 0, proteinG: 0, hour: 8 });
    expect(r).toEqual({ mood: 'acenando', message: 'Oi, Larissa! Bora registrar o café da manhã?' });
    expect(mascotMood({ ...base, eatenKcal: 0, proteinG: 0, hour: 12 }).message).toContain('o almoço');
  });

  it('fica pensativo quando já é tarde e comeu pouco ou nada', () => {
    expect(mascotMood({ ...base, eatenKcal: 420, proteinG: 22, hour: 16 }).mood).toBe('pensando');
    expect(mascotMood({ ...base, eatenKcal: 0, proteinG: 0, hour: 18 }).mood).toBe('pensando');
    // de manhã, comer pouco é normal
    expect(mascotMood({ ...base, eatenKcal: 420, proteinG: 22, hour: 10 }).mood).toBe('feliz');
  });

  it('fica apaixonado com 7 dias seguidos ou água batida', () => {
    expect(mascotMood({ ...base, streakDays: 7 }).mood).toBe('apaixonado');
    expect(mascotMood({ ...base, waterMl: 2450 }).mood).toBe('apaixonado');
  });

  it('passar da meta vale mais que qualquer comemoração', () => {
    expect(mascotMood({ ...base, eatenKcal: 2000, proteinG: 200, streakDays: 30 }).mood).toBe('preocupado');
  });
});

describe('porcentagem da meta', () => {
  it('arredonda e pode passar de 100', () => {
    expect(goalPercent(1210, 1634)).toBe(74);
    expect(goalPercent(1890, 1634)).toBe(116);
  });

  it('sem meta, fica em zero', () => {
    expect(goalPercent(500, 0)).toBe(0);
  });
});
