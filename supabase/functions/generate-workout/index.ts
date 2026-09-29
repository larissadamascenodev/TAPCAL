/**
 * generate-workout — escolhe os exercícios do treino com IA (SPEC-TREINOS, 5.3).
 *
 * As regras do app (divisão, volume, séries, repetições e descanso) já vêm
 * decididas no esqueleto; a IA só escolhe, para cada sessão, exercícios da
 * lista de candidatos (por id), dá um nome curto a cada sessão e escreve uma
 * explicação de 2 a 4 frases. A função confere a resposta; o app confere de
 * novo e, se algo vier errado, escolhe sozinho pelas regras.
 *
 * Segredos: GEMINI_API_KEY (ou os nomes aceitos em analyze-meal) e GEMINI_MODEL (opcional).
 * Acesso: chave publicável do projeto no cabeçalho `apikey` (sem login ainda).
 *
 * Corpo: {
 *   contexto: { nivel, objetivo, foco: string[], lesoes: string[], dias: number },
 *   sessoes: [{ nome, vagas: [{ musculo, series }], candidatos: [{ id, nome, musculo, tipo, equipamentos }] }],
 *   evitar?: string[]   // ids do plano anterior ("Gerar outro")
 * }
 * Respostas:
 *   200 { sessoes: [{ nome, ids, valida }], explicacao }
 *   400 pedido_invalido · 401 nao_autorizado · 502 falha_ia · 503 sem_chave
 */

const MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];
const TIMEOUT_MS = 25_000;
const TOTAL_MS = 50_000;
const RETRYABLE = new Set([429, 500, 503]);
const MAX_SESSOES = 7;
const MAX_CANDIDATOS = 80;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });
}

function allowedKeys(): string[] {
  const keys: string[] = [];
  try {
    keys.push(...Object.values(JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}') as Record<string, string>));
  } catch {
    // sem a variável: segue só com a anon
  }
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (anon) keys.push(anon);
  return keys.filter(Boolean);
}

const GEMINI_KEY_NAMES = ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_AI_API_KEY'];
const normalizeName = (n: string) => n.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');

function geminiApiKey(): string | undefined {
  const byName = new Map(Object.entries(Deno.env.toObject()).map(([k, v]) => [normalizeName(k), v]));
  for (const name of GEMINI_KEY_NAMES) {
    const v = byName.get(name)?.trim();
    if (v) return v;
  }
  return undefined;
}

let modelCache: { at: number; names: string[] } | null = null;
const SKIP_MODEL = /(tts|audio|image|live|embedding|aqa|computer|robotics|native)/;

async function modelOrder(base: string, key: string, preferred: string[]): Promise<string[]> {
  if (!modelCache || Date.now() - modelCache.at > 10 * 60_000) {
    try {
      const res = await fetch(`${base}/v1beta/models?pageSize=200`, { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(4_000) });
      if (res.ok) {
        const data = (await res.json()) as { models?: { name?: string; supportedGenerationMethods?: string[] }[] };
        const names = (data.models ?? [])
          .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m) => (m.name ?? '').replace(/^models\//, ''))
          .filter((n) => n.includes('flash') && !SKIP_MODEL.test(n));
        modelCache = { at: Date.now(), names };
      }
    } catch (e) {
      console.error('modelos_fetch', e);
    }
  }
  const available = modelCache?.names ?? [];
  const byNewest = [...available].sort((a, b) => b.localeCompare(a, 'en', { numeric: true }));
  return [...new Set([...preferred.filter((m) => !available.length || available.includes(m)), ...byNewest])];
}

type Candidato = { id: string; nome: string; musculo: string; tipo: string; equipamentos: string[] };
type Sessao = { nome: string; vagas: { musculo: string; series: number }[]; candidatos: Candidato[] };
type Pedido = {
  contexto: { nivel: string; objetivo: string; foco: string[]; lesoes: string[]; dias: number };
  sessoes: Sessao[];
  evitar: string[];
};

const str = (v: unknown, max = 60) => (typeof v === 'string' ? v.slice(0, max) : '');
const strs = (v: unknown, max = 20) => (Array.isArray(v) ? v.slice(0, max).map((x) => str(x)).filter(Boolean) : []);

/** Lê e limita o pedido (nada de confiar no tamanho do que chega). */
function lerPedido(body: unknown): Pedido | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const c = (b.contexto ?? {}) as Record<string, unknown>;
  if (!Array.isArray(b.sessoes) || !b.sessoes.length || b.sessoes.length > MAX_SESSOES) return null;
  const sessoes: Sessao[] = [];
  for (const s of b.sessoes as Record<string, unknown>[]) {
    if (!Array.isArray(s?.vagas) || !Array.isArray(s?.candidatos)) return null;
    const vagas = (s.vagas as Record<string, unknown>[]).slice(0, 12).map((v) => ({ musculo: str(v?.musculo), series: Number(v?.series) || 3 }));
    const candidatos = (s.candidatos as Record<string, unknown>[]).slice(0, MAX_CANDIDATOS).map((x) => ({
      id: str(x?.id, 80),
      nome: str(x?.nome, 80),
      musculo: str(x?.musculo),
      tipo: str(x?.tipo),
      equipamentos: strs(x?.equipamentos, 6),
    }));
    if (!vagas.length || !candidatos.length) return null;
    sessoes.push({ nome: str(s.nome, 40), vagas, candidatos });
  }
  return {
    contexto: { nivel: str(c.nivel), objetivo: str(c.objetivo), foco: strs(c.foco), lesoes: strs(c.lesoes), dias: Number(c.dias) || sessoes.length },
    sessoes,
    evitar: strs(b.evitar, 120),
  };
}

