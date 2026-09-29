/**
 * Semana de treino (segunda a domingo) e o estado de cada dia: feito, descanso
 * ou pendente. O calendário nunca muda sozinho: o treino de segunda continua
 * sendo de segunda, mesmo que tenha sido feito na terça.
 */

import { addDays, fromDateKey } from '@/lib/dates';
import type { DateKey } from '@/types';
import type { DiaSemana, PlanoDeTreino, SessaoDeTreino, TreinoDoDia } from '@/types/treino';

/** Ordem da semana do app: segunda a domingo. */
export const DIAS: readonly DiaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

export const DIA_NOME: Record<DiaSemana, string> = {
  seg: 'segunda',
  ter: 'terça',
  qua: 'quarta',
  qui: 'quinta',
  sex: 'sexta',
  sab: 'sábado',
  dom: 'domingo',
};

export const DIA_CURTO: Record<DiaSemana, string> = {
  seg: 'SEG',
  ter: 'TER',
  qua: 'QUA',
  qui: 'QUI',
  sex: 'SEX',
  sab: 'SÁB',
  dom: 'DOM',
};

/** getDay() (0 = domingo) → dia da semana do app. */
const POR_GETDAY: readonly DiaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export function diaDaData(date: DateKey): DiaSemana {
  return POR_GETDAY[fromDateKey(date).getDay()];
}

/** As 7 datas da semana de `date`, de segunda a domingo. */
export function datasDaSemana(date: DateKey): DateKey[] {
  const segunda = addDays(date, -DIAS.indexOf(diaDaData(date)));
  return DIAS.map((_, i) => addDays(segunda, i));
}

/** Data do dia `dia` na mesma semana de `date`. */
export function dataDoDia(dia: DiaSemana, date: DateKey): DateKey {
  return datasDaSemana(date)[DIAS.indexOf(dia)];
}

export function planoAtivo(planos: readonly PlanoDeTreino[]): PlanoDeTreino | null {
  return planos.find((p) => p.ativo) ?? null;
}

export function treinoDoDia(plano: PlanoDeTreino | null, dia: DiaSemana): TreinoDoDia | null {
  return plano?.treinos.find((t) => t.dia === dia) ?? null;
}

export type EstadoDoDia = {
  tipo: 'feito' | 'descanso' | 'pendente';
  hoje: boolean;
  treino: TreinoDoDia | null;
  /** Quando o treino do dia foi feito em outra data da semana. */
  feitoEm?: DateKey;
  sessao?: SessaoDeTreino;
};

/**
 * Estado de um dia da semana de `hoje`. Feito = existe sessão daquele treino
 * nesta semana, em qualquer data (e `feitoEm` diz a data, se for outra).
 */
export function estadoDoDia(
  plano: PlanoDeTreino | null,
  sessoes: readonly SessaoDeTreino[],
  dia: DiaSemana,
  hoje: DateKey,
): EstadoDoDia {
  const semana = datasDaSemana(hoje);
  const data = semana[DIAS.indexOf(dia)];
  const treino = treinoDoDia(plano, dia);
  const eHoje = data === hoje;
  if (!treino || !plano) return { tipo: 'descanso', hoje: eHoje, treino: null };
  const sessao = sessoes
    .filter((s) => s.planoId === plano.id && s.treinoDoDiaId === treino.id && s.data >= semana[0] && s.data <= semana[6])
    .sort((a, b) => b.fim.localeCompare(a.fim))[0];
  if (sessao) return { tipo: 'feito', hoje: eHoje, treino, sessao, ...(sessao.data !== data ? { feitoEm: sessao.data } : {}) };
  return { tipo: 'pendente', hoje: eHoje, treino };
}

/**
 * "feito na terça", "feito no sábado" (nota do dia feito em outra data). Sempre
 * pelo nome do dia, mesmo que seja hoje ou ontem, para ficar claro no calendário.
 */
export function notaFeitoEm(feitoEm: DateKey): string {
  const dia = diaDaData(feitoEm);
  return `feito ${dia === 'sab' || dia === 'dom' ? 'no' : 'na'} ${DIA_NOME[dia]}`;
}
