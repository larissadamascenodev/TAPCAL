/**
 * Esqueleto do plano (SPEC-TREINOS, 5.2): divisão pelos dias, distribuição na
 * semana, vagas de exercício por músculo em cada sessão e séries de cada vaga
 * para bater o volume semanal. Sem IA.
 */

import { DIAS } from '@/lib/treino/semana';
import type { DiaSemana, Exercicio, Musculo, RespostasTreinoIA } from '@/types/treino';

import { candidatosPorMusculo } from './candidatos';
import {
  divisao,
  exerciciosPorSessao,
  FOCO_MUSCULOS,
  GRANDES,
  MAX_SERIES_MUSCULO_SESSAO,
  MOLDES,
  NOME_SESSAO,
  SERIES_POR_EXERCICIO,
  volumeAlvo,
  type ChaveSessao,
} from './regras';

export type Vaga = { musculo: Musculo; series: number };

export type SessaoEsqueleto = {
  dia: DiaSemana;
  chave: ChaveSessao;
  nome: string;
  /** Uma vaga por exercício, na ordem de prioridade. */
  vagas: Vaga[];
  /** Candidatos de cada músculo da sessão (já filtrados). */
  candidatos: Partial<Record<Musculo, Exercicio[]>>;
};

export type Esqueleto = {
  sessoes: SessaoEsqueleto[];
  focoMusculos: Musculo[];
  /** Avisos para mostrar (ex.: iniciante com 5 ou 6 dias). */
  avisos: string[];
};

const ordemDias = (dias: readonly DiaSemana[]) => [...new Set(dias)].sort((a, b) => DIAS.indexOf(a) - DIAS.indexOf(b));
const seguidos = (a: DiaSemana, b: DiaSemana) => DIAS.indexOf(b) - DIAS.indexOf(a) === 1;

/** Todas as ordens possíveis (a original primeiro). */
function permutacoes<T>(lista: readonly T[]): T[][] {
  if (lista.length <= 1) return [[...lista]];
  const out: T[][] = [];
  lista.forEach((x, i) => {
    for (const resto of permutacoes([...lista.slice(0, i), ...lista.slice(i + 1)])) out.push([x, ...resto]);
  });
  return out;
}

/**
 * Coloca as sessões nos dias escolhidos, na ordem da semana. Se duas sessões
 * de pernas caírem em dias seguidos e houver outra arrumação, rearranja
 * (a que mexe menos na ordem original).
 */
export function distribuirNosDias(chaves: readonly ChaveSessao[], dias: readonly DiaSemana[]): { dia: DiaSemana; chave: ChaveSessao }[] {
  const d = ordemDias(dias).slice(0, chaves.length);
  const conflitos = (ordem: readonly ChaveSessao[]) =>
    ordem.reduce((n, c, i) => (i > 0 && MOLDES[c].inferior && MOLDES[ordem[i - 1]].inferior && seguidos(d[i - 1], d[i]) ? n + 1 : n), 0);
  let melhor = [...chaves];
  let menor = conflitos(melhor);
  if (menor > 0) {
    for (const ordem of permutacoes(chaves)) {
      const c = conflitos(ordem);
      if (c < menor) {
        melhor = ordem;
        menor = c;
        if (c === 0) break;
      }
    }
  }
  return melhor.map((chave, i) => ({ dia: d[i], chave }));
}

/**
 * Músculos da sessão com o foco aplicado: os de foco vão para a frente;
 * abdutores entram junto com glúteos e oblíquos junto com abdômen quando são foco.
 */
export function musculosDaSessao(chave: ChaveSessao, foco: readonly Musculo[]): Musculo[] {
  const base = [...MOLDES[chave].musculos];
  if (foco.includes('abductors') && base.includes('gluteal')) base.splice(base.indexOf('gluteal') + 1, 0, 'abductors');
  if (foco.includes('obliques') && base.includes('abs')) base.splice(base.indexOf('abs') + 1, 0, 'obliques');
  return [...base.filter((m) => foco.includes(m)), ...base.filter((m) => !foco.includes(m))];
}

/**
 * Vagas da sessão: um exercício por músculo, na ordem, até o número de
 * exercícios do tempo; sobrando vaga, repete músculos (foco primeiro, depois
 * os grandes; os pequenos ficam com um só). Músculo sem candidato fica de fora.
 */
