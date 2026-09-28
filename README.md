# TapCal

App all-in-one de alimentação, treino e caneta GLP-1. iOS primeiro, feito com
Expo + Expo Router + TypeScript.

## Rodar no iPhone (Expo Go)

```bash
npm install
cp .env.example .env.local
npx expo start
```

Abra a câmera do iPhone, aponte para o QR code e o app abre no Expo Go.

## Estrutura

```
src/
  app/                    rotas (cada arquivo é uma tela)
    _layout.tsx           fontes, tema escuro, pilha raiz
    (tabs)/               abas: Início, Alimentação, Treino
    adicionar.tsx         aberto pelo botão + da barra
    alimento.tsx          adicionar alimento à mão
    peso.tsx              registrar peso do dia
    treino-sessao.tsx     treino em andamento (cronômetro, séries, descanso)
    scanner.tsx           câmera → análise → resultado com porções → salvar
    busca.tsx             busca na tabela TACO com porção em gramas
    em-breve.tsx          página dos atalhos que ainda não existem
  components/
    ui/                   Glass, TopGlow, Button, Text, Screen, Sheet, Toast…
    navigation/           FloatingTabBar (barra inferior flutuante)
    home/                 medidor, semana, água, treino e peso da Início
    nutrition/            anel, macros e cartão de refeição
    workout/              divisão da semana e linha de exercício
    scanner/              moldura e linha de varredura da câmera
  theme/theme.ts          cores, fontes, espaçamentos, raios, tipografia
  types/                  tipos do domínio (perfil, refeição, alimento, treino, série, peso)
  lib/goals.ts            motor de metas: IMC, TMB, gasto, calorias, macros, água, previsão
  lib/                    datas, virada do dia, totais, treino, progresso, formatação
  store/                  store local (zustand + AsyncStorage) e seletores
  data/sample.ts          dados de exemplo para o app abrir preenchido
  data/taco.json          tabela TACO (gerada por scripts/build-taco.mjs)
supabase/functions/       Edge Functions (analyze-meal)
design-reference/         mockups aprovados (design antes de código)
```

## Supabase

Projeto `tapcal` (ref `ubtphbznnmfsvtgmrfzr`, região São Paulo). Tabelas e login
entram na fase 5.

### Scanner (Edge Function `analyze-meal`)

Código em `supabase/functions/analyze-meal/index.ts`, já publicado. Para ligar a IA:

1. Crie uma chave em https://aistudio.google.com/apikey (e, se quiser, um limite de gastos).
2. No Supabase: **Edge Functions → Secrets** → adicione `GEMINI_API_KEY` com a chave.
3. Opcional: `GEMINI_MODEL` para trocar o modelo (padrão `gemini-2.5-flash`).

Sem a chave (ou sem o `.env.local`), o scanner funciona em **modo exemplo**, com um
prato fixo, para testar o fluxo. Para publicar de novo depois de mudar o código:
`npx supabase functions deploy analyze-meal --project-ref ubtphbznnmfsvtgmrfzr`.

Teste com pratos reais: `docs/teste-scanner.md`.

## Comandos

```bash
npm run lint        # ESLint (config do Expo)
npm run typecheck   # TypeScript
npm test            # testes (metas, datas, store, treino, progresso, scanner, TACO)
```

## Fases

O plano completo está no roteiro do projeto. Status atual: **Fase 4 — scanner com Gemini e busca de alimentos**.

## Créditos

Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição, NEPA/UNICAMP.
CSVs extraídos pelo projeto [taco-api](https://github.com/raulfdm/taco-api) (MIT).
