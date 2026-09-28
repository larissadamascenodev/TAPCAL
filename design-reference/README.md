# design-reference

Mockups aprovados do TapCal. **Nenhuma tela é construída sem o mockup dela aqui.**

| Arquivo | Telas | Fase |
| --- | --- | --- |
| `v4.html` / `.png` | **Atual**: Início, Alimentação (Refeições, Plano, Receitas, Mercado) e Resultados | redesenho |
| `inicio.html` / `.png` | Início original (layout substituído pela v4) | 3 |
| `alimentacao.html` / `.png` | Alimentação original e resultado da foto (scanner) | 3 e 4 |
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
  brancos e linha de varredura, hoje verde). As etiquetas dos alimentos ficam em fila
  sobre a foto, porque a IA não devolve a posição de cada alimento.

## v4 (atual)

Mockup interativo em `v4.html`; `v4.png` mostra as seis telas.

- **Início**: saudação e chama da sequência no topo (o anel em volta da chama
  mostra quanto falta para fechar 7 dias seguidos); datas com o dia da semana em
  cima e um anel branco no dia de hoje que fecha conforme as horas passam;
  velocímetro de 44 cápsulas com a meta do dia no centro e consumidas, faltam e
  déficit embaixo; macros em barras direto na tela; atalhos das refeições;
  água e treino em quadradinhos; peso.
- **Alimentação** abre como página, com as abas Refeições, Plano, Receitas e
  Mercado fixas no topo (pílula branca na aba ativa).
  - Refeições: o dia em linha do tempo, cada refeição no seu horário.
  - Plano, Receitas e Mercado: **só visual, com dados de exemplo** (`src/data`).
    O plano feito pela IA, as receitas de fontes confiáveis e a lista gerada do
    plano ganham funcionamento real numa fase própria.
- **Resultados**: nova aba com progresso, evolução do peso, dados iniciais e
  metas calculadas.
- **Barra de baixo** só com ícones: Início, Alimentação, Treino, Resultados e o +.
- Sem mascote e sem os atalhos Jornada, Receitas, Mercado, Caneta e Relatórios
  no topo da Início. A Caneta volta com o módulo dela (fase 8).
- **Fotos**: refeições e receitas usam um prato de vidro com o emoji do
  alimento no lugar de foto, até termos fotos com licença de uso.
- **Toque duas vezes no velocímetro** abre o scanner.
- **Desfoque do topo ao rolar** é feito com três camadas de desfoque cada vez mais
  fracas + degradê, porque o React Native não tem máscara de desfoque; no
  Android fica só o degradê.
