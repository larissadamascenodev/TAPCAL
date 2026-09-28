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
  Mercado fixas no topo (pílula branca na aba ativa). No app ficaram só Refeições e Plano.
  - Refeições: o dia em linha do tempo, cada refeição no seu horário.
  - Plano: por enquanto mostra "em breve"; o plano feito pela IA ganha uma
    fase própria. Receitas e Mercado saíram do app por ora (continuam no
    mockup como referência para quando voltarem).
- **Resultados**: nova aba com progresso, evolução do peso, dados iniciais e
  metas calculadas.
- **Fundo**: duas manchas de verde bem suaves atrás de todas as telas, para os
  cartões de vidro fosco (7% de branco, borda de 14–22%, desfoque médio) terem
  o que desfocar.
- **Barra de baixo** só com ícones: Início, Alimentação, Treino, Resultados e o +.
- Sem mascote e sem os atalhos Jornada, Receitas, Mercado, Caneta e Relatórios
  no topo da Início. A Caneta volta com o módulo dela (fase 8).
- **Fotos**: refeições e receitas usam um prato de vidro com o emoji do
  alimento no lugar de foto, até termos fotos com licença de uso.
- **Toque duas vezes no velocímetro** abre o scanner.
- **Desfoque do topo ao rolar** é feito com três camadas de desfoque cada vez mais
  fracas + degradê, porque o React Native não tem máscara de desfoque; no
  Android fica só o degradê.

## Adicionar e editar alimento (vidro premium)

- `manual-busca.png` — busca na tabela TACO: selo, título em maiúsculas, campo de vidro, lista com linhas finas, "Digitar à mão" no rodapé.
- `manual-porcao.png` — porção do alimento escolhido: refeição, seletor de porção compacto (pílula com − e +, gramas digitáveis, porções prontas), CALORIAS grandes com barrinhas e o botão neon.
- `manual-digitar.png` — digitar à mão: só o nome; aparecem sugestões da tabela TACO e o botão "Calcular com IA". Ninguém digita macros.
- `manual-digitar-ia.png` — valores prontos (da tabela ou estimados pela IA), com "Trocar", porção e resumo.
- `editar-alimento.png` — editar alimento registrado, na folha de vidro do resultado do scanner.
- Botão principal (CONTINUAR, SALVAR): pílula de vidro escuro com borda neon (verde neon e menta) girando.

## Treino (etapa 1: central, treino personalizado e biblioteca)

- `treino-central.png` — calendário normal, treino do dia em destaque (miniaturas dos exercícios e botão neon), atalhos Novo treino / Exercícios / Aeróbico, divisão da semana (A, B, C…).
- `treino-semana.png` — números da semana, volume dos últimos 7 dias, próximos treinos e concluídos.
- `treino-biblioteca.png` — biblioteca com busca, mapa do corpo (frente/costas) e filtros por músculo.
- `treino-exercicio.png` — detalhe do exercício com a animação (fotos de início e fim alternando).
- `treino-novo-dias.png` / `treino-novo-revisao.png` — criar treino personalizado: dias → divisão → foco → revisão com os exercícios de cada treino.
