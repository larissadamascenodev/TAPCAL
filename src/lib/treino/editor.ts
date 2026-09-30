/**
 * Editor do treino personalizado (SPEC-TREINOS, etapa 3): rascunho do plano,
 * operações do editor de cada dia, exercício criado pela pessoa e validação.
 * Tudo puro: as telas só chamam estas funções e guardam o resultado.
 */

import { newId } from '@/lib/id';
import { normalize } from '@/lib/taco';
import type { DiaSemana, Equipamento, Exercicio, ExercicioNoTreino, Musculo, PlanoDeTreino, TreinoDoDia } from '@/types/treino';

import { DIA_NOME, DIAS } from './semana';

export const NOME_PADRAO_PLANO = 'Meu treino';

/** Sugestões para o nome do treino do dia. */
export const NOMES_SUGERIDOS: readonly string[] = [
  'Pernas e glúteos',
  'Peito e tríceps',
  'Costas e bíceps',
  'Ombros e abdômen',
  'Corpo todo',
  'Superiores',
  'Inferiores',
];

/** Descansos que o editor oferece, em segundos. */
export const DESCANSOS: readonly number[] = [45, 60, 90, 120, 180];

export const LIMITES = { seriesMin: 1, seriesMax: 10, repsMin: 1, repsMax: 50, cargaMax: 500 } as const;

/** Rascunho do plano enquanto a pessoa monta: nome e um treino por dia escolhido. */
export type Rascunho = {
  /** Plano que está sendo editado (ausente = plano novo). */
  planoId?: string;
  nome: string;
  treinos: TreinoDoDia[];
};

export function rascunhoVazio(): Rascunho {
  return { nome: NOME_PADRAO_PLANO, treinos: [] };
}

export function rascunhoDoPlano(p: PlanoDeTreino): Rascunho {
  return { planoId: p.id, nome: p.nome, treinos: p.treinos.map((t) => ({ ...t, exercicios: [...t.exercicios] })) };
}

const ordenar = (treinos: TreinoDoDia[]) => [...treinos].sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia));

/** Nome inicial do treino de um dia ("Treino de segunda"). */
export function nomeDoDia(dia: DiaSemana): string {
  return `Treino de ${DIA_NOME[dia]}`;
}

/** Liga ou desliga um dia. Desligar tira o treino do dia (vira descanso). */
export function alternarDia(r: Rascunho, dia: DiaSemana): Rascunho {
  if (r.treinos.some((t) => t.dia === dia)) return { ...r, treinos: r.treinos.filter((t) => t.dia !== dia) };
  return { ...r, treinos: ordenar([...r.treinos, { id: newId(), dia, nome: nomeDoDia(dia), exercicios: [] }]) };
}

export function atualizarTreino(r: Rascunho, dia: DiaSemana, mudar: (t: TreinoDoDia) => TreinoDoDia): Rascunho {
  return { ...r, treinos: r.treinos.map((t) => (t.dia === dia ? mudar(t) : t)) };
}

/** Padrão de um exercício novo no treino: 3 × 10–12, descanso 90 s (composto) ou 60 s (isolado). */
export function exercicioPadrao(ex: Pick<Exercicio, 'id' | 'tipo'>): ExercicioNoTreino {
  return { id: newId(), exercicioId: ex.id, series: 3, repsMin: 10, repsMax: 12, descansoSeg: ex.tipo === 'composto' ? 90 : 60 };
}

/** Adiciona ao fim, na ordem dada, os exercícios que ainda não estão no treino. */
export function adicionarExercicios(t: TreinoDoDia, exercicios: readonly Pick<Exercicio, 'id' | 'tipo'>[]): TreinoDoDia {
  const ja = new Set(t.exercicios.map((e) => e.exercicioId));
  const novos = exercicios.filter((e, i) => !ja.has(e.id) && exercicios.findIndex((x) => x.id === e.id) === i);
  return { ...t, exercicios: [...t.exercicios, ...novos.map(exercicioPadrao)] };
}

/** Tira do treino um exercício da biblioteca (desmarcar na seleção). */
export function tirarDaBiblioteca(t: TreinoDoDia, exercicioId: string): TreinoDoDia {
  return { ...t, exercicios: t.exercicios.filter((e) => e.exercicioId !== exercicioId) };
}

export function removerExercicio(t: TreinoDoDia, id: string): TreinoDoDia {
  return { ...t, exercicios: t.exercicios.filter((e) => e.id !== id) };
}

/** Sobe (−1) ou desce (+1) um exercício na ordem de execução. */
export function moverExercicio(t: TreinoDoDia, id: string, delta: -1 | 1): TreinoDoDia {
  const i = t.exercicios.findIndex((e) => e.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= t.exercicios.length) return t;
  const lista = [...t.exercicios];
  [lista[i], lista[j]] = [lista[j], lista[i]];
  return { ...t, exercicios: lista };
}

/** Leva um exercício para outra posição (arrastar na lista); fora dos limites, vai para a ponta. */
export function moverExercicioPara(t: TreinoDoDia, id: string, novoIndice: number): TreinoDoDia {
  const i = t.exercicios.findIndex((e) => e.id === id);
  if (i < 0) return t;
  const j = Math.max(0, Math.min(t.exercicios.length - 1, Math.round(novoIndice)));
  if (i === j) return t;
  const lista = [...t.exercicios];
  const [item] = lista.splice(i, 1);
  lista.splice(j, 0, item);
  return { ...t, exercicios: lista };
}

