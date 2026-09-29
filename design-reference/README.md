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

- Treino de segunda feito na terça: a segunda fica verde com ✓ e "feito na terça"; o calendário não muda sozinho. (As telas da aba foram refeitas: ver "Aba Treino v2".)
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

## Treino (etapa 4: progressão de carga)

- `treino-progressao-subir.png` — o campo Carga já vem com a carga nova e, embaixo, a linha verde com o motivo ("Suba para 60 kg: você fez 10, 10, 10, 10 na última vez").
- `treino-progressao-manter.png` — manter ou reduzir aparecem na mesma linha, em cinza ("Mantenha 55 kg e busque 10 repetições").
- A linha só aparece antes da primeira série do exercício; depois disso, os campos seguem a última série feita.

## Treino (etapa 5: treino com IA)

- `treino-ia-foco.png` — uma pergunta por tela, com a barra de progresso e "Pergunta X de Y". No foco, o corpo de frente e de costas acende os músculos escolhidos.
- `treino-ia-lesao.png` — lesões com o aviso de que o app não substitui um profissional.
- `treino-ia-resultado.png` — "Seu treino está pronto": a semana, um card por dia (séries × repetições), "Por que esse treino" com a explicação e os números das regras, e "De onde vêm os números" (expansível). Botões: Começar a usar, Gerar outro e Editar. Etiqueta "Exemplo" quando o Supabase não está configurado; aviso discreto quando a IA não respondeu e as regras escolheram.
- `treino-ia-alivio.png` — 5ª semana do bloco: aviso "Semana de alívio: menos séries, mesma técnica" e o card "Montar a próxima fase".
- As telas de apoio ("Você vê os músculos de cada exercício" e "De onde vêm os números") aparecem só na primeira vez.

## Aba Treino v4 ("Foco no dia" + linha do tempo, com os ajustes)

Escolha feita entre as opções em `opcoes-treino/` (A, B e C): o topo da C e a linha do tempo da B, sem cartões.

- `treino-v4-hoje.png` — biblioteca (livro) e Meus treinos no topo; semana com o anel de hoje; "HOJE · TERÇA-FEIRA · N EXERCÍCIOS", o nome do treino e o corpo grande com os músculos do dia. Sem minutos/kcal e sem tempo antes de começar; só o "Iniciar treino".
- `treino-v4-em-andamento.png` — depois de "Iniciar treino", o botão sai do destaque e aparece o card "Treino em andamento" logo abaixo: ponto ao vivo, tempo grande com pausar/continuar, exercício atual com a série da vez (2/4) e a barra de séries. Tocar no card abre o treino ao vivo. Vendo outro dia, o card mostra também o nome do treino.
- `treino-v4-linha-do-tempo.png` — linha do tempo refeita: pontos maiores (40); o exercício atual é um círculo aberto e tracejado que vai fechando em verde a cada série; ao terminar, vira o selo verde com o ✓ (entra com um "pop" quando a pessoa volta para a lista) e a linha verde desce até o próximo. Tocar numa série abre o treino ao vivo nesse exercício (não há mais registro pela lista).
- `treino-v4-semana-mapa.png` — aba Semana: esta semana ou 30 dias; treinos, tempo e kcal; mapa de calor do corpo (frente e costas) e músculos mais trabalhados; treinos mais feitos; volume por dia.
- `treino-v4-semana-listas.png` — próximos e concluídos abrem na própria aba (exercícios planejados; séries feitas com carga × repetições).
- `treino-v4-adicionar.png` — "+ Adicionar exercício" no fim da linha do tempo (abre a biblioteca; vale para qualquer plano, inclusive o da IA).
- `treino-v4-editar.png` — segurar um exercício (ou tocar em "Editar") abre o modo de edição: remover (−) e mudar a ordem (setas). Arrastar o exercício para o lado também mostra "Remover". As mudanças ficam no plano.
- `treino-v4-semana-radar.png` — "Por grupos musculares": radar com as séries de Costas, Ombros, Abdômen, Braços, Peito e Pernas (referência enviada). Abaixo, "Por exercício" com a maior carga e as séries de cada um.
- `treino-sessao-v5.png` — treino ao vivo: traços de progresso por exercício (enchem conforme as séries), palco de vidro com o corpo e os músculos, "Última vez / Recorde / Meta", a sugestão de carga e os ajustes grandes de carga e repetições.
- `treino-sessao-v5-descanso.png` — ao concluir uma série, o descanso aparece no lugar do corpo: anel em contagem regressiva, a próxima série (carga × repetições) e −15 s / Pular / +15 s.
- `treino-sessao-v5-series.png` — séries feitas em linha do tempo (nós verdes com ✓, carga × repetições e a hora); segurar uma série apaga.
- Tom: escuro e vidro; verde só em detalhes.

