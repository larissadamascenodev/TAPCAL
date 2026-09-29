/**
 * Do esqueleto ao PlanoDeTreino (SPEC-TREINOS, 5.2 e 5.3): escolha dos
 * exercícios sem IA (fallback), validação da escolha da IA, séries,
 * repetições e descanso pelas regras, cardio, bloco de 5 semanas e explicação.
 */

import { exercicioPorId } from '@/lib/exercicios';
import { newId } from '@/lib/id';
import { datasDaSemana } from '@/lib/treino/semana';
import type { DateKey, Goal } from '@/types';
import type { Exercicio, ExercicioNoTreino, Musculo, PlanoDeTreino, RespostasTreinoIA, TreinoDoDia } from '@/types/treino';

import type { Esqueleto, SessaoEsqueleto } from './esqueleto';
import { volumePorMusculo } from './esqueleto';
import { cardioDoPlano, FOCO_LABELS, GRANDES, nomeDaDivisao, PRESCRICAO, SEMANAS_NO_BLOCO, TAMANHO, volumeAlvo } from './regras';

/** Gerador pseudoaleatório com semente (mesma semente, mesma escolha). */
function aleatorio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type OpcoesEscolha = {
  /** 0 = escolha fixa pelas regras; outro número varia entre os melhores candidatos. */
  semente?: number;
  /** Ids do plano anterior ("Gerar outro"): ficam para o fim da fila. */
  evitar?: ReadonlySet<string>;
};

/**
 * Escolha sem IA: para cada vaga, o melhor candidato do músculo que ainda não
 * está na sessão. A primeira vaga do músculo prefere composto, a segunda,
 * isolado; evita repetir o que já saiu em outra sessão (variar) e o que estava
 * no plano anterior.
 */
export function escolherSemIA(
  esq: Pick<Esqueleto, 'sessoes'> & Partial<Pick<Esqueleto, 'focoMusculos'>>,
  { semente = 0, evitar, academia = true }: OpcoesEscolha & { academia?: boolean } = {},
): string[][] {
  const foco = esq.focoMusculos ?? [];
  const rnd = aleatorio(semente);
  const usadosNaSemana = new Map<string, number>();
  return esq.sessoes.map((s) => {
    const escolhidos: string[] = [];
    const vistos = new Map<Musculo, number>();
    for (const v of s.vagas) {
      const n = vistos.get(v.musculo) ?? 0;
      vistos.set(v.musculo, n + 1);
      // Grupos grandes começam por composto; os pequenos (braços, abdômen, panturrilha…) vão de isolado.
      // Músculo de foco pode ter um segundo composto.
      const grande = GRANDES.includes(v.musculo);
      const prefere: Exercicio['tipo'] = grande && (n === 0 || (n === 1 && foco.includes(v.musculo))) ? 'composto' : 'isolado';
      const jaDoMusculo = escolhidos.map((id) => exercicioPorId(id)).filter((e) => e?.musculoPrincipal === v.musculo);
      const opcoes = (s.candidatos[v.musculo] ?? []).filter((e) => !escolhidos.includes(e.id));
      if (!opcoes.length) continue;
      const soPesoDoCorpo = (e: Exercicio) => e.equipamentos.every((q) => q === 'peso-corporal' || q === 'banco');
      const nota = (e: Exercicio, i: number) =>
        (e.tipo === prefere ? 0 : 10) +
        (usadosNaSemana.get(e.id) ?? 0) * 5 +
        (evitar?.has(e.id) ? 4 : 0) +
        // Na academia, com carga é melhor que só o peso do corpo.
        (academia && soPesoDoCorpo(e) ? 6 : 0) +
        // Dois do mesmo músculo na sessão: melhor com equipamentos diferentes.
        (jaDoMusculo.some((x) => x?.equipamentos[0] === e.equipamentos[0]) ? 2 : 0) +
        i * 0.1 +
        (semente ? rnd() * 3 : 0);
      const melhor = opcoes.map((e, i) => ({ e, n: nota(e, i) })).sort((a, b) => a.n - b.n)[0].e;
      escolhidos.push(melhor.id);
      usadosNaSemana.set(melhor.id, (usadosNaSemana.get(melhor.id) ?? 0) + 1);
    }
    return escolhidos;
  });
}

