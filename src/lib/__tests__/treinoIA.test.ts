import { describe, expect, it } from '@jest/globals';

import { exercicioPorId } from '@/lib/exercicios';
import { horaDaProximaFase, semanaDoBloco, seriesNaSemana } from '@/lib/treino/progressao';
import { DIAS } from '@/lib/treino/semana';
import { equipamentosDisponiveis, serveParaRespostas } from '@/lib/treinoIA/candidatos';
import { distribuirNosDias, montarEsqueleto, volumePorMusculo, type Esqueleto } from '@/lib/treinoIA/esqueleto';
import { corpoDoPedido, escolhaDaResposta, gerarTreino } from '@/lib/treinoIA/cliente';
import { escolhaValida, escolherSemIA, montarPlano } from '@/lib/treinoIA/plano';
import { divisao, exerciciosPorSessao, MOLDES, volumeAlvo } from '@/lib/treinoIA/regras';
import type { Goal } from '@/types';
import type { Musculo, PlanoDeTreino, RespostasTreinoIA } from '@/types/treino';

const HOJE = '2026-09-30'; // quarta; a semana começa na segunda 28/09

const iniciante: RespostasTreinoIA = {
  experiencia: 'iniciante',
  local: 'casa',
  equipamentosCasa: ['halteres', 'elastico'],
  dias: ['seg', 'qua', 'sex'],
  tempo: '30-45',
  foco: ['corpo-todo'],
  lesoes: [],
  cardio: 'quero-comecar',
};
const intermediaria: RespostasTreinoIA = {
  experiencia: 'intermediario',
  local: 'academia-completa',
  equipamentosCasa: [],
  dias: ['seg', 'ter', 'qui', 'sex'],
  tempo: '60-90',
  foco: ['gluteos'],
  lesoes: ['joelho'],
  cardio: 'agora-nao',
};
const avancado: RespostasTreinoIA = {
  experiencia: 'avancado',
  local: 'academia-completa',
  equipamentosCasa: [],
  dias: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
  tempo: '60-90',
  foco: ['peito', 'bracos'],
  lesoes: [],
  cardio: 'ja-faco',
  cardioAtividade: 'corrida',
};

const gerar = (r: RespostasTreinoIA, objetivo: Goal = 'emagrecer', semente = 0) =>
  montarPlano({ respostas: r, objetivo, esqueleto: montarEsqueleto(r), hoje: HOJE, opcoes: { semente }, criadoEm: '2026-09-30T10:00:00.000Z' });

/** Quantas sessões da semana têm o músculo como principal. */
function frequencia(plano: PlanoDeTreino, m: Musculo): number {
  return plano.treinos.filter((t) => t.exercicios.some((e) => exercicioPorId(e.exercicioId)?.musculoPrincipal === m)).length;
}

/** Checagens que valem para qualquer plano gerado. */
function coerente(plano: PlanoDeTreino, r: RespostasTreinoIA) {
  expect(plano.treinos.map((t) => t.dia)).toEqual(r.dias);
  const quantos = exerciciosPorSessao(r.tempo, r.experiencia);
  for (const t of plano.treinos) {
    expect(t.exercicios.length).toBeGreaterThanOrEqual(quantos - 1);
    expect(t.exercicios.length).toBeLessThanOrEqual(quantos);
    const ids = t.exercicios.map((e) => e.exercicioId);
    expect(new Set(ids).size).toBe(ids.length);
    const porMusculo = new Map<Musculo, number>();
    for (const e of t.exercicios) {
      const ex = exercicioPorId(e.exercicioId)!;
      expect(serveParaRespostas(ex, r)).toBe(true);
      expect(e.series).toBeGreaterThanOrEqual(2);
      expect(e.series).toBeLessThanOrEqual(4);
      porMusculo.set(ex.musculoPrincipal, (porMusculo.get(ex.musculoPrincipal) ?? 0) + e.series);
    }
    for (const n of porMusculo.values()) expect(n).toBeLessThanOrEqual(10);
    // compostos antes dos isolados
    const tipos = t.exercicios.map((e) => exercicioPorId(e.exercicioId)!.tipo);
    expect(tipos.join(',')).toBe([...tipos].sort().join(','));
  }
}

