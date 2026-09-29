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

- **"Queimadas" virou "Déficit"** (ou "Superávit"). Desde a etapa 2 do treino, o
  fator de atividade é só a rotina de trabalho, e as kcal de cada treino entram
  à parte, no orçamento do dia em que ele foi feito (linha "Treino +X kcal").
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

- `treino-central.png` — calendário normal, treino do dia em destaque (miniaturas com o mapa muscular e botão neon), atalhos Novo treino / Exercícios / Aeróbico, divisão da semana (A, B, C…).
- `treino-semana.png` — números da semana, volume dos últimos 7 dias, próximos treinos e concluídos.
- `treino-biblioteca.png` — biblioteca (SPEC etapa 1): busca por nome e nomes alternativos, filtros por músculo e equipamento, corpo tocável para filtrar e miniatura com o mapa muscular.
- `treino-exercicio.png` — detalhe do exercício: mapa muscular (principal em verde neon, secundários em verde claro, botão de virar), músculos, equipamento, "Como fazer" e histórico. Quando houver GIF licenciado, ele entra no lugar do mapa.

## Treino (etapa 2: plano da semana, sessões e calorias)

- `treino-dia.png` — semana de segunda a domingo com pílulas só do dia (ponto = treino a fazer, anel = hoje, apagado = descanso) e o cartão do dia escolhido: nome, exercícios com o mapa muscular, séries × repetições, duração e kcal estimadas, "Começar treino" (vale para qualquer dia).
- `treino-semana-feito.png` — treino de segunda feito na terça: a segunda fica verde com ✓ e "feito na terça"; o calendário não muda sozinho.
- `inicio-treino-kcal.png` — as kcal do treino entram no orçamento do dia em que ele foi feito ("Treino +130 kcal no orçamento de hoje").
- `treino-meus-treinos.png` — Meus treinos: um ativo por vez; ativar, duplicar e apagar.
- `rotina-trabalho.png` — rotina de trabalho (sentada, dinâmica, pesada) no lugar do nível de atividade; o treino não entra mais no fator.

## Treino (etapa 3: montar do meu jeito)

- `treino-editor-dias.png` — nome do plano (padrão "Meu treino") e os dias de segunda a domingo.
- `treino-editor-dia.png` — editor do dia: abas dos dias (✓ = montado, ponto laranja = vazio), nome do treino com sugestões, exercícios na ordem com subir/descer/tirar, "Adicionar exercícios" (vários de uma vez), copiar para outro dia e limpar o dia. O salvar só libera quando todo dia tem exercício.
- `treino-editor-exercicio.png` — editar um exercício: séries, repetições em faixa ou número fixo, descanso (45 a 180 s), carga inicial e observação.
- `treino-editor-copiar.png` — copiar o treino para outro dia (dia de descanso vira dia de treino; dia montado é substituído, com confirmação).
- `treino-criar-exercicio.png` — "Não achou? Criar exercício": nome, músculo principal e equipamento; fica só na biblioteca da pessoa.
- Reordenar é com os botões de subir e descer (sem arrastar), para não depender de biblioteca nova.