/**
 * A escolha da IA para a sessão vale? Todo id precisa estar nos candidatos da
 * sessão, sem repetir, e os músculos precisam bater com as vagas.
 */
export function escolhaValida(s: Pick<SessaoEsqueleto, 'vagas' | 'candidatos'>, ids: unknown): ids is string[] {
  if (!Array.isArray(ids) || ids.length !== s.vagas.length || new Set(ids).size !== ids.length) return false;
  const porId = new Map(Object.values(s.candidatos).flatMap((l) => (l ?? []).map((e) => [e.id, e] as const)));
  if (!ids.every((id) => typeof id === 'string' && porId.has(id))) return false;
  const conta = (lista: Musculo[]) => lista.slice().sort().join('|');
  return conta(ids.map((id) => porId.get(id)!.musculoPrincipal)) === conta(s.vagas.map((v) => v.musculo));
}

/** Ordem dentro da sessão: compostos antes de isolados, foco primeiro, grupos grandes antes dos pequenos. */
export function ordenarSessao(ids: readonly string[], foco: readonly Musculo[]): string[] {
  const chave = (id: string) => {
    const e = exercicioPorId(id);
    if (!e) return [2, 2, 99];
    return [e.tipo === 'composto' ? 0 : 1, foco.includes(e.musculoPrincipal) ? 0 : 1, TAMANHO.indexOf(e.musculoPrincipal)];
  };
  return [...ids].sort((a, b) => {
    const [x, y] = [chave(a), chave(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  });
}

/** Explicação sem IA (2 a 4 frases, sem promessa de resultado). */
export function explicacaoPadrao(r: RespostasTreinoIA, esq: Pick<Esqueleto, 'focoMusculos'>): string {
  const partes = [
    `Com ${r.dias.length} dias por semana, a divisão é ${nomeDaDivisao(r.dias.length, r.experiencia)}, para cada músculo ser trabalhado pelo menos 2 vezes na semana.`,
    `O volume segue o seu nível: cerca de ${volumeAlvo(r.experiencia, false)} séries por músculo na semana.`,
  ];
  const foco = r.foco.filter((f) => f !== 'corpo-todo');
  if (foco.length && esq.focoMusculos.length) partes.push(`${foco.map((f) => FOCO_LABELS[f]).join(', ')} ganham mais séries e vêm primeiro no treino.`);
  if (r.lesoes.length) partes.push('Deixamos de fora os exercícios que forçam a região que você marcou.');
  return partes.slice(0, 4).join(' ');
}

/** Linhas de "Por que esse treino" com os números das regras. */
export function numerosDasRegras(r: RespostasTreinoIA, objetivo: Goal, esq: Esqueleto): string[] {
  const p = PRESCRICAO[objetivo];
  const vol = volumePorMusculo(esq.sessoes);
  const foco = esq.focoMusculos.filter((m) => vol.has(m));
  const linhas = [
    `${r.dias.length} dias por semana → ${nomeDaDivisao(r.dias.length, r.experiencia)}`,
    `Cerca de ${volumeAlvo(r.experiencia, false)} séries por músculo na semana${foco.length ? `; até ${volumeAlvo(r.experiencia, true)} nos de foco` : ''}`,
    `Compostos: ${p.composto.reps[0]} a ${p.composto.reps[1]} repetições, descanso de ${p.composto.descansoSeg} s. Isolados: ${p.isolado.reps[0]} a ${p.isolado.reps[1]}, descanso de ${p.isolado.descansoSeg} s`,
    `${SEMANAS_NO_BLOCO} semanas: 4 normais e 1 de alívio, com menos séries`,
  ];
  const c = cardioDoPlano(r, objetivo);
  if (c) linhas.push(`Cardio: ${c.cardio.minutos} min de ${c.cardio.atividade === 'eliptico' ? 'elíptico' : c.cardio.atividade} moderada em ${c.dias} dias`);
  return linhas;
}

export type EscolhaIA = { sessoes: { nome?: unknown; ids?: unknown }[]; explicacao?: unknown };

export type Resultado = {
  plano: PlanoDeTreino;
  /** Quantas sessões vieram da IA (o resto, das regras). */
  sessoesDaIA: number;
};

const limparNome = (n: unknown, padrao: string) => (typeof n === 'string' && n.trim() ? n.trim().slice(0, 40) : padrao);

/**
 * Monta o plano final. Cada sessão usa a escolha da IA, se for válida; senão,
 * a das regras. Séries, repetições e descanso vêm sempre das regras.
 */
export function montarPlano(args: {
  respostas: RespostasTreinoIA;
  objetivo: Goal;
  esqueleto: Esqueleto;
  hoje: DateKey;
  ia?: EscolhaIA | null;
  opcoes?: OpcoesEscolha;
  bloco?: number;
  criadoEm?: string;
}): Resultado {
  const { respostas: r, objetivo, esqueleto: esq, hoje, ia, opcoes, bloco = 1 } = args;
  const semIA = escolherSemIA(esq, { ...opcoes, academia: r.local !== 'casa' });
  const presc = PRESCRICAO[objetivo];
  const cardio = cardioDoPlano(r, objetivo, bloco);
  let sessoesDaIA = 0;

  const planoId = newId();
  const treinos: TreinoDoDia[] = esq.sessoes.map((s, i) => {
    const daIA = ia?.sessoes?.[i];
    const valida = daIA && escolhaValida(s, daIA.ids);
    if (valida) sessoesDaIA++;
    const ids = ordenarSessao(valida ? (daIA.ids as string[]) : semIA[i], esq.focoMusculos);
    // Séries: cada exercício pega a vaga do seu músculo (na ordem das vagas).
    const vagas = [...s.vagas];
    const exercicios: ExercicioNoTreino[] = ids.map((id) => {
      const e = exercicioPorId(id)!;
      const k = vagas.findIndex((v) => v.musculo === e.musculoPrincipal);
      const series = k >= 0 ? vagas.splice(k, 1)[0].series : 3;
      const p = presc[e.tipo];
      return { id: newId(), exercicioId: id, series, repsMin: p.reps[0], repsMax: p.reps[1], descansoSeg: p.descansoSeg };
    });
    return { id: `${planoId}-${s.dia}`, dia: s.dia, nome: valida ? limparNome(daIA.nome, s.nome) : s.nome, exercicios };
  });

  // Cardio no fim do treino, nos dias que não são de pernas quando possível.
  if (cardio) {
    const ordem = [...treinos.keys()].sort((a, b) => Number(esq.sessoes[a].chave.startsWith('pernas') || esq.sessoes[a].chave.startsWith('inferiores')) - Number(esq.sessoes[b].chave.startsWith('pernas') || esq.sessoes[b].chave.startsWith('inferiores')));
    for (const i of ordem.slice(0, cardio.dias)) treinos[i] = { ...treinos[i], cardio: cardio.cardio };
  }

  const explicacaoIA = typeof ia?.explicacao === 'string' ? ia.explicacao.trim() : '';
  const explicacao = sessoesDaIA === esq.sessoes.length && explicacaoIA.length >= 20 ? explicacaoIA.slice(0, 600) : explicacaoPadrao(r, esq);

  return {
    sessoesDaIA,
    plano: {
      id: planoId,
      nome: 'Treino com IA',
      origem: 'ia',
      ativo: true,
      treinos,
      criadoEm: args.criadoEm ?? new Date().toISOString(),
      ia: { respostas: r, inicioBloco: datasDaSemana(hoje)[0], semanasNoBloco: SEMANAS_NO_BLOCO, bloco, explicacao },
    },
  };
}
