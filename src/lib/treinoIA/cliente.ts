/**
 * Chamada à Edge Function `generate-workout` (SPEC-TREINOS, 5.3). A pessoa
 * nunca fica sem treino: se a IA falhar, demorar ou responder errado, o app
 * escolhe os exercícios sozinho pelas regras. Sem Supabase configurado, é o
 * modo exemplo (etiqueta "Exemplo").
 */

import { isConfigured, scanConfig, type ScanConfig } from '@/lib/scanClient';
import type { DateKey, Goal } from '@/types';
import type { RespostasTreinoIA } from '@/types/treino';

import { montarEsqueleto, type Esqueleto } from './esqueleto';
import { montarPlano, type EscolhaIA, type Resultado } from './plano';

export type Fonte = 'ia' | 'regras' | 'exemplo';
export type Geracao = Resultado & { fonte: Fonte; esqueleto: Esqueleto };

export type PedidoTreino = {
  respostas: RespostasTreinoIA;
  objetivo: Goal;
  hoje: DateKey;
  /** Ids do plano anterior, para "Gerar outro". */
  evitar?: string[];
  /** Número da fase (próxima fase = anterior + 1). */
  bloco?: number;
};

/** Corpo enviado à função: o esqueleto das regras e os candidatos de cada sessão. */
export function corpoDoPedido(esq: Esqueleto, p: PedidoTreino): object {
  return {
    contexto: {
      nivel: p.respostas.experiencia,
      objetivo: p.objetivo,
      foco: p.respostas.foco,
      lesoes: p.respostas.lesoes,
      dias: esq.sessoes.length,
    },
    sessoes: esq.sessoes.map((s) => ({
      nome: s.nome,
      vagas: s.vagas,
      candidatos: Object.values(s.candidatos)
        .flat()
        .map((e) => e && { id: e.id, nome: e.nome, musculo: e.musculoPrincipal, tipo: e.tipo, equipamentos: e.equipamentos }),
    })),
    evitar: p.evitar ?? [],
  };
}

/** Resposta da função → escolha da IA (ou null, e aí valem as regras). */
export function escolhaDaResposta(status: number, body: unknown): EscolhaIA | null | 'sem_chave' {
  if (status === 503 && (body as { error?: string } | null)?.error === 'sem_chave') return 'sem_chave';
  if (status !== 200 || !body || typeof body !== 'object') return null;
  const b = body as { sessoes?: unknown; explicacao?: unknown };
  if (!Array.isArray(b.sessoes)) return null;
  return { sessoes: b.sessoes.map((s) => ({ nome: s?.nome, ids: s?.ids })), explicacao: b.explicacao };
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Gera o plano. Nunca falha: no pior caso, as regras escolhem tudo. */
export async function gerarTreino(p: PedidoTreino, cfg: ScanConfig = scanConfig(), signal?: AbortSignal): Promise<Geracao> {
  const esqueleto = montarEsqueleto(p.respostas);
  const opcoes = p.evitar?.length ? { semente: (Date.now() % 100_000) + 1, evitar: new Set(p.evitar) } : undefined;
  const plano = (ia: EscolhaIA | null) => montarPlano({ respostas: p.respostas, objetivo: p.objetivo, esqueleto, hoje: p.hoje, ia, opcoes, bloco: p.bloco });

  if (!isConfigured(cfg)) {
    await espera(1600); // tempo para a animação de "montando"
    return { ...plano(null), fonte: 'exemplo', esqueleto };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  const cancelar = () => controller.abort();
  signal?.addEventListener('abort', cancelar);
  try {
    const res = await fetch(`${cfg.url}/functions/v1/generate-workout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.key as string },
      body: JSON.stringify(corpoDoPedido(esqueleto, p)),
      signal: controller.signal,
    });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // corpo vazio: vale como falha
    }
    const escolha = escolhaDaResposta(res.status, body);
    if (escolha === 'sem_chave') return { ...plano(null), fonte: 'exemplo', esqueleto };
    const r = plano(escolha);
    return { ...r, fonte: r.sessoesDaIA > 0 ? 'ia' : 'regras', esqueleto };
  } catch {
    return { ...plano(null), fonte: 'regras', esqueleto };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancelar);
  }
}