describe('divisão e dias', () => {
  it('segue a tabela do SPEC', () => {
    expect(divisao(2, 'avancado')).toEqual(['corpo-a', 'corpo-b']);
    expect(divisao(3, 'iniciante')).toEqual(['corpo-a', 'corpo-b', 'corpo-c']);
    expect(divisao(3, 'intermediario')).toEqual(['superiores-a', 'inferiores-a', 'corpo-a']);
    expect(divisao(4, 'iniciante')).toEqual(['superiores-a', 'inferiores-a', 'superiores-b', 'inferiores-b']);
    expect(divisao(5, 'avancado')).toEqual(['superiores-a', 'inferiores-a', 'empurrar', 'puxar', 'pernas-a']);
    expect(divisao(6, 'intermediario')).toEqual(['empurrar', 'puxar', 'pernas-a', 'empurrar', 'puxar', 'pernas-b']);
  });

  it('não põe pernas em dias seguidos quando dá para arrumar', () => {
    const d = distribuirNosDias(['superiores-a', 'inferiores-a', 'inferiores-b', 'superiores-b'], ['seg', 'ter', 'qua', 'qui']);
    expect(d.map((x) => x.dia)).toEqual(['seg', 'ter', 'qua', 'qui']);
    for (let i = 1; i < d.length; i++) expect(MOLDES[d[i].chave].inferior && MOLDES[d[i - 1].chave].inferior).toBe(false);
    // a ordem original fica quando já está boa
    expect(distribuirNosDias(['superiores-a', 'inferiores-a'], ['sex', 'seg']).map((x) => [x.dia, x.chave])).toEqual([
      ['seg', 'superiores-a'],
      ['sex', 'inferiores-a'],
    ]);
  });

  it('volume: meio da faixa do nível; foco no topo com até 30% a mais, no máximo 20', () => {
    expect([volumeAlvo('iniciante', false), volumeAlvo('intermediario', false), volumeAlvo('avancado', false)]).toEqual([9, 12, 16]);
    expect([volumeAlvo('iniciante', true), volumeAlvo('intermediario', true), volumeAlvo('avancado', true)]).toEqual([13, 18, 20]);
  });

  it('filtros: academia pequena sem máquina e smith; casa só o que foi marcado', () => {
    expect(equipamentosDisponiveis({ local: 'academia-completa', equipamentosCasa: [] })).toBeNull();
    const pequena = equipamentosDisponiveis({ local: 'academia-pequena', equipamentosCasa: [] })!;
    expect(pequena.has('maquina') || pequena.has('smith')).toBe(false);
    expect([...equipamentosDisponiveis({ local: 'casa', equipamentosCasa: ['halteres'] })!].sort()).toEqual(['halteres', 'peso-corporal']);
  });
});

