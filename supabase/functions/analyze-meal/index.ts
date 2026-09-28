/**
 * analyze-meal — recebe a foto de um prato e devolve os alimentos, a porção
 * estimada em gramas e os valores por 100 g, em JSON estruturado (Gemini).
 *
 * Segredos (Supabase → Edge Functions → Secrets):
 *   GEMINI_API_KEY   chave da API do Gemini (obrigatória; também aceita GOOGLE_API_KEY, GEMINI_KEY…)
 *   GEMINI_MODEL     modelo a tentar primeiro (opcional; depois vêm os de MODELS)
 *
 * Acesso: por enquanto qualquer chamada com a chave publicável do projeto no
 * cabeçalho `apikey` (o app ainda não tem login). Na fase 5 passa a exigir
 * usuário logado. Publicada com verify_jwt = false porque a verificação
 * embutida não entende as chaves novas (sb_publishable_…); a checagem é feita
 * aqui no código.
 *
 * Respostas:
 *   200 { dish, confidence, items: [{ name, grams, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g }] }
 *   400 imagem_invalida · 401 nao_autorizado · 413 imagem_grande
 *   422 nao_reconhecido · 502 falha_ia · 503 sem_chave
 */

/**
 * Modelos tentados em ordem. O Google aposenta modelos com frequência (o
 * gemini-2.5-flash passou a dar 404 para contas novas); se um sumir, a função
 * passa para o próximo em vez de falhar.
 */
const MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];
const MAX_BASE64 = 4_000_000; // ~3 MB de imagem
const TIMEOUT_MS = 25_000; // por chamada ao Gemini
const TOTAL_MS = 40_000; // prazo total, somando as tentativas
/** Respostas do Gemini que valem tentar de novo (sobrecarga, limite, erro interno). */
const RETRYABLE = new Set([429, 500, 503]);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/** Chaves aceitas: as publicáveis do projeto (e a anon antiga, enquanto existir). */
function allowedKeys(): string[] {
  const keys: string[] = [];
  try {
    const pub = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}') as Record<string, string>;
    keys.push(...Object.values(pub));
  } catch {
    // variável ausente ou malformada: segue só com a anon
  }
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (anon) keys.push(anon);
  return keys.filter(Boolean);
}

/** Nomes que aceitamos para a chave do Gemini, em ordem de preferência. */
const GEMINI_KEY_NAMES = ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_AI_API_KEY'];

