@AGENTS.md

## Regras do TapCal

- Uma fase por vez. Não adiantar trabalho de fases futuras.
- Design antes de código: nenhuma tela nova sem mockup em `design-reference/`.
- Lógica antes de tela: dados e cálculos primeiro, telas depois.
- Cores, fontes e medidas vêm sempre de `src/theme/theme.ts`; nada de cor solta.
- Use os componentes de `src/components/ui` (Glass, Button, Text, Screen) em vez de recriar estilos.
- Tudo precisa rodar no Expo Go até a fase 4 — não adicionar libs com código nativo fora do Expo Go.
- Textos do app em português do Brasil.
- Antes de concluir: `npm run lint` e `npm run typecheck`.
