import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { analyzeMeal, interpretResponse, isConfigured } from '@/lib/scanClient';

const okBody = {
  dish: 'Arroz e feijão',
  confidence: 0.8,
  items: [{ name: 'Arroz branco', grams: 120, kcal_per_100g: 128, protein_per_100g: 2.5, carbs_per_100g: 28.1, fat_per_100g: 0.2 }],
};

describe('resposta da função analyze-meal', () => {
  it('200 vira resultado da IA', () => {
    const r = interpretResponse(200, okBody);
    expect(r.kind).toBe('ok');
    expect(r.kind === 'ok' && r.example).toBe(false);
    expect(r.kind === 'ok' && r.result.items[0].name).toBe('Arroz branco');
  });

  it('sem chave do Gemini cai no modo exemplo', () => {
    const r = interpretResponse(503, { error: 'sem_chave' });
    expect(r).toMatchObject({ kind: 'ok', example: true, reason: 'sem_chave' });
  });

  it('erros viram mensagens em português', () => {
    expect(interpretResponse(422, { error: 'nao_reconhecido' })).toMatchObject({ kind: 'error', canRetry: true });
    expect(interpretResponse(401, { error: 'nao_autorizado' })).toMatchObject({ kind: 'error', canRetry: false });
    expect(interpretResponse(502, { error: 'falha_ia' })).toMatchObject({ kind: 'error', canRetry: true });
    expect(interpretResponse(200, { items: [] })).toMatchObject({ kind: 'error' });
  });
});

describe('chamada', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    jest.useRealTimers();
  });

  it('sem Supabase configurado, usa o exemplo', async () => {
    expect(isConfigured({})).toBe(false);
    jest.useFakeTimers();
    const p = analyzeMeal('abc', {});
    await jest.advanceTimersByTimeAsync(2000);
    await expect(p).resolves.toMatchObject({ kind: 'ok', example: true, reason: 'sem_supabase' });
  });

  it('envia a foto com a chave no cabeçalho apikey', async () => {
    const fetchMock = jest.fn(async () => new Response(JSON.stringify(okBody), { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const r = await analyzeMeal('BASE64', { url: 'https://x.supabase.co', key: 'sb_publishable_K' });
    expect(r.kind).toBe('ok');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://x.supabase.co/functions/v1/analyze-meal');
    expect((init.headers as Record<string, string>).apikey).toBe('sb_publishable_K');
    expect(JSON.parse(init.body as string)).toEqual({ image: 'BASE64', mimeType: 'image/jpeg' });
  });

  it('sem internet vira erro amigável', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    const r = await analyzeMeal('x', { url: 'https://x.supabase.co', key: 'k' });
    expect(r).toMatchObject({ kind: 'error', canRetry: true });
  });
});
