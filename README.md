# TapCal

App all-in-one de alimentação, treino e caneta GLP-1. iOS primeiro, feito com
Expo + Expo Router + TypeScript.

## Rodar no iPhone (Expo Go)

```bash
npm install
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
  components/
    ui/                   Glass, TopGlow, Button, Text, Screen, EmptyState
    navigation/           FloatingTabBar (barra inferior flutuante)
  theme/theme.ts          cores, fontes, espaçamentos, raios, tipografia
design-reference/         mockups aprovados (design antes de código)
```

## Comandos

```bash
npm run lint        # ESLint (config do Expo)
npm run typecheck   # TypeScript
```

## Fases

O plano completo está no roteiro do projeto. Status atual: **Fase 1 — fundação**.
