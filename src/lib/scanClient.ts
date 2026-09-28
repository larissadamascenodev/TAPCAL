/**
 * Chamada à Edge Function `analyze-meal`, com modo exemplo quando o Supabase
 * ou a chave do Gemini ainda não estão configurados.
 */

import { normalizeScan, sampleScan, type ScanResult } from '@/lib/scan';

export type ScanOutcome =
  | { kind: 'ok'; result: ScanResult; example: false }
  | { kind: 'ok'; result: ScanResult; example: true; reason: 'sem_supabase' | 'sem_chave' }
  | { kind: 'error'; message: string; canRetry: boolean };

export type ScanConfig = { url?: string; key?: string };

export function scanConfig(): ScanConfig {
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    key: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
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
  return { kind: 'error', message: 'A análise falhou agora. Tente de novo em instantes.', canRetry: true };
}

/** Envia a foto (JPEG em base64) e devolve o resultado para a tela. */
export async function analyzeMeal(base64: string, cfg: ScanConfig = scanConfig()): Promise<ScanOutcome> {
  if (!isConfigured(cfg)) {
    // Simula o tempo da análise para a animação aparecer.
    await new Promise((r) => setTimeout(r, 1600));
    return { kind: 'ok', result: sampleScan(), example: true, reason: 'sem_supabase' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35_000);
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
    return { kind: 'error', message: 'Sem conexão com a internet. Confira e tente de novo.', canRetry: true };
  } finally {
    clearTimeout(timer);
  }
}
