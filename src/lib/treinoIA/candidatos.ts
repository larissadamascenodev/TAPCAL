/**
 * Filtros de candidatos (SPEC-TREINOS, 5.2): equipamento e local, lesões e nível.
 */

import { EXERCICIOS } from '@/data/exercicios';
import type { Equipamento, Exercicio, Musculo, RespostasTreinoIA } from '@/types/treino';

const NIVEIS: Exercicio['nivel'][] = ['iniciante', 'intermediario', 'avancado'];

/** Equipamentos disponíveis pelo local (null = tudo). */
export function equipamentosDisponiveis(r: Pick<RespostasTreinoIA, 'local' | 'equipamentosCasa'>): Set<Equipamento> | null {
  if (r.local === 'academia-completa') return null;
  if (r.local === 'academia-pequena') {
    return new Set<Equipamento>(['barra', 'halteres', 'polia', 'peso-corporal', 'elastico', 'kettlebell', 'banco', 'barra-fixa', 'anilha']);
  }
  return new Set<Equipamento>([...r.equipamentosCasa, 'peso-corporal']);
}

/** O exercício passa pelos filtros das respostas? */
export function serveParaRespostas(e: Exercicio, r: Pick<RespostasTreinoIA, 'local' | 'equipamentosCasa' | 'lesoes' | 'experiencia'>): boolean {
  const disponiveis = equipamentosDisponiveis(r);
  if (disponiveis && !e.equipamentos.every((q) => disponiveis.has(q))) return false;
  if (!e.locais.includes(r.local === 'casa' ? 'casa' : 'academia')) return false;
  if (r.lesoes.some((reg) => e.estresseArticular[reg] === 'alto')) return false;
  return NIVEIS.indexOf(e.nivel) <= NIVEIS.indexOf(r.experiencia);
}

/** Candidatos por músculo principal, na ordem da biblioteca. */
export function candidatosPorMusculo(
  r: Pick<RespostasTreinoIA, 'local' | 'equipamentosCasa' | 'lesoes' | 'experiencia'>,
  lista: readonly Exercicio[] = EXERCICIOS,
): Map<Musculo, Exercicio[]> {
  const out = new Map<Musculo, Exercicio[]>();
  for (const e of lista) {
    if (e.origem !== 'tapcal' || !serveParaRespostas(e, r)) continue;
    out.set(e.musculoPrincipal, [...(out.get(e.musculoPrincipal) ?? []), e]);
  }
  return out;
}
