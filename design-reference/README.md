# design-reference

Mockups aprovados do TapCal. **Nenhuma tela é construída sem o mockup dela aqui.**

| Arquivo | Telas | Fase |
| --- | --- | --- |
| `inicio-v2.html` / `.png` | **Início atual**: verde neon, vidro líquido e o Tapi (mascote) | redesenho |
| `inicio.html` / `.png` | Início original (substituída pela v2; vale para as outras telas) | 3 |
| `alimentacao.html` / `.png` | Diário de Alimentação e resultado da foto (scanner) | 3 e 4 |
| `treino.html` / `.png` | Plano da semana e treino em andamento | 3 |

Os `.html` são os mockups interativos originais (abra no navegador); os `.png`
são capturas para consulta rápida. Origem: artifacts "TapCal Dashboard",
"TapCal Alimentação" e "TapCal Treino".

As cores, fontes e medidas dos mockups vivem em `src/theme/theme.ts`. Se um mockup
mudar uma cor, muda lá, em um lugar só. Desde a Início v2, o acento do app todo é o
verde neon `#D1FB39` (antes laranja), o fundo é quase preto e sem luzes coloridas,
e a barra de baixo e o botão + são de vidro. Os mockups antigos continuam valendo
para layout, com as cores novas.

## Diferenças conscientes em relação aos mockups

- **"Queimadas" virou "Déficit"** (ou "Superávit"): a meta do motor de metas já
  inclui o treino pelo nível de atividade; somar calorias queimadas contaria o
  treino duas vezes.
- **Pílula "Pro" e "Seus módulos" (jejum, caneta) ficaram de fora**: são das
  fases 7 e 8 e da versão 1.1.
- **Ilustração do corpo e "Ver execução" no treino**: trocadas por um cartão com
  última vez, recorde e meta, até existirem vídeos dos exercícios.
- **Adicionar alimento à mão e busca TACO** não têm mockup próprio: seguem o padrão
  da folha "Resultado da foto" (vidro, pílulas de refeição, Corrigir/Salvar).
- **Câmera e análise** seguem a foto do mockup "Resultado da foto" (cantos
  brancos e linha dourada de varredura). As etiquetas dos alimentos ficam em fila
  sobre a foto, porque a IA não devolve a posição de cada alimento.

## Início v2

- **Tapi, o mascote**: robô desenhado em vetor (`src/components/mascot`), animado
  com as animações CSS do Reanimated. O humor vem de `src/lib/mascot.ts`:
  preocupado (passou da meta) > comemorando (proteína batida ou dia fechado) >
  acenando ou pensando (nada registrado / comeu pouco depois das 15h) >
  apaixonado (7 dias seguidos ou água batida) > feliz.
- **Toque duas vezes no "Total de hoje"** abre o scanner (antes era o cartão
  "Toque duas vezes para registrar", que saiu).
- **Faixa da semana saiu da Início**, como no mockup v2.
- **Desfoque do topo ao rolar** é feito com três camadas de desfoque cada vez mais
  fracas + degradê, porque o React Native não tem máscara de desfoque; no
  Android fica só o degradê.
