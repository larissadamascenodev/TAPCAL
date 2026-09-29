/**
 * Gasto do treino por MET, descontando o repouso (que já está na meta):
 * kcal = (MET − 1) × peso (kg) × horas.
 *
 * METs de partida do SPEC. Códigos do Compêndio de Atividades Físicas
 * (Herrmann et al., 2024 Adult Compendium, pacompendium.com) — A CONFERIR na
 * tabela 2024 antes de publicar: os códigos abaixo seguem a numeração do
 * Compêndio de 2011, que o de 2024 mantém na maioria das atividades.
 */

import type { Cardio, SessaoEmAndamento } from '@/types/treino';

/** Musculação, vários exercícios de 8 a 15 repetições (02052). */
export const MET_MUSCULACAO = 3.5;

export const MET_CARDIO: Record<Cardio['atividade'], Record<Cardio['intensidade'], number>> = {
  // Caminhada no plano: devagar (17151) · moderada, ~5 km/h (17190) · rápida, ~6 km/h (17220)
  caminhada: { leve: 2.8, moderada: 3.5, intensa: 5.0 },
  // Corrida: 6,4 km/h (12020) · 8 km/h (12050) · 9,7 km/h (12070)
  corrida: { leve: 6.0, moderada: 8.3, intensa: 9.8 },
  // Bicicleta ergométrica: leve, 30–50 W (02014) · moderada (02010) · intensa (02019)
  bicicleta: { leve: 3.5, moderada: 7.0, intensa: 8.8 },
  // Elíptico: leve · moderado (02048) · intenso
  eliptico: { leve: 4.0, moderada: 5.0, intensa: 6.5 },
};

/** Tempo máximo contado numa sessão (se a pessoa esquecer de finalizar). */
export const MAX_MINUTOS_SESSAO = 180;

/** kcal de uma atividade: (MET − 1) × peso × horas. */
export function kcalAtividade(met: number, pesoKg: number, minutos: number): number {
  return Math.max(0, (met - 1) * pesoKg * (Math.max(0, minutos) / 60));
}

/** Minutos da sessão pelo cronômetro, sem o tempo pausado, limitados a 3 horas. */
export function minutosDaSessao(inicio: string, fim: string, pausaMs = 0): number {
  const ms = Date.parse(fim) - Date.parse(inicio) - pausaMs;
  return Number.isFinite(ms) ? Math.min(MAX_MINUTOS_SESSAO, Math.max(0, ms / 60_000)) : 0;
}

/** Tempo de treino corrido até `agora` (ms), descontando as pausas (e a pausa atual). */
export function tempoDeTreinoMs(s: Pick<SessaoEmAndamento, 'inicio' | 'pausaMs' | 'pausadoEm'>, agora: number): number {
  const fimDaConta = s.pausadoEm ? Date.parse(s.pausadoEm) : agora;
  return Math.max(0, fimDaConta - Date.parse(s.inicio) - (s.pausaMs ?? 0));
}

/**
 * kcal da sessão: o tempo todo como musculação, trocando os minutos de cardio
 * (se houver) pelo MET do cardio. Arredondado.
 */
export function kcalDaSessao(
  sessao: Pick<SessaoEmAndamento, 'inicio' | 'cardioMinutos' | 'pausaMs'>,
  fim: string,
  pesoKg: number,
  cardio?: Cardio,
): number {
  const total = minutosDaSessao(sessao.inicio, fim, sessao.pausaMs);
  const minCardio = cardio ? Math.min(total, sessao.cardioMinutos ?? 0) : 0;
  const metCardio = cardio ? MET_CARDIO[cardio.atividade][cardio.intensidade] : MET_MUSCULACAO;
  return Math.round(kcalAtividade(MET_MUSCULACAO, pesoKg, total - minCardio) + kcalAtividade(metCardio, pesoKg, minCardio));
}