## Treino — layout aplicado (tema e vidro atuais do app)

Layout do mockup `treino-v7/`, com o tema e o vidro que já valem na Início e na Alimentação; verde só em detalhes. Imagens em `treino-aplicado/`.

- `1-antes-de-iniciar.png` — dia, nome do treino (até 2 linhas), músculos com as cores do corpo e o número de exercícios; corpo à direita; "Iniciar treino".
- `2-em-andamento.png` / `2b-descansando.png` — treino rodando: no lugar do topo, o card do exercício atual ("AGORA · SÉRIE 2 DE 4", nome e um tracinho por série — feitas em branco, a atual em verde) com o tempo solto à direita. A linha verde dá uma volta no card a cada minuto. No descanso, o tempo vira o descanso e a linha (branca) conta o descanso. Tocar abre o treino ao vivo. Mockups em `ao-vivo/card-v2.html` (opção C aprovada, com o tempo solto).
- `3-lista.png` — linha do tempo só com o exercício e "N de M séries"; atual tracejado fechando a cada série, feito com selo ✓. Segurar e arrastar muda a ordem.
- `4-resumo-exercicio.png` — tocar num exercício abre o resumo no meio da tela: tempo, séries, volume, séries com descanso e recorde, última vez.
- `5-editar.png` — Editar: alça para arrastar e deslizar para remover (sem setas).
- `6-ao-vivo.png` / `7-descanso.png` — treino ao vivo: corpo solto, faixa última vez/recorde/meta, carga e repetições lado a lado (cargas inteiras, de 2 em 2 kg), séries em linha do tempo; descanso no mostrador de traços com −15 / Pular / +15.

- `2c-concluir-serie.png` — "Concluir série" embaixo do card abre o modal no meio da tela: carga (de 2 em 2 kg) e repetições, concluir ou "Pular este exercício". No descanso, o botão vira −15 s | Pular descanso | +15 s. A linha em volta do card desliza sem pulos, começando no canto de cima à esquerda.
- `3-lista.png` (atualizado) — lista em cartões (modelo A de `lista-exercicios/`): o atual com borda verde e os tracinhos das séries, feitos apagados com ✓, pulados apagados com "Pulado".
- `2d-concluido.png` — ao concluir a última série (ou pular o último exercício) o treino se fecha sozinho: o botão some e o card vira "✓ TREINO CONCLUÍDO", com o nome, exercícios · séries · kcal e o tempo total; a linha em volta fica fechada. No card em andamento, tocar à esquerda abre o exercício e tocar no tempo (ícone ⏸/▶ embaixo) pausa ou continua. O botão "Concluir série" tem um trecho de luz verde deslizando devagar em volta.
- `2e-pausado.png` — embaixo do card: botão redondo de pausar/continuar (verde quando pausado) e "✓ Concluir série" em branco, sem luz girando (a luz fica só no botão do modal, mais sutil: um fio claro com brilho fraco dando a volta devagar).
- `8-pilula-no-topo.png` — com um treino aberto, as outras abas (Início, Alimentação, Resultados) mostram no meio do topo a pílula com o tempo (ou o descanso, ponto branco); tocar abre o treino ao vivo e o ícone ⏸/▶ pausa ou continua.
