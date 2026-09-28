import { describe, expect, it } from '@jest/globals';

import { SAMPLE_WORKOUT_PLANS, sampleSessions } from '@/data/sample';
import { personalRecord, planForDate, sessionVolume } from '@/lib/workout';

describe('treino', () => {
  it('acha o treino do dia pela divisão da semana', () => {
    expect(planForDate(SAMPLE_WORKOUT_PLANS, '2026-09-28')?.name).toBe('Treino A'); // segunda
    expect(planForDate(SAMPLE_WORKOUT_PLANS, '2026-09-30')?.name).toBe('Treino C'); // quarta
    expect(planForDate(SAMPLE_WORKOUT_PLANS, '2026-09-27')).toBeNull(); // domingo
  });

  it('recorde é a maior carga; empate desempata por repetições', () => {
    const sessions = sampleSessions('2026-09-28');
    expect(personalRecord(sessions, 'ex-puxada')).toMatchObject({ weightKg: 40, reps: 10 });
    expect(personalRecord(sessions, 'ex-supino')).toBeNull();
  });

  it('calcula volume da sessão', () => {
    const [s] = sampleSessions('2026-09-28');
    // 35×12 + 40×10 + 40×9 + 30×12 + 35×10 + 8×12 + 10×10
    expect(sessionVolume(s)).toBe(2086);
  });
});