const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

/**
 * Aplica a edição de um exercício, mantendo tudo dentro dos limites: séries
 * de 1 a 10, repetições de 1 a 50 (máximo nunca menor que o mínimo), carga
 * opcional (vazia ou zero = sem carga inicial) e observação sem espaços sobrando.
 */
export function editarExercicio(t: TreinoDoDia, id: string, mudanca: Partial<Omit<ExercicioNoTreino, 'id' | 'exercicioId'>>): TreinoDoDia {
  return {
    ...t,
    exercicios: t.exercicios.map((e) => {
      if (e.id !== id) return e;
      const m = { ...e, ...mudanca };
      const repsMin = limitar(m.repsMin, LIMITES.repsMin, LIMITES.repsMax);
      const out: ExercicioNoTreino = {
        id: e.id,
        exercicioId: e.exercicioId,
        series: limitar(m.series, LIMITES.seriesMin, LIMITES.seriesMax),
        repsMin,
        repsMax: limitar(Math.max(m.repsMax, repsMin), repsMin, LIMITES.repsMax),
        descansoSeg: m.descansoSeg,
      };
      if (m.cargaInicialKg != null && m.cargaInicialKg > 0) out.cargaInicialKg = Math.min(LIMITES.cargaMax, Math.round(m.cargaInicialKg * 10) / 10);
      const obs = m.observacao?.trim();
      if (obs) out.observacao = obs;
      return out;
    }),
  };
}

/**
 * Mais uma série ou uma a menos no exercício (no meio do treino também): de 1
 * a 10, e nunca menos que as séries já feitas hoje.
 */
export function mudarSeries(t: TreinoDoDia, id: string, delta: 1 | -1, feitas = 0): TreinoDoDia {
  return {
    ...t,
    exercicios: t.exercicios.map((e) =>
      e.id === id ? { ...e, series: limitar(e.series + delta, Math.max(LIMITES.seriesMin, feitas), LIMITES.seriesMax) } : e,
    ),
  };
}

/**
 * Copia o treino de um dia para outro (com ids novos). Se o destino ainda for
 * descanso, ele passa a ser dia de treino; se já tiver treino, é substituído.
 */
export function copiarDia(r: Rascunho, de: DiaSemana, para: DiaSemana): Rascunho {
  const origem = r.treinos.find((t) => t.dia === de);
  if (!origem || de === para) return r;
  const destino = r.treinos.find((t) => t.dia === para);
  const copia: TreinoDoDia = {
    ...origem,
    id: destino?.id ?? newId(),
    dia: para,
    exercicios: origem.exercicios.map((e) => ({ ...e, id: newId() })),
  };
  return { ...r, treinos: ordenar([...r.treinos.filter((t) => t.dia !== para), copia]) };
}

/** Limpar o dia: ele volta a ser descanso. */
export function limparDia(r: Rascunho, dia: DiaSemana): Rascunho {
  return { ...r, treinos: r.treinos.filter((t) => t.dia !== dia) };
}

export type Problema = { dia?: DiaSemana; mensagem: string };

/** O que falta para salvar (lista vazia = pode salvar). */
export function problemasDoRascunho(r: Rascunho): Problema[] {
  const out: Problema[] = [];
  if (!r.nome.trim()) out.push({ mensagem: 'Dê um nome ao plano' });
  if (!r.treinos.length) out.push({ mensagem: 'Escolha pelo menos um dia de treino' });
  for (const t of r.treinos) {
    if (!t.exercicios.length) out.push({ dia: t.dia, mensagem: `${DIA_NOME[t.dia].charAt(0).toUpperCase()}${DIA_NOME[t.dia].slice(1)} está sem exercícios` });
  }
  return out;
}

/**
 * Plano final do rascunho. Plano novo ganha id novo e sai ativo; ao editar,
 * mantém id, origem, data e se estava ativo (os ids dos dias ficam iguais, e
 * os treinos já feitos continuam ligados a eles).
 */
export function planoDoRascunho(r: Rascunho, anterior?: PlanoDeTreino, criadoEm = new Date().toISOString()): PlanoDeTreino {
  const treinos = ordenar(r.treinos).map((t) => ({ ...t, nome: t.nome.trim() || nomeDoDia(t.dia) }));
  const nome = r.nome.trim() || NOME_PADRAO_PLANO;
  if (anterior) return { ...anterior, nome, treinos };
  return { id: newId(), nome, origem: 'personalizado', ativo: true, treinos, criadoEm };
}

export type NovoExercicio = { nome: string; musculo: Musculo; equipamento: Equipamento };

/** Exercício criado pela pessoa: sem mídia, sem instruções, visível só para ela. */
export function exercicioDoUsuario({ nome, musculo, equipamento }: NovoExercicio): Exercicio {
  const espacos = nome.trim().replace(/\s+/g, ' ');
  const limpo = espacos.charAt(0).toUpperCase() + espacos.slice(1);
  const slug = normalize(limpo).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id: `usuario-${slug || 'exercicio'}-${newId().slice(-6)}`,
    nome: limpo,
    nomesAlternativos: [],
    musculoPrincipal: musculo,
    musculosSecundarios: [],
    equipamentos: [equipamento],
    locais: ['academia', 'casa'],
    nivel: 'iniciante',
    tipo: 'isolado',
    estresseArticular: {},
    instrucoes: [],
    origem: 'usuario',
  };
}