describe('PRONTO QUANDO: três perfis', () => {
  it('iniciante em casa, 3 dias: corpo todo, só halteres, elástico e peso do corpo', () => {
    const { plano } = gerar(iniciante);
    coerente(plano, iniciante);
    expect(plano.treinos.map((t) => t.nome)).toEqual(['Corpo todo A', 'Corpo todo B', 'Corpo todo C']);
    for (const t of plano.treinos)
      for (const e of t.exercicios) expect(exercicioPorId(e.exercicioId)!.equipamentos.every((q) => ['halteres', 'elastico', 'peso-corporal'].includes(q))).toBe(true);
    for (const m of ['quadriceps', 'chest', 'upper-back'] as Musculo[]) expect(frequencia(plano, m)).toBeGreaterThanOrEqual(2);
    // emagrecer: compostos 8–12, isolados 12–15; cardio de quem quer começar
    const agachamento = plano.treinos.flatMap((t) => t.exercicios).find((e) => exercicioPorId(e.exercicioId)!.tipo === 'composto')!;
    expect([agachamento.repsMin, agachamento.repsMax, agachamento.descansoSeg]).toEqual([8, 12, 90]);
    expect(plano.treinos.filter((t) => t.cardio)).toHaveLength(3);
    expect(plano.treinos.find((t) => t.cardio)!.cardio).toEqual({ atividade: 'caminhada', minutos: 20, intensidade: 'moderada' });
  });

  it('iniciante em casa sem nenhum equipamento também sai com treino', () => {
    const r = { ...iniciante, equipamentosCasa: [] };
    const { plano } = gerar(r, 'manter');
    coerente(plano, r);
    for (const t of plano.treinos) for (const e of t.exercicios) expect(exercicioPorId(e.exercicioId)!.equipamentos).toEqual(['peso-corporal']);
  });

  it('intermediária na academia, 4 dias, foco em glúteos e dor no joelho: nada que force o joelho', () => {
    const { plano } = gerar(intermediaria, 'ganhar_massa');
    coerente(plano, intermediaria);
    const todos = plano.treinos.flatMap((t) => t.exercicios.map((e) => exercicioPorId(e.exercicioId)!));
    expect(todos.filter((e) => e.estresseArticular.joelho === 'alto')).toEqual([]);
    expect(todos.map((e) => e.id)).not.toContain('agachamento-livre-barra');
    expect(plano.treinos.map((t) => t.nome)).toEqual(['Superiores A', 'Inferiores A', 'Superiores B', 'Inferiores B']);
    // glúteo é foco: mais séries que um músculo sem foco e vem primeiro nos dias de pernas
    const vol = volumePorMusculo(montarEsqueleto(intermediaria).sessoes);
    expect(vol.get('gluteal')!).toBeGreaterThan(vol.get('quadriceps')!);
    expect(vol.get('gluteal')!).toBeLessThanOrEqual(20);
    expect(vol.get('abductors')).toBeGreaterThan(0);
    for (const t of plano.treinos.filter((x) => x.nome.startsWith('Inferiores'))) {
      expect(exercicioPorId(t.exercicios[0].exercicioId)!.musculoPrincipal).toBe('gluteal');
    }
    for (const m of ['chest', 'upper-back', 'deltoids', 'gluteal', 'hamstring'] as Musculo[]) expect(frequencia(plano, m)).toBeGreaterThanOrEqual(2);
    expect(plano.treinos.some((t) => t.cardio)).toBe(false);
    // ganhar massa: compostos 6–10 com 120 s
    const composto = plano.treinos[0].exercicios[0];
    expect([composto.repsMin, composto.repsMax, composto.descansoSeg]).toEqual([6, 10, 120]);
  });

  it('avançado, 6 dias: empurrar, puxar e pernas duas vezes', () => {
    const { plano } = gerar(avancado, 'manter');
    coerente(plano, avancado);
    expect(plano.treinos.map((t) => t.nome)).toEqual(['Empurrar', 'Puxar', 'Pernas e glúteos', 'Empurrar', 'Puxar', 'Pernas e glúteos B']);
    for (const m of ['chest', 'upper-back', 'deltoids', 'quadriceps', 'gluteal', 'biceps', 'triceps'] as Musculo[]) expect(frequencia(plano, m)).toBeGreaterThanOrEqual(2);
    const vol = volumePorMusculo(montarEsqueleto(avancado).sessoes);
    expect(vol.get('chest')!).toBeGreaterThanOrEqual(16);
    expect(vol.get('chest')!).toBeLessThanOrEqual(20);
    // cardio: quem já corre continua na corrida, 2 dias, fora dos dias de pernas
    const comCardio = plano.treinos.filter((t) => t.cardio);
    expect(comCardio).toHaveLength(2);
    expect(comCardio.every((t) => t.cardio!.atividade === 'corrida' && !t.nome.startsWith('Pernas'))).toBe(true);
    // variação: as duas sessões de empurrar não são iguais
    expect(plano.treinos[0].exercicios.map((e) => e.exercicioId)).not.toEqual(plano.treinos[3].exercicios.map((e) => e.exercicioId));
  });

  it('iniciante com 6 dias: aceita, com aviso', () => {
    const esq = montarEsqueleto({ ...iniciante, dias: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'] });
    expect(esq.sessoes).toHaveLength(6);
    expect(esq.avisos[0]).toMatch(/3 ou 4 dias/);
  });
});

describe('IA: validação e fallback', () => {
  const esq: Esqueleto = montarEsqueleto(intermediaria);
  const regras = escolherSemIA(esq);

  it('aceita a escolha da IA quando os ids e os músculos batem, e usa o nome dela', () => {
    const ia = { sessoes: esq.sessoes.map((s, i) => ({ nome: `Dia ${i + 1}`, ids: [...regras[i]].reverse() })), explicacao: 'Treino focado em glúteos, com 4 dias. Explicação de teste.' };
    const { plano, sessoesDaIA } = montarPlano({ respostas: intermediaria, objetivo: 'manter', esqueleto: esq, hoje: HOJE, ia });
    expect(sessoesDaIA).toBe(4);
    expect(plano.treinos[0].nome).toBe('Dia 1');
    expect(plano.ia?.explicacao).toBe('Treino focado em glúteos, com 4 dias. Explicação de teste.');
  });

  it('id fora dos candidatos, repetido ou quantidade errada → a sessão volta para as regras', () => {
    const s = esq.sessoes[0];
    expect(escolhaValida(s, regras[0])).toBe(true);
    expect(escolhaValida(s, [...regras[0].slice(1), 'agachamento-livre-barra'])).toBe(false);
    expect(escolhaValida(s, [regras[0][0], ...regras[0].slice(0, -1)])).toBe(false);
    expect(escolhaValida(s, regras[0].slice(1))).toBe(false);
    expect(escolhaValida(s, 'nada')).toBe(false);

    const ia = { sessoes: [{ nome: 'Errado', ids: ['agachamento-livre-barra'] }], explicacao: 'x' };
    const { plano, sessoesDaIA } = montarPlano({ respostas: intermediaria, objetivo: 'manter', esqueleto: esq, hoje: HOJE, ia });
    expect(sessoesDaIA).toBe(0);
    expect(plano.treinos[0].nome).toBe('Superiores A');
    expect(plano.ia?.explicacao).toMatch(/4 dias por semana/);
  });

  it('"Gerar outro" varia a escolha entre os melhores candidatos', () => {
    const a = escolherSemIA(esq).flat();
    const b = escolherSemIA(esq, { semente: 7, evitar: new Set(a) }).flat();
    expect(b.filter((id) => !a.includes(id)).length).toBeGreaterThan(0);
  });

  it('plano da IA: bloco de 5 semanas começando na segunda desta semana', () => {
    const { plano } = gerar(intermediaria);
    expect(plano).toMatchObject({ origem: 'ia', ativo: true, ia: { inicioBloco: '2026-09-28', semanasNoBloco: 5, bloco: 1 } });
    expect(plano.treinos.every((t) => DIAS.includes(t.dia))).toBe(true);
  });
});

describe('semana de alívio e próxima fase', () => {
  const plano = { ia: { respostas: intermediaria, inicioBloco: '2026-09-28', semanasNoBloco: 5, explicacao: '' } };
  it('na 5ª semana, séries × 0,6 arredondando (mínimo 1)', () => {
    expect([4, 3, 2, 1].map((n) => seriesNaSemana(n, plano, '2026-10-26'))).toEqual([2, 2, 1, 1]);
    expect(seriesNaSemana(4, plano, '2026-10-19')).toBe(4);
    expect(seriesNaSemana(4, undefined, '2026-10-26')).toBe(4);
  });
  it('semana do bloco e hora da próxima fase', () => {
    expect(semanaDoBloco(plano, '2026-09-30')).toBe(1);
    expect(semanaDoBloco(plano, '2026-10-26')).toBe(5);
    expect(semanaDoBloco(plano, '2026-11-02')).toBeNull();
    expect(horaDaProximaFase(plano, '2026-10-25')).toBe(false);
    expect(horaDaProximaFase(plano, '2026-10-26')).toBe(true);
    expect(horaDaProximaFase(plano, '2026-11-10')).toBe(true);
  });
});

describe('cliente da IA', () => {
  const pedido = { respostas: intermediaria, objetivo: 'manter' as const, hoje: HOJE };

  it('envia o esqueleto com os candidatos já filtrados (nada que force o joelho)', () => {
    const esq = montarEsqueleto(intermediaria);
    const corpo = corpoDoPedido(esq, { ...pedido, evitar: ['x'] }) as {
      contexto: { lesoes: string[] };
      sessoes: { vagas: unknown[]; candidatos: { id: string }[] }[];
      evitar: string[];
    };
    expect(corpo.contexto.lesoes).toEqual(['joelho']);
    expect(corpo.sessoes).toHaveLength(4);
    expect(corpo.evitar).toEqual(['x']);
    const ids = corpo.sessoes.flatMap((s) => s.candidatos.map((c) => c.id));
    expect(ids).not.toContain('agachamento-livre-barra');
    expect(ids.every((id) => exercicioPorId(id)?.estresseArticular.joelho !== 'alto')).toBe(true);
  });

  it('interpreta a resposta: 200 vira escolha; sem chave vira exemplo; erro vira regras', () => {
    expect(escolhaDaResposta(200, { sessoes: [{ nome: 'A', ids: ['x'] }], explicacao: 'oi' })).toEqual({ sessoes: [{ nome: 'A', ids: ['x'] }], explicacao: 'oi' });
    expect(escolhaDaResposta(503, { error: 'sem_chave' })).toBe('sem_chave');
    expect(escolhaDaResposta(502, { error: 'falha_ia' })).toBeNull();
    expect(escolhaDaResposta(200, { nada: 1 })).toBeNull();
  });

  it('sem internet ou com a IA fora, o treino sai pelas regras', async () => {
    const original = global.fetch;
    global.fetch = (() => Promise.reject(new Error('offline'))) as typeof fetch;
    try {
      const g = await gerarTreino(pedido, { url: 'https://exemplo.supabase.co', key: 'k' });
      expect(g.fonte).toBe('regras');
      expect(g.plano.treinos).toHaveLength(4);
    } finally {
      global.fetch = original;
    }
  });

  it('com a IA respondendo certo, usa a escolha dela', async () => {
    const esq = montarEsqueleto(intermediaria);
    const regras = escolherSemIA(esq);
    const original = global.fetch;
    global.fetch = (() =>
      Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ sessoes: regras.map((ids, i) => ({ nome: `Treino ${i + 1}`, ids })), explicacao: 'Explicação vinda da IA, com mais de vinte letras.' }),
      })) as unknown as typeof fetch;
    try {
      const g = await gerarTreino(pedido, { url: 'https://exemplo.supabase.co', key: 'k' });
      expect(g.fonte).toBe('ia');
      expect(g.plano.treinos[0].nome).toBe('Treino 1');
      expect(g.plano.ia?.explicacao).toBe('Explicação vinda da IA, com mais de vinte letras.');
    } finally {
      global.fetch = original;
    }
  });
});