/** "Gemini API Key", "gemini-api-key" e "GEMINI_API_KEY" viram o mesmo nome. */
function normalizeName(name: string): string {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

/** Procura a chave do Gemini pelos nomes comuns, sem diferenciar maiúsculas, espaços ou hífens. */
function geminiApiKey(): string | undefined {
  const env = Deno.env.toObject();
  const byName = new Map(Object.entries(env).map(([k, v]) => [normalizeName(k), v]));
  for (const name of GEMINI_KEY_NAMES) {
    const value = byName.get(name)?.trim();
    if (value) return value;
  }
  return undefined;
}

const PROMPT = `Você é nutricionista brasileira. Analise a foto de uma refeição.

1. Diga se a foto mostra comida (is_food).
2. Liste cada alimento visível separadamente (ex.: arroz, feijão, bife, salada), com nome curto em português do Brasil, do jeito que se fala no Brasil.
3. Estime a porção de cada um em gramas, pelo tamanho no prato (um prato raso tem ~25 cm; uma colher de servir de arroz tem ~45 g).
4. Para cada alimento, dê kcal, proteína, carboidrato e gordura POR 100 g, usando a Tabela Brasileira de Composição de Alimentos (TACO) sempre que o alimento existir nela, no preparo que aparece na foto (cozido, grelhado, frito).
5. Dê um nome curto para o prato (ex.: "Arroz, feijão e frango grelhado") e a sua confiança geral de 0 a 1.

Se não for comida, devolva is_food = false e items vazio. Não invente alimentos que não aparecem.`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    is_food: { type: 'BOOLEAN' },
    dish: { type: 'STRING' },
    confidence: { type: 'NUMBER' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          grams: { type: 'NUMBER' },
          kcal_per_100g: { type: 'NUMBER' },
          protein_per_100g: { type: 'NUMBER' },
          carbs_per_100g: { type: 'NUMBER' },
          fat_per_100g: { type: 'NUMBER' },
        },
        required: ['name', 'grams', 'kcal_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g'],
      },
    },
  },
  required: ['is_food', 'dish', 'confidence', 'items'],
};

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'metodo_invalido' });

  const apikey = req.headers.get('apikey') ?? '';
  if (!apikey || !allowedKeys().includes(apikey)) return json(401, { error: 'nao_autorizado' });

  const geminiKey = geminiApiKey();
  if (!geminiKey) {
    // Só os NOMES dos segredos, nunca os valores — para descobrir se a chave foi salva com outro nome.
    console.error('sem_chave', Object.keys(Deno.env.toObject()).sort().join(', '));
    return json(503, { error: 'sem_chave' });
  }

  let image = '';
  let mimeType = 'image/jpeg';
  try {
    const body = (await req.json()) as { image?: unknown; mimeType?: unknown };
    image = typeof body.image === 'string' ? body.image.replace(/^data:[^;]+;base64,/, '') : '';
    if (typeof body.mimeType === 'string' && /^image\/(jpeg|png|webp|heic)$/.test(body.mimeType)) mimeType = body.mimeType;
  } catch {
    return json(400, { error: 'imagem_invalida' });
  }
  if (!image || !/^[A-Za-z0-9+/=\s]+$/.test(image.slice(0, 200))) return json(400, { error: 'imagem_invalida' });
  if (image.length > MAX_BASE64) return json(413, { error: 'imagem_grande' });

  const preferred = Deno.env.get('GEMINI_MODEL')?.trim();
  const models = [...new Set([preferred, ...MODELS].filter((m): m is string => !!m))];
  // GEMINI_API_BASE só existe para testes locais com um servidor simulado.
  const base = Deno.env.get('GEMINI_API_BASE') || 'https://generativelanguage.googleapis.com';
  const payload = JSON.stringify({
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: image } }, { text: PROMPT }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  // Tenta cada modelo; se o Google disser que está sobrecarregado (503/429/500),
  // espera um pouco e tenta de novo, depois passa para o próximo modelo.
  // 404 = modelo aposentado: pula direto. Tudo dentro de um prazo total.
  const deadline = Date.now() + TOTAL_MS;
  let res: Response | null = null;
  let lastStatus = 0;
  outer: for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const left = deadline - Date.now();
      if (left < 3_000) break outer;
      try {
        res = await fetch(`${base}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          signal: AbortSignal.timeout(Math.min(TIMEOUT_MS, left)),
          body: payload,
        });
      } catch (e) {
        console.error('gemini_fetch', model, e);
        res = null;
        continue outer;
      }
      if (res.ok) break outer;
      lastStatus = res.status;
      console.error('gemini_status', model, res.status, (await res.text()).slice(0, 300));
      if (res.status === 404) continue outer;
      if (!RETRYABLE.has(res.status)) break outer;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 900));
    }
  }

  if (!res || !res.ok) {
    return json(502, { error: 'falha_ia', status: lastStatus });
  }

  let parsed: { is_food?: boolean; dish?: string; confidence?: number; items?: unknown[] };
  try {
    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    parsed = JSON.parse(text);
  } catch (e) {
    console.error('gemini_parse', e);
    return json(502, { error: 'falha_ia' });
  }

  if (!parsed.is_food || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    return json(422, { error: 'nao_reconhecido' });
  }

  return json(200, { dish: parsed.dish, confidence: parsed.confidence, items: parsed.items });
});