export function vagasDaSessao(musculos: readonly Musculo[], quantos: number, foco: readonly Musculo[], temCandidato: (m: Musculo) => boolean): Musculo[] {
  const possiveis = musculos.filter(temCandidato);
  const vagas = possiveis.slice(0, quantos);
  // Só os de foco e os grupos grandes ganham um segundo (ou terceiro) exercício.
  const extras = [...possiveis.filter((m) => foco.includes(m)), ...possiveis.filter((m) => !foco.includes(m) && GRANDES.includes(m))];
  const limite = (m: Musculo) => (foco.includes(m) ? 3 : 2);
  for (let volta = 0; vagas.length < quantos && volta < 3; volta++) {
    for (const m of extras) {
      if (vagas.length >= quantos) break;
      if (vagas.filter((x) => x === m).length < limite(m)) vagas.push(m);
    }
  }
  return vagas;
}

/** Monta o esqueleto a partir das respostas. */
export function montarEsqueleto(r: RespostasTreinoIA, lista?: readonly Exercicio[]): Esqueleto {
  const dias = ordemDias(r.dias).slice(0, 6);
  const focoMusculos = [...new Set(r.foco.flatMap((f) => FOCO_MUSCULOS[f]))];
  const candidatos = candidatosPorMusculo(r, lista);
  const quantos = exerciciosPorSessao(r.tempo, r.experiencia);

  const distribuidas = distribuirNosDias(divisao(dias.length, r.experiencia), dias);
  const daSessao = (chave: ChaveSessao, m: Musculo) => {
    const somente = MOLDES[chave].somente?.[m];
    const lista = candidatos.get(m) ?? [];
    return somente ? lista.filter((e) => somente.includes(e.id)) : lista;
  };
  const porSessao = distribuidas.map(({ dia, chave }) => ({
    dia,
    chave,
    musculos: vagasDaSessao(musculosDaSessao(chave, focoMusculos), quantos, focoMusculos, (m) => daSessao(chave, m).length > 0),
  }));

  // Séries de cada vaga: volume semanal do músculo dividido pelas vagas dele na semana.
  const vagasNaSemana = new Map<Musculo, number>();
  for (const s of porSessao) for (const m of s.musculos) vagasNaSemana.set(m, (vagasNaSemana.get(m) ?? 0) + 1);
  const [minS, maxS] = SERIES_POR_EXERCICIO;
  const seriesDe = (m: Musculo) =>
    Math.min(maxS, Math.max(minS, Math.round(volumeAlvo(r.experiencia, focoMusculos.includes(m)) / (vagasNaSemana.get(m) ?? 1))));

  const sessoes: SessaoEsqueleto[] = porSessao.map(({ dia, chave, musculos }) => {
    const vagas: Vaga[] = musculos.map((m) => ({ musculo: m, series: seriesDe(m) }));
    // No máximo 10 séries do mesmo músculo numa sessão.
    for (const m of new Set(musculos)) {
      let excesso = vagas.filter((v) => v.musculo === m).reduce((s, v) => s + v.series, 0) - MAX_SERIES_MUSCULO_SESSAO;
      for (let i = vagas.length - 1; excesso > 0 && i >= 0; i--) {
        if (vagas[i].musculo !== m) continue;
        const tira = Math.min(excesso, vagas[i].series - minS);
        vagas[i] = { ...vagas[i], series: vagas[i].series - tira };
        excesso -= tira;
      }
    }
    return {
      dia,
      chave,
      nome: NOME_SESSAO[chave],
      vagas,
      candidatos: Object.fromEntries([...new Set(musculos)].map((m) => [m, daSessao(chave, m)])),
    };
  });

  const avisos: string[] = [];
  if (r.experiencia === 'iniciante' && dias.length >= 5) {
    avisos.push('No começo, 3 ou 4 dias por semana costumam render mais. Mantivemos o volume de iniciante para os seus dias.');
  }
  return { sessoes, focoMusculos, avisos };
}

/** Séries por músculo na semana (para a explicação e os testes). */
export function volumePorMusculo(sessoes: readonly Pick<SessaoEsqueleto, 'vagas'>[]): Map<Musculo, number> {
  const out = new Map<Musculo, number>();
  for (const s of sessoes) for (const v of s.vagas) out.set(v.musculo, (out.get(v.musculo) ?? 0) + v.series);
  return out;
}
