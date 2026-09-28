/**
 * Chamada à Edge Function `analyze-meal`, com modo exemplo quando o Supabase
 * ou a chave do Gemini ainda não estão configurados.
 */

import { normalizeScan, sampleScan, type ScanResult } from '@/lib/scan';

export type ScanOutcome =
  | { kind: 'ok'; result: ScanResult; example: false }
  | { kind: 'ok'; result: ScanResult; example: true; reason: 'sem_supabase' | 'sem_chave' }
  | { kind: 'error'; message: string; canRetry: boolean }
  | { kind: 'cancelled' };

export type ScanConfig = { url?: string; key?: string };

/**
 * Projeto Supabase "tapcal". A chave publicável foi feita para ir dentro do app
 * (não dá acesso a nada sozinha); a chave do Gemini fica nos segredos do
 * Supabase e nunca aparece aqui. O .env.local, se existir, tem prioridade.
 */
export const SUPABASE_URL = 'https://ubtphbznnmfsvtgmrfzr.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_B19soTeqiE2FFUrBcJoxFw_oMyDfolR';

export function scanConfig(): ScanConfig {
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || SUPABASE_URL,
    key: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY,
  };
}

export function isConfigured(cfg: ScanConfig = scanConfig()): boolean {
  return !!cfg.url && !!cfg.key;
}

/** Traduz a resposta da função no que a tela mostra. */
export function interpretResponse(status: number, body: unknown): ScanOutcome {
  const error = body && typeof body === 'object' ? (body as { error?: string }).error : undefined;

  if (status === 200) {
    const result = normalizeScan(body);
    return result
      ? { kind: 'ok', result, example: false }
      : { kind: 'error', message: 'Não consegui reconhecer os alimentos. Tente outra foto.', canRetry: true };
  }
  if (status === 503 && error === 'sem_chave') {
    return { kind: 'ok', result: sampleScan(), example: true, reason: 'sem_chave' };
  }
  if (status === 422) {
    return { kind: 'error', message: 'Não encontrei comida nessa foto. Tente enquadrar só o prato.', canRetry: true };
  }
  if (status === 413) {
    return { kind: 'error', message: 'A foto ficou grande demais. Tente de novo.', canRetry: true };
  }
  if (status === 401) {
    return { kind: 'error', message: 'O app não está autorizado a usar o scanner. Confira a chave do Supabase.', canRetry: false };
  }
  const aiStatus = body && typeof body === 'object' ? (body as { status?: number }).status : undefined;
  if (status === 502 && (aiStatus === 503 || aiStatus === 429)) {
    return { kind: 'error', message: 'A IA está sobrecarregada agora. Tente de novo em alguns segundos.', canRetry: true };
  }
  return { kind: 'error', message: 'A análise falhou agora. Tente de novo em instantes.', canRetry: true };
}

/** Envia a foto (JPEG em base64) e devolve o resultado para a tela. `signal` permite cancelar. */
export async function analyzeMeal(base64: string, cfg: ScanConfig = scanConfig(), signal?: AbortSignal): Promise<ScanOutcome> {
  if (!isConfigured(cfg)) {
    // Simula o tempo da análise para a animação aparecer.
    await new Promise((r) => setTimeout(r, 1600));
    return { kind: 'ok', result: sampleScan(), example: true, reason: 'sem_supabase' };
  }

  const controller = new AbortController();
  // A função pode tentar mais de um modelo quando o Gemini está cheio: dá tempo a ela.
  const timer = setTimeout(() => controller.abort(), 50_000);
  const onCancel = () => controller.abort();
  signal?.addEventListener('abort', onCancel);
  try {
    const res = await fetch(`${cfg.url}/functions/v1/analyze-meal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.key as string },
      body: JSON.stringify({ image: base64, mimeType: 'image/jpeg' }),
      signal: controller.signal,
    });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // corpo vazio ou não-JSON: fica null
    }
    return interpretResponse(res.status, body);
  } catch {
    if (signal?.aborted) return { kind: 'cancelled' };
    return { kind: 'error', message: 'Sem conexão com a internet. Confira e tente de novo.', canRetry: true };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCancel);
  }
}
