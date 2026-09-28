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
    em-breve.tsx          página dos atalhos que ainda não existem
  components/
    ui/                   Glass, TopGlow, Button, Text, Screen, Sheet, Toast…
    navigation/           FloatingTabBar (barra inferior flutuante)
    home/                 medidor, semana, água, treino e peso da Início
    nutrition/            anel, macros e cartão de refeição
    workout/              divisão da semana e linha de exercício
  theme/theme.ts          cores, fontes, espaçamentos, raios, tipografia
  types/                  tipos do domínio (perfil, refeição, alimento, treino, série, peso)
  lib/goals.ts            motor de metas: IMC, TMB, gasto, calorias, macros, água, previsão
  lib/                    datas, virada do dia, totais, treino, progresso, formatação
  store/                  store local (zustand + AsyncStorage) e seletores
  data/sample.ts          dados de exemplo para o app abrir preenchido
design-reference/         mockups aprovados (design antes de código)
```

## Supabase

Projeto `tapcal` (ref `ubtphbznnmfsvtgmrfzr`, região São Paulo). Vazio por
enquanto: tabelas e login entram na fase 5; a função do scanner, na fase 4.

## Comandos

```bash
npm run lint        # ESLint (config do Expo)
npm run typecheck   # TypeScript
npm test            # testes (metas, datas, store, treino, progresso, formatação)
```

## Fases

O plano completo está no roteiro do projeto. Status atual: **Fase 3 — telas principais com dados locais**.
