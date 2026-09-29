import { describe, expect, it } from '@jest/globals';

import { EXERCICIOS } from '@/data/exercicios';
import {
  buscarExercicios,
  exercicioPorId,
  historicoDoExercicio,
  ladoDoMusculo,
  midiaDoExercicio,
  slugDoDesenho,
} from '@/lib/exercicios';
import type { SessaoDeTreino } from '@/types/treino';

describe('busca na biblioteca', () => {
  it('acha por nome alternativo, sem acento, em qualquer ordem', () => {
    expect(buscarExercicios({ busca: 'back squat' }).map((e) => e.id)).toEqual(['agachamento-livre-barra']);
    expect(buscarExercicios({ busca: 'triceps corda' }).map((e) => e.id)).toContain('triceps-corda');
    expect(buscarExercicios({ busca: 'hip thrust' }).map((e) => e.id)).toContain('elevacao-pelvica-barra');
  });

  it('filtra por músculo principal e por equipamento', () => {
    const costasPolia = buscarExercicios({ musculo: 'upper-back', equipamento: 'polia' });
    expect(costasPolia.length).toBeGreaterThan(2);
    expect(costasPolia.every((e) => e.musculoPrincipal === 'upper-back' && e.equipamentos.includes('polia'))).toBe(true);
    expect(buscarExercicios({}).length).toBe(EXERCICIOS.length);
  });
});

describe('mapa muscular e mídia', () => {
  it('abre de costas para músculos de trás', () => {
    expect(ladoDoMusculo('gluteal')).toBe('costas');
    expect(ladoDoMusculo('chest')).toBe('frente');
    expect(slugDoDesenho('abductors')).toBe('gluteal');
  });

  it('GIF quando existe (feminino para perfil feminino), senão mapa', () => {
    const e = exercicioPorId('prancha')!;
    expect(midiaDoExercicio(e, 'feminino')).toEqual({ tipo: 'mapa' });
    const comGif = { ...e, midia: { gifUrl: 'm.gif', gifUrlFeminino: 'f.gif' } };
    expect(midiaDoExercicio(comGif, 'feminino')).toEqual({ tipo: 'gif', url: 'f.gif' });
    expect(midiaDoExercicio(comGif, 'masculino')).toEqual({ tipo: 'gif', url: 'm.gif' });
  });
});

describe('histórico do exercício', () => {
  const s = (id: string, data: string, series: [number, number][]): SessaoDeTreino => ({
    id,
    planoId: 'p',
    treinoDoDiaId: 'p-seg',
    diaPlanejado: 'seg',
    data,
    inicio: `${data}T08:00:00`,
    fim: `${data}T09:00:00`,
    kcal: 0,
    series: series.map(([cargaKg, reps], i) => ({
      exercicioNoTreinoId: 'x',
      exercicioId: 'agachamento-livre-barra',
      numero: i + 1,
      cargaKg,
      reps,
      concluidaEm: '',
    })),
  });

  it('última sessão e recorde', () => {
    const h = historicoDoExercicio('agachamento-livre-barra', [s('1', '2026-09-20', [[80, 5]]), s('2', '2026-09-27', [[70, 12], [70, 10]])]);
    expect(h.ultimaData).toBe('2026-09-27');
    expect(h.ultima.map((x) => x.reps)).toEqual([12, 10]);
    expect(h.recorde).toMatchObject({ cargaKg: 80, reps: 5 });
  });

  it('sem registro', () => {
    expect(historicoDoExercicio('prancha', [])).toEqual({ ultima: [], ultimaData: null, recorde: null });
  });
});
