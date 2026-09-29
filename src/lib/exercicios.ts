/**
 * Biblioteca de exercícios (SPEC-TREINOS): rótulos, busca com filtros, lado do
 * corpo do mapa muscular, regra de mídia e histórico de cada exercício.
 */

import { EXERCICIOS } from '@/data/exercicios';
import { normalize } from '@/lib/taco';
import { recorde, ultimasSeries } from '@/lib/treino/plano';
import type { Equipamento, Exercicio, Musculo, SerieFeita, SessaoDeTreino } from '@/types/treino';

export const MUSCULO_LABELS: Record<Musculo, string> = {
  chest: 'Peito',
  'upper-back': 'Costas',
  'lower-back': 'Lombar',
  trapezius: 'Trapézio',
  deltoids: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearm: 'Antebraço',
  abs: 'Abdômen',
  obliques: 'Oblíquos',
  quadriceps: 'Quadríceps',
  hamstring: 'Posteriores de coxa',
  gluteal: 'Glúteos',
  adductors: 'Adutores',
  abductors: 'Abdutores',
  calves: 'Panturrilhas',
  tibialis: 'Tibial',
};

/** Ordem dos filtros por músculo (só os que têm exercício como principal). */
export const MUSCULO_ORDEM: readonly Musculo[] = [
  'chest',
  'upper-back',
  'deltoids',
  'biceps',
  'triceps',
  'quadriceps',
  'hamstring',
  'gluteal',
  'calves',
  'abs',
  'obliques',
  'lower-back',
  'trapezius',
  'forearm',
  'adductors',
  'abductors',
];

export const EQUIPAMENTO_LABELS: Record<Equipamento, string> = {
  barra: 'Barra',
  halteres: 'Halteres',
  maquina: 'Máquina',
  polia: 'Polia',
  smith: 'Smith',
  'peso-corporal': 'Peso do corpo',
  elastico: 'Elástico',
  kettlebell: 'Kettlebell',
  banco: 'Banco',
  'barra-fixa': 'Barra fixa',
  anilha: 'Anilha',
};

/** Ordem dos filtros por equipamento (banco fica de fora: quase tudo usa). */
export const EQUIPAMENTO_ORDEM: readonly Equipamento[] = [
  'barra',
  'halteres',
  'maquina',
  'polia',
  'smith',
  'peso-corporal',
  'elastico',
  'kettlebell',
  'barra-fixa',
  'anilha',
];

export const NIVEL_LABELS: Record<Exercicio['nivel'], string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

const POR_ID = new Map(EXERCICIOS.map((e) => [e.id, e]));

/** Exercícios criados pela pessoa (o store registra aqui sempre que a lista muda). */
let doUsuario: readonly Exercicio[] = [];

export function registrarExerciciosDoUsuario(lista: readonly Exercicio[]): void {
  doUsuario = lista;
}

/** Biblioteca completa: os criados pela pessoa primeiro, depois os do TapCal. */
export function todosExercicios(): readonly Exercicio[] {
  return doUsuario.length ? [...doUsuario, ...EXERCICIOS] : EXERCICIOS;
}

export function exercicioPorId(id: string | undefined): Exercicio | undefined {
  return id ? (POR_ID.get(id) ?? doUsuario.find((e) => e.id === id)) : undefined;
}

export type Filtro = { busca?: string; musculo?: Musculo | null; equipamento?: Equipamento | null };

/**
 * Busca por nome e nomes alternativos (sem acento, palavras em qualquer ordem),
 * com filtro por músculo (principal) e equipamento. Mantém a ordem da biblioteca.
 */
export function buscarExercicios({ busca = '', musculo = null, equipamento = null }: Filtro, lista: readonly Exercicio[] = todosExercicios()): Exercicio[] {
  const palavras = normalize(busca).split(/\s+/).filter(Boolean);
  return lista.filter((e) => {
    if (musculo && e.musculoPrincipal !== musculo) return false;
    if (equipamento && !e.equipamentos.includes(equipamento)) return false;
    if (!palavras.length) return true;
    const texto = normalize([e.nome, ...e.nomesAlternativos].join(' '));
    return palavras.every((p) => texto.includes(p));
  });
}

/** Músculos que ficam atrás no corpo: o mapa abre de costas para eles. */
const DE_COSTAS: ReadonlySet<Musculo> = new Set(['upper-back', 'lower-back', 'trapezius', 'triceps', 'hamstring', 'gluteal', 'abductors']);

export function ladoDoMusculo(m: Musculo): 'frente' | 'costas' {
  return DE_COSTAS.has(m) ? 'costas' : 'frente';
}

/**
 * O desenho não tem abdutores: eles acendem nos glúteos. Devolve o slug que o
 * react-native-body-highlighter entende.
 */
export function slugDoDesenho(m: Musculo): Exclude<Musculo, 'abductors'> {
  return m === 'abductors' ? 'gluteal' : m;
}

/** Regra de mídia do app: GIF (o feminino, se houver e o perfil for feminino) ou mapa muscular. */
export function midiaDoExercicio(e: Exercicio, sexo: 'feminino' | 'masculino' | undefined): { tipo: 'gif'; url: string } | { tipo: 'mapa' } {
  const url = sexo === 'feminino' ? (e.midia?.gifUrlFeminino ?? e.midia?.gifUrl) : e.midia?.gifUrl;
  return url ? { tipo: 'gif', url } : { tipo: 'mapa' };
}

export type Historico = { ultima: SerieFeita[]; ultimaData: string | null; recorde: SerieFeita | null };

/**
 * Histórico do exercício da biblioteca: séries da última sessão em que ele foi
 * feito e o recorde, juntando todos os treinos (de qualquer plano) que o usam.
 */
export function historicoDoExercicio(id: string, sessoes: readonly SessaoDeTreino[]): Historico {
  const ultimas = ultimasSeries(sessoes, id);
  return { ultima: ultimas?.series ?? [], ultimaData: ultimas?.data ?? null, recorde: recorde(sessoes, id) };
}