/** Todo id nos candidatos da sessão, sem repetir, e os músculos batendo com as vagas. */
function valida(s: Sessao, ids: unknown): boolean {
  if (!Array.isArray(ids) || ids.length !== s.vagas.length || new Set(ids).size !== ids.length) return false;
  const porId = new Map(s.candidatos.map((c) => [c.id, c]));
  if (!ids.every((id) => typeof id === 'string' && porId.has(id))) return false;
  const conta = (l: string[]) => [...l].sort().join('|');
  return conta(ids.map((id) => porId.get(id as string)!.musculo)) === conta(s.vagas.map((v) => v.musculo));
}

function montarPrompt(p: Pedido): string {
  const c = p.contexto;
  const sessoes = p.sessoes
    .map((s, i) => {
      const vagas = s.vagas.map((v) => v.musculo).join(', ');
      const cand = s.candidatos.map((x) => `  - ${x.id} | ${x.nome} | ${x.musculo} | ${x.tipo} | ${x.equipamentos.join('+')}`).join('\n');
      return `Sessão ${i + 1} ("${s.nome}"): escolha ${s.vagas.length} exercícios, um para cada vaga, com estes músculos principais: ${vagas}.\nCandidatos (id | nome | músculo | tipo | equipamento):\n${cand}`;
    })
    .join('\n\n');
  return `Você é personal trainer brasileira e está montando um treino de musculação. A estrutura (dias, músculos, séries e repetições) já foi decidida por regras científicas; você só escolhe os exercícios.

Pessoa: nível ${c.nivel}; objetivo ${c.objetivo}; ${c.dias} dias por semana; foco: ${c.foco.join(', ') || 'nenhum'}; lesões ou dores: ${c.lesoes.join(', ') || 'nenhuma'}.

Regras:
- Escolha SÓ entre os candidatos de cada sessão, pelo id exato.
- Cada vaga é um músculo principal: a quantidade de exercícios de cada músculo precisa ser exatamente a das vagas.
- Não repita exercício na mesma sessão. Varie entre sessões que treinam o mesmo músculo.
- Compostos antes de isolados; músculos de foco primeiro.
- Prefira exercícios seguros e fáceis de aprender para iniciantes.
${p.evitar.length ? `- A pessoa pediu outra opção: evite estes ids quando houver alternativa: ${p.evitar.join(', ')}.\n` : ''}
Dê a cada sessão um nome curto em português do Brasil (ex.: "Pernas e glúteos", "Peito, ombros e tríceps"), no máximo 30 caracteres.
Escreva uma explicação de 2 a 4 frases, em português do Brasil, amigável, dizendo por que o treino foi montado assim. Não prometa resultados nem prazos.

${sessoes}`;
}

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    sessoes: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { nome: { type: 'STRING' }, ids: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['nome', 'ids'] },
    },
    explicacao: { type: 'STRING' },
  },
  required: ['sessoes', 'explicacao'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'metodo_invalido' });
  const apikey = req.headers.get('apikey') ?? '';
  if (!apikey || !allowedKeys().includes(apikey)) return json(401, { error: 'nao_autorizado' });
  const geminiKey = geminiApiKey();
  if (!geminiKey) return json(503, { error: 'sem_chave' });

  let pedido: Pedido | null = null;
  try {
    pedido = lerPedido(await req.json());
  } catch {
    pedido = null;
  }
  if (!pedido) return json(400, { error: 'pedido_invalido' });

  const base = Deno.env.get('GEMINI_API_BASE') || 'https://generativelanguage.googleapis.com';
  const models = await modelOrder(base, geminiKey, [Deno.env.get('GEMINI_MODEL')?.trim(), ...MODELS].filter((m): m is string => !!m));
  const payload = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: montarPrompt(pedido) }] }],
    generationConfig: { temperature: pedido.evitar.length ? 0.8 : 0.4, responseMimeType: 'application/json', responseSchema: SCHEMA },
  });

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
      if (model !== models[0]) continue outer;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 900));
    }
  }
  if (!res || !res.ok) return json(502, { error: 'falha_ia', status: lastStatus });

  let parsed: { sessoes?: { nome?: unknown; ids?: unknown }[]; explicacao?: unknown };
  try {
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '');
  } catch (e) {
    console.error('gemini_parse', e);
    return json(502, { error: 'falha_ia' });
  }

  const sessoes = pedido.sessoes.map((s, i) => {
    const r = parsed.sessoes?.[i];
    const ok = valida(s, r?.ids);
    if (!ok) console.error('sessao_invalida', i);
    return { nome: str(r?.nome, 40), ids: ok ? r!.ids : null, valida: ok };
  });
  return json(200, { sessoes, explicacao: str(parsed.explicacao, 600) });
});
